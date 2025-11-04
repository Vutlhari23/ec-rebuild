from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class Subject(SubjectBase):
    id: int
    is_active: bool
    created_by: Optional[int] = None

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_type: str
    question_text: str
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[str] = None
    marks: int
    order_index: int

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    test_id: int

    class Config:
        from_attributes = True

class TestBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: int
    duration_minutes: int
    total_marks: int

class TestCreate(TestBase):
    questions: List[QuestionCreate]

class Test(TestBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime
    questions: List[Question] = []

    class Config:
        from_attributes = True

class SubmissionAnswerBase(BaseModel):
    question_id: int
    answer: str

class TestSubmissionCreate(BaseModel):
    test_id: int
    answers: List[SubmissionAnswerBase]
    time_taken_minutes: int

class SubmissionAnswer(SubmissionAnswerBase):
    id: int
    marks_obtained: Optional[int] = None
    is_correct: Optional[bool] = None

    class Config:
        from_attributes = True

class TestSubmission(BaseModel):
    id: int
    test_id: int
    student_id: int
    submitted_at: datetime
    time_taken_minutes: int
    total_marks_obtained: Optional[int] = None
    answers: List[SubmissionAnswer] = []

    class Config:
        from_attributes = True