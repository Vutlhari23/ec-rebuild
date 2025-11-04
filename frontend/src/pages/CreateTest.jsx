import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { testAPI } from "../services/api";

// --- CreateTest Component ---
const CreateTest = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [subjects, setSubjects] = useState(["english"]);
  const [testData, setTestData] = useState({
    title: "",
    description: "",
    subject_id: "",
    duration_minutes: 60,
    total_marks: 0,
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question_type: "multiple_choice",
    question_text: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "",
    marks: 1,
    order_index: 0,
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [grammarMatches, setGrammarMatches] = useState([]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await testAPI.getSubjects();
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  const steps = ["Test Details", "Add Questions", "Review"];

  const handleTestDataChange = (field, value) => {
    setTestData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (optionKey, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: { ...prev.options, [optionKey]: value },
    }));
  };

  const addQuestion = (question = currentQuestion) => {
    if (!question.question_text) {
      setError("Question text is required");
      return;
    }
    if (
      question.question_type === "multiple_choice" &&
      !question.correct_answer
    ) {
      setError("Please select a correct answer");
      return;
    }

    const newQuestion = {
      ...question,
      order_index: testData.questions.length,
    };

    setTestData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      total_marks: prev.total_marks + newQuestion.marks,
    }));

    setCurrentQuestion({
      question_type: "multiple_choice",
      question_text: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_answer: "",
      marks: 1,
      order_index: testData.questions.length + 1,
    });

    setError("");
    setGrammarMatches([]);
  };

  const removeQuestion = (index) => {
    const removedMark = testData.questions[index].marks;
    setTestData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
      total_marks: prev.total_marks - removedMark,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await testAPI.createTest(testData);
      setSuccess("Test created successfully!");
      setTestData({
        title: "",
        description: "",
        subject_id: "",
        duration_minutes: 60,
        total_marks: 0,
        questions: [],
      });
      setGeneratedQuestions([]);
      setActiveStep(0);
    } catch (error) {
      setError(
        "Error creating test: " +
          (error.response?.data?.detail || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // --- PDF Question Generation ---
  const generateQuestionsFromPdf = async () => {
    if (!pdfFile) {
      setError("Please select a PDF file first");
      return;
    }
    setPdfLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);

      const response = await axios.post(
        "http://localhost:8004/upload-pdf",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success && Array.isArray(response.data.questions)) {
        const validQuestions = response.data.questions.filter(
          (q) => q.question_text && Object.keys(q.options || {}).length > 0
        );

        setGeneratedQuestions(validQuestions);
        setSuccess("Questions generated from PDF successfully!");
      } else {
        setError("No valid questions returned from PDF");
      }
    } catch (err) {
      setError("Error generating questions from PDF: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // --- Grammar Check ---
  const checkGrammar = async (text) => {
    if (text.trim().length < 5) {
      setGrammarMatches([]);
      return;
    }

    try {
      const res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text,
          language: "en-US",
        }),
      });

      const data = await res.json();
      setGrammarMatches(data.matches || []);
    } catch (err) {
      console.error("Grammar check failed:", err);
    }
  };

  // --- Highlight grammar errors in input ---
  const getHighlightedText = (text) => {
    if (!grammarMatches.length) return text;

    let parts = [];
    let lastIndex = 0;

    grammarMatches.forEach((match, idx) => {
      if (match.offset > lastIndex) {
        parts.push(text.substring(lastIndex, match.offset));
      }
      parts.push(
        <span key={idx} style={{ textDecoration: "underline wavy red" }}>
          {text.substring(match.offset, match.offset + match.length)}
        </span>
      );
      lastIndex = match.offset + match.length;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // --- Steps Content ---
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Test Title"
              value={testData.title}
              onChange={(e) => handleTestDataChange("title", e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={testData.description}
              onChange={(e) =>
                handleTestDataChange("description", e.target.value)
              }
              margin="normal"
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Subject</InputLabel>
              <Select
                value={testData.subject_id}
                label="Subject"
                onChange={(e) =>
                  handleTestDataChange("subject_id", e.target.value)
                }
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
                <MenuItem value="english">english</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={testData.duration_minutes}
              onChange={(e) =>
                handleTestDataChange(
                  "duration_minutes",
                  parseInt(e.target.value)
                )
              }
              margin="normal"
              required
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <FormLabel>Question Type</FormLabel>
              <RadioGroup
                row
                value={currentQuestion.question_type}
                onChange={(e) =>
                  handleQuestionChange("question_type", e.target.value)
                }
              >
                <FormControlLabel
                  value="multiple_choice"
                  control={<Radio />}
                  label="Multiple Choice"
                />
                <FormControlLabel
                  value="coding"
                  control={<Radio />}
                  label="Coding"
                />
              </RadioGroup>
            </FormControl>

            {/* Question Text with Inline Grammar Highlight */}
            <TextField
              fullWidth
              label="Question Text"
              multiline
              rows={3}
              spellCheck
              value={currentQuestion.question_text}
              onChange={(e) => {
                const value = e.target.value;
                handleQuestionChange("question_text", value);
                clearTimeout(window.grammarTimer);
                window.grammarTimer = setTimeout(
                  () => checkGrammar(value),
                  800
                );
              }}
              margin="normal"
              required
              InputProps={{
                sx: {
                  whiteSpace: "pre-line",
                  "& input, & textarea": {
                    textDecoration: grammarMatches.length
                      ? "underline wavy red"
                      : "none",
                  },
                },
              }}
            />

            {grammarMatches.length > 0 && (
              <Alert
                severity="info"
                sx={{
                  whiteSpace: "pre-line",
                  mt: 1,
                }}
              >
                {grammarMatches.map((m, idx) => (
                  <div key={idx}>• {m.message}</div>
                ))}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Marks"
              type="number"
              value={currentQuestion.marks}
              onChange={(e) =>
                handleQuestionChange("marks", parseInt(e.target.value))
              }
              margin="normal"
              required
            />

            {currentQuestion.question_type === "multiple_choice" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Options
                </Typography>
                {["A", "B", "C", "D"].map((option) => (
                  <TextField
                    key={option}
                    fullWidth
                    label={`Option ${option}`}
                    value={currentQuestion.options[option]}
                    onChange={(e) => handleOptionChange(option, e.target.value)}
                    margin="normal"
                  />
                ))}
                <FormControl fullWidth margin="normal">
                  <FormLabel>Correct Answer</FormLabel>
                  <RadioGroup
                    row
                    value={currentQuestion.correct_answer}
                    onChange={(e) =>
                      handleQuestionChange("correct_answer", e.target.value)
                    }
                  >
                    {["A", "B", "C", "D"].map((option) => (
                      <FormControlLabel
                        key={option}
                        value={option}
                        control={<Radio />}
                        label={`Option ${option}`}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => addQuestion()}
              sx={{ mt: 2 }}
            >
              Add Question
            </Button>

            {/* PDF Upload Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Generate Questions from PDF
              </Typography>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
              />
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={generateQuestionsFromPdf}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Generate Questions"
                )}
              </Button>

              {generatedQuestions.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1">
                    Generated Questions
                  </Typography>
                  <List>
                    {generatedQuestions.map((q, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={q.question_text}
                          secondary={`Type: ${q.question_type} | Marks: ${q.marks}`}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            addQuestion(q);
                            setGeneratedQuestions((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          Add
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>

            {/* Added Questions List */}
            {testData.questions.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Added Questions ({testData.questions.length})
                </Typography>
                <List>
                  {testData.questions.map((question, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Q${
                          index + 1
                        }: ${question.question_text.substring(0, 50)}...`}
                        secondary={`Type: ${question.question_type} | Marks: ${question.marks}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => removeQuestion(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Test Summary
            </Typography>
            <Typography>
              <strong>Title:</strong> {testData.title}
            </Typography>
            <Typography>
              <strong>Description:</strong> {testData.description}
            </Typography>
            <Typography>
              <strong>Duration:</strong> {testData.duration_minutes} minutes
            </Typography>
            <Typography>
              <strong>Total Marks:</strong> {testData.total_marks}
            </Typography>
            <Typography>
              <strong>Questions:</strong> {testData.questions.length}
            </Typography>

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
              Questions
            </Typography>
            {testData.questions.map((question, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">
                  Q{index + 1}: {question.question_text}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Type: {question.question_type} | Marks: {question.marks}
                </Typography>
                {question.question_type === "multiple_choice" && (
                  <Typography variant="body2">
                    Correct Answer: {question.correct_answer}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        );

      default:
        return "Unknown step";
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && (!testData.title || !testData.subject_id)) {
      setError("Please fill in all required fields");
      return;
    }
    setActiveStep((prev) => prev + 1);
    setError("");
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Create New Test
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || testData.questions.length === 0}
              >
                {loading ? "Creating..." : "Create Test"}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateTest;
