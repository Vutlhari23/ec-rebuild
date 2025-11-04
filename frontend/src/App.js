import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import SubjectTests from "./pages/SubjectTests";
import TakeTest from "./pages/TakeTest";
import CreateTest from "./pages/CreateTest";
import MySubmissions from "./pages/MySubmissions";
import Layout from "./components/Layout";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Layout>
                <Subjects />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects/:subjectId/tests"
          element={
            <ProtectedRoute>
              <Layout>
                <SubjectTests />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests/:testId/take"
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <TakeTest />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-test"
          element={
            <ProtectedRoute requiredRole="teacher">
              <Layout>
                <CreateTest />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-submissions"
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <MySubmissions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
