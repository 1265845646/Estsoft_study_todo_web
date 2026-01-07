import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

import { api } from "../../api/apiClient";

export default function SignupPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("알림");
  const [modalMsg, setModalMsg] = useState("");
  const [goLoginOnClose, setGoLoginOnClose] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password.trim()) {
      setModalTitle("회원가입 실패");
      setModalMsg("이메일과 비밀번호를 입력해주세요.");
      setGoLoginOnClose(false);
      setModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        email: email.trim(),
        password,
      });

      if (res.data?.ok) {
        // ✅ 성공 모달 → 확인 누르면 로그인으로
        setModalTitle("회원가입 성공");
        setModalMsg("회원가입에 성공했습니다!");
        setGoLoginOnClose(true);
        setModalOpen(true);
      } else {
        setModalTitle("회원가입 실패");
        setModalMsg("회원가입에 실패했습니다. 다시 시도해주세요.");
        setGoLoginOnClose(false);
        setModalOpen(true);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "회원가입에 실패했습니다. 다시 시도해주세요.";

      setModalTitle("회원가입 실패");
      setModalMsg(msg);
      setGoLoginOnClose(false);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    if (goLoginOnClose) {
      nav("/login", { replace: true });
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__title">Task Manager</h1>
        <p className="auth__subtitle">Create your account</p>

        <div className="auth__form">
          <label className="auth__label">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            autoComplete="email"
          />

          <label className="auth__label">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="new-password"
          />

          <Button variant="primary" onClick={handleSignup} disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </div>

        {/* ✅ 로그인으로 돌아가기 링크 */}
        <p className="auth__subtext">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      {/* ✅ 모달 */}
      {modalOpen && (
        <div className="modal">
          <div className="modal__backdrop" onClick={closeModal} />
          <div className="modal__card">
            <h3 className="modal__title">{modalTitle}</h3>
            <p className="modal__text">{modalMsg}</p>
            <div className="modal__actions">
              <Button variant="primary" onClick={closeModal}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
