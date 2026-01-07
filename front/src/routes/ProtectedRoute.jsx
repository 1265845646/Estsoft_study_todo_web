import { Navigate } from "react-router-dom";
import { getAccessToken } from "../api/tokenStore";

export default function ProtectedRoute({ booting, children }) {
  // ✅ 세션 복구 중이면 판정 보류
  if (booting) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        세션 확인 중...
      </div>
    );
  }

  const token = getAccessToken();
  if (!token) return <Navigate to="/login" replace />;

  return children;
}
