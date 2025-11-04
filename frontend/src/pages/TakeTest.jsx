import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { Editor } from "@monaco-editor/react";
import { testAPI } from "../services/api";

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState({});
  const [runOutputs, setRunOutputs] = useState({});
  const [fileSystems, setFileSystems] = useState({});
  const [jarFiles, setJarFiles] = useState({}); // New: store uploaded jars per question

  const RUN_API_URL = "http://localhost:8001/run";

  // === FETCH TEST DETAILS ===
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await testAPI.getTest(testId);
        const fetchedTest = response.data;
        setTest(fetchedTest);
        setTimeLeft(fetchedTest.duration_minutes * 60);

        const initialAnswers = {};
        const initialFS = {};
        const initialOutputs = {};
        const initialJars = {};

        fetchedTest.questions.forEach((q) => {
          if (q.question_type === "coding") {
            const savedFS =
              JSON.parse(localStorage.getItem(`fs_${q.id}`)) || null;
            const savedRun =
              JSON.parse(localStorage.getItem(`run_${q.id}`)) || null;
            const savedJars =
              JSON.parse(localStorage.getItem(`jar_${q.id}`)) || null;

            initialAnswers[q.id] = "";
            initialAnswers[q.id + "_language"] = savedFS?.language || "python";

            initialFS[q.id] = savedFS || {
              language: "python",
              activeFile: "main.py",
              files: { "main.py": "" },
            };

            if (savedRun) initialOutputs[q.id] = savedRun;
            if (savedJars) initialJars[q.id] = savedJars;
          } else {
            initialAnswers[q.id] = "";
          }
        });

        setAnswers(initialAnswers);
        setFileSystems(initialFS);
        setRunOutputs(initialOutputs);
        setJarFiles(initialJars);
      } catch (err) {
        console.error("Error fetching test:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // === TIMER ===
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && test) handleSubmit();
  }, [timeLeft, test]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // === SUBMIT TEST ===
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = {
        test_id: parseInt(testId),
        answers: test.questions.map((q) => ({
          question_id: q.id,
          answer: answers[q.id] || "",
        })),
        time_taken_minutes: test.duration_minutes - Math.ceil(timeLeft / 60),
      };

      await testAPI.submitTest(testId, data);
      navigate("/my-submissions", {
        state: { message: "Test submitted successfully!" },
      });
    } catch (err) {
      console.error("Submit error:", err);
      alert("Error submitting test");
    } finally {
      setSubmitting(false);
    }
  };

  // === FILE SYSTEM HANDLERS ===
  const addFile = (qid) => {
    const fs = { ...fileSystems };
    const name = prompt("Enter new filename (e.g., helper.py):");
    if (name && !fs[qid].files[name]) {
      fs[qid].files[name] = "";
      fs[qid].activeFile = name;
      localStorage.setItem(`fs_${qid}`, JSON.stringify(fs[qid]));
      setFileSystems(fs);
    }
  };

  const deleteFile = (qid, filename) => {
    const fs = { ...fileSystems };
    if (Object.keys(fs[qid].files).length === 1)
      return alert("Keep at least one file.");
    delete fs[qid].files[filename];
    if (fs[qid].activeFile === filename)
      fs[qid].activeFile = Object.keys(fs[qid].files)[0];
    localStorage.setItem(`fs_${qid}`, JSON.stringify(fs[qid]));
    setFileSystems(fs);
  };

  const renameFile = (qid, oldName) => {
    const fs = { ...fileSystems };
    const newName = prompt("New filename:", oldName);
    if (newName && newName !== oldName) {
      fs[qid].files[newName] = fs[qid].files[oldName];
      delete fs[qid].files[oldName];
      if (fs[qid].activeFile === oldName) fs[qid].activeFile = newName;
      localStorage.setItem(`fs_${qid}`, JSON.stringify(fs[qid]));
      setFileSystems(fs);
    }
  };

  const changeFile = (qid, name, val) => {
    const fs = { ...fileSystems };
    fs[qid].files[name] = val;
    localStorage.setItem(`fs_${qid}`, JSON.stringify(fs[qid]));
    setFileSystems(fs);
  };

  const changeLanguage = (qid, lang) => {
    const fs = { ...fileSystems };
    fs[qid].language = lang;
    localStorage.setItem(`fs_${qid}`, JSON.stringify(fs[qid]));
    setFileSystems(fs);
    setAnswers((prev) => ({ ...prev, [qid + "_language"]: lang }));
  };

  // === HANDLE JAR UPLOAD ===
  const handleJarUpload = (qid, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // remove prefix
      const jars = { ...(jarFiles[qid] || {}), [file.name]: base64 };
      setJarFiles((prev) => ({ ...prev, [qid]: jars }));
      localStorage.setItem(`jar_${qid}`, JSON.stringify(jars));
    };
    reader.readAsDataURL(file);
  };

  // === RUN CODE WITH OPTIONAL JARS ===
  const runCode = async (question) => {
    const qid = question.id;
    const fs = fileSystems[qid];
    const language = fs.language;
    const filesObject = { ...fs.files };
    const payload = {
      language,
      entrypoint: fs.activeFile,
      files: filesObject,
      jars: jarFiles[qid] || undefined, // include jars if any
    };

    setRunning((r) => ({ ...r, [qid]: true }));

    try {
      const res = await fetch(RUN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const result = {
        output: data.output || "",
        error: data.error || null,
        success: data.success,
      };
      setRunOutputs((p) => ({ ...p, [qid]: result }));
      localStorage.setItem(`run_${qid}`, JSON.stringify(result));
    } catch (err) {
      const result = { output: "", error: String(err), success: false };
      setRunOutputs((p) => ({ ...p, [qid]: result }));
      localStorage.setItem(`run_${qid}`, JSON.stringify(result));
    } finally {
      setRunning((r) => ({ ...r, [qid]: false }));
    }
  };

  // === RENDER UI ===
  if (loading)
    return (
      <Box display="flex" justifyContent="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );

  if (!test)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Test not found</Alert>
      </Container>
    );

  const question = test.questions[currentQuestion];
  const fs = fileSystems[question.id] || {};

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">{test.title}</Typography>
        <Box display="flex" justifyContent="space-between">
          <Typography color="error">
            Time Left: {formatTime(timeLeft)}
          </Typography>
          <Typography>
            Question {currentQuestion + 1} / {test.questions.length}
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={currentQuestion} sx={{ mb: 4 }}>
        {test.questions.map((q, i) => (
          <Step key={q.id}>
            <StepLabel>{`Q${i + 1}`}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Question Panel */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">{question.question_text}</Typography>

        {question.question_type === "coding" && fs && (
          <Box sx={{ mt: 2 }}>
            {/* Language Selector + Run */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
              <FormControl sx={{ minWidth: 220 }} size="small">
                <InputLabel>Language</InputLabel>
                <Select
                  value={fs.language || "python"}
                  label="Language"
                  onChange={(e) => changeLanguage(question.id, e.target.value)}
                >
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="javascript">JavaScript</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                  <MenuItem value="cpp">C++</MenuItem>
                  <MenuItem value="c">C</MenuItem>
                  <MenuItem value="go">Go</MenuItem>
                  <MenuItem value="ruby">Ruby</MenuItem>
                  <MenuItem value="bash">Bash</MenuItem>
                </Select>
              </FormControl>

              {fs.language === "java" && (
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Upload JAR
                  <input
                    type="file"
                    hidden
                    accept=".jar"
                    onChange={(e) =>
                      handleJarUpload(question.id, e.target.files[0])
                    }
                  />
                </Button>
              )}

              <Button
                variant="contained"
                onClick={() => runCode(question)}
                disabled={running[question.id]}
              >
                {running[question.id] ? "Running..." : "Run"}
              </Button>
            </Box>

            {/* Display uploaded JARs */}
            {jarFiles[question.id] &&
              Object.keys(jarFiles[question.id]).length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Uploaded JARs:</Typography>
                  <List dense>
                    {Object.keys(jarFiles[question.id]).map((jarName) => (
                      <ListItem key={jarName}>
                        <ListItemText primary={jarName} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

            {/* File Manager + Editor + Output (unchanged) */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Paper sx={{ width: 200, maxHeight: 400, overflow: "auto" }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={1}
                >
                  <Typography variant="subtitle2">Files</Typography>
                  <IconButton size="small" onClick={() => addFile(question.id)}>
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
                <List dense>
                  {Object.keys(fs.files).map((file) => (
                    <ListItem
                      key={file}
                      button
                      selected={fs.activeFile === file}
                      onClick={() => {
                        const nfs = { ...fileSystems };
                        nfs[question.id].activeFile = file;
                        setFileSystems(nfs);
                        localStorage.setItem(
                          `fs_${question.id}`,
                          JSON.stringify(nfs[question.id])
                        );
                      }}
                    >
                      <ListItemText primary={file} />
                      <IconButton
                        size="small"
                        onClick={() => renameFile(question.id, file)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteFile(question.id, file)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <Box
                sx={{
                  flexGrow: 1,
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Editor
                  height="400px"
                  theme="vs-light"
                  language={fs.language}
                  value={fs.files[fs.activeFile] || ""}
                  onChange={(val) =>
                    changeFile(question.id, fs.activeFile, val || "")
                  }
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Output:</Typography>
              <Paper
                sx={{
                  p: 1,
                  mt: 1,
                  background: "#f9f9f9",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                }}
              >
                {runOutputs[question.id]?.output && (
                  <Typography>{runOutputs[question.id].output}</Typography>
                )}
                {runOutputs[question.id]?.error && (
                  <Typography color="error">
                    {runOutputs[question.id].error}
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        {currentQuestion === test.questions.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default TakeTest;
