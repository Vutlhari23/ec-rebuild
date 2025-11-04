import axios from "axios";

const API_BASE_URL = "http://localhost:8000";
const API_BASE_URLL = "http://localhost:8004";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post("/auth/token", `username=${email}&password=${password}`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
    }),
  register: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
};

export const testAPI = {
  getSubjects: () => api.get("/api/subjects/"),
  getTestsBySubject: (subjectId) => api.get(`/api/subjects/${subjectId}/tests`),
  getTest: (testId) => api.get(`/api/tests/${testId}`),
  createTest: (testData) => api.post("/api/tests/", testData),

  uploadTestPDF: async (testId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(
        `/api/tests/${testId}/upload-pdf`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  },

  generateQuestionsFromPDF: (file) => {
    const formData = new FormData();
    formData.append("file", file); // must match FastAPI UploadFile name
    return api.post("http://localhost:8004/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  submitTest: (testId, submissionData) =>
    api.post(`/api/tests/${testId}/submit`, submissionData),

  getMySubmissions: () => api.get("/api/my-submissions/"),
};

// your FastAPI base URL

export default api;
