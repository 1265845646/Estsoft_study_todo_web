import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import SignupPage from "../pages/Auth/SignupPage.jsx";
import TodoPage from "../pages/Todos/TodoPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRouter({ booting }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/todos" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/todos"
        element={
          <ProtectedRoute booting={booting}>
            <TodoPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/todos" replace />} />
    </Routes>
  );
}
