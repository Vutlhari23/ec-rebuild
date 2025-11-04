from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # student, teacher
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    submissions = relationship("TestSubmission", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)


class Test(Base):
    __tablename__ = "tests"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    duration_minutes = Column(Integer)
    total_marks = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    subject = relationship("Subject")
    questions = relationship(
        "Question",
        back_populates="test",
        lazy="selectin"
    )
    submissions = relationship("TestSubmission", back_populates="test")


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"))
    question_type = Column(String)
    question_text = Column(Text)
    options = Column(JSON, nullable=True)
    correct_answer = Column(String, nullable=True)
    marks = Column(Integer)
    order_index = Column(Integer)
    
    test = relationship("Test", back_populates="questions")


class TestSubmission(Base):
    __tablename__ = "test_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    time_taken_minutes = Column(Integer)
    total_marks_obtained = Column(Integer, nullable=True)
    
    # ✅ Relationships
    answers = relationship("SubmissionAnswer", back_populates="submission")
    test = relationship("Test", back_populates="submissions")
    student = relationship("User", back_populates="submissions")


class SubmissionAnswer(Base):
    __tablename__ = "submission_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("test_submissions.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer = Column(Text)
    marks_obtained = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    
    submission = relationship("TestSubmission", back_populates="answers")
    question = relationship("Question")
