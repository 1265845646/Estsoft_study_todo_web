import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

import { api } from "../../api/apiClient";
import { setAccessToken } from "../../api/tokenStore";

export default function LoginPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState(
    "로그인에 실패했어요. 다시 시도해주세요."
  );

  async function handleLogin(e) {
    // ✅ Enter(폼 submit)로 들어와도 새로고침 안 되게
    if (e?.preventDefault) e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setModalMsg("이메일과 비밀번호를 입력해주세요.");
      setModalOpen(true);
      return;
    }

    // ✅ 연타/중복 submit 방지
    if (loading) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });

      // 백 응답: { ok: true, user: {...}, accessToken }
      const accessToken = res.data?.accessToken;
      if (!accessToken) {
        setModalMsg(
          "로그인 응답에 accessToken이 없습니다. 백엔드 응답을 확인해주세요."
        );
        setModalOpen(true);
        return;
      }

      setAccessToken(accessToken);
      nav("/todos");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "로그인에 실패했어요. 이메일/비밀번호를 확인하고 다시 시도해주세요.";

      setModalMsg(msg);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__title">Task Manager</h1>
        <p className="auth__subtitle">계정에 로그인해주세요</p>

        {/* ✅ Enter 누르면 로그인 되도록 form + onSubmit */}
        <form className="auth__form" onSubmit={handleLogin}>
          <label className="auth__label">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력해주세요"
            autoComplete="email"
          />

          <label className="auth__label">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력해주세요"
            autoComplete="current-password"
          />

          {/* ✅ 클릭도/엔터도 submit으로 통일 */}
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* ✅ 회원가입 링크 */}
        <p className="auth__subtext">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>

      {/* ✅ 실패 시 모달 */}
      {modalOpen && (
        <div className="modal">
          <div
            className="modal__backdrop"
            onClick={() => setModalOpen(false)}
          />
          <div className="modal__card">
            <h3 className="modal__title">로그인 실패</h3>
            <p className="modal__text">{modalMsg}</p>
            <div className="modal__actions">
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
