from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import shutil
import os
from sqlalchemy.orm import selectinload

from database import get_db
from models import Test, Subject, Question, User, TestSubmission, SubmissionAnswer
from schemas import (
    TestCreate, Test as TestSchema, TestSubmissionCreate, TestSubmission as TestSubmissionSchema,
    Subject as SubjectSchema
)
from auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/subjects/")
async def get_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).where(Subject.is_active == True))
    subjects = result.scalars().all()
    return subjects

@router.get("/subjects/{subject_id}/tests", response_model=List[TestSchema])
async def get_tests_by_subject(subject_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Test).where(Test.subject_id == subject_id, Test.is_active == True)
    )
    tests = result.scalars().all()
    return tests

@router.get("/tests/{test_id}", response_model=TestSchema)
async def get_test(test_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Test).where(Test.id == test_id, Test.is_active == True)
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Load questions
    result = await db.execute(
        select(Question).where(Question.test_id == test_id).order_by(Question.order_index)
    )
    test.questions = result.scalars().all()
    
    return test

@router.post("/tests/", response_model=TestSchema)
async def create_test(
    test: TestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create tests")
    
    db_test = Test(
        title=test.title,
        description=test.description,
        subject_id=test.subject_id,
        created_by=current_user.id,
        duration_minutes=test.duration_minutes,
        total_marks=test.total_marks
    )
    db.add(db_test)
    await db.flush()  # Get the test ID
    
    for q in test.questions:
        db_question = Question(
            test_id=db_test.id,
            question_type=q.question_type,
            question_text=q.question_text,
            options=q.options,
            correct_answer=q.correct_answer,
            marks=q.marks,
            order_index=q.order_index
        )
        db.add(db_question)
    
    await db.commit()
    await db.refresh(db_test)
    
    # Load questions for response
    result = await db.execute(
        select(Question).where(Question.test_id == db_test.id).order_by(Question.order_index)
    )
    db_test.questions = result.scalars().all()
    
    return db_test

@router.post("/tests/{test_id}/upload-pdf")
async def upload_test_pdf(
    test_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can upload PDFs")
    
    # Verify test exists and belongs to teacher
    result = await db.execute(select(Test).where(Test.id == test_id, Test.created_by == current_user.id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Save PDF
    file_location = f"{UPLOAD_DIR}/test_{test_id}_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": file.filename, "location": file_location}

@router.post("/tests/{test_id}/submit", response_model=TestSubmissionSchema)
async def submit_test(
    test_id: int,
    submission: TestSubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit tests")

    # Verify test exists
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Create submission
    db_submission = TestSubmission(
        test_id=test_id,
        student_id=current_user.id,
        time_taken_minutes=submission.time_taken_minutes
    )
    db.add(db_submission)
    await db.flush()  # to get submission ID

    total_marks = 0
    answers_to_add = []

    for answer in submission.answers:
        # Get question
        result = await db.execute(select(Question).where(Question.id == answer.question_id))
        question = result.scalar_one_or_none()

        if question:
            is_correct = False
            marks_obtained = 0

            if question.question_type == "multiple_choice":
                is_correct = answer.answer == question.correct_answer
                marks_obtained = question.marks if is_correct else 0
            elif question.question_type == "coding":
                # Simplified placeholder grading
                is_correct = True
                marks_obtained = question.marks

            total_marks += marks_obtained

            answers_to_add.append(
                SubmissionAnswer(
                    submission_id=db_submission.id,
                    question_id=answer.question_id,
                    answer=answer.answer,
                    marks_obtained=marks_obtained,
                    is_correct=is_correct,
                )
            )

    db.add_all(answers_to_add)

    db_submission.total_marks_obtained = total_marks
    await db.commit()

    # Eager-load answers for response using selectinload
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(TestSubmission)
        .options(selectinload(TestSubmission.answers))
        .where(TestSubmission.id == db_submission.id)
    )
    db_submission = result.scalar_one()

    return db_submission




@router.get("/my-submissions/", response_model=List[TestSubmissionSchema])
async def get_my_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(TestSubmission)
        .options(
            selectinload(TestSubmission.answers),  # preload answers
            selectinload(TestSubmission.test)      # optional: preload test info too
        )
        .where(TestSubmission.student_id == current_user.id)
    )

    submissions = result.scalars().all()
    return submissions
