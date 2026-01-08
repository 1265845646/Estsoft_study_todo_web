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

  // ✅ 검증 규칙
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRuleText = "비밀번호는 최소 8자 이상, 특수문자 1개 이상 포함해야 합니다.";

  async function handleSignup() {
    const emailTrim = email.trim();
    const pw = password; // 비밀번호는 공백도 하나의 문자라 일단 그대로 두고 정책으로 체크

    // 1) 필수값
    if (!emailTrim || !pw) {
      setModalTitle("회원가입 실패");
      setModalMsg("이메일과 비밀번호를 입력해주세요.");
      setGoLoginOnClose(false);
      setModalOpen(true);
      return;
    }

    // 2) 이메일 형식
    if (!emailRegex.test(emailTrim)) {
      setModalTitle("회원가입 실패");
      setModalMsg("이메일 형식이 올바르지 않습니다.");
      setGoLoginOnClose(false);
      setModalOpen(true);
      return;
    }

    // 3) 비밀번호 정책: 8자 이상 + 특수문자 1개 이상
    const hasMinLen = pw.length >= 8;
    const hasSpecial = /[^A-Za-z0-9]/.test(pw); // 영문/숫자 제외 문자를 특수문자로 판단
    if (!hasMinLen || !hasSpecial) {
      setModalTitle("회원가입 실패");
      setModalMsg(passwordRuleText);
      setGoLoginOnClose(false);
      setModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        email: emailTrim,
        password: pw,
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
        <p className="auth__subtitle">새로운 계정을 생성합니다</p>

        <div className="auth__form">
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
            autoComplete="new-password"
          />

          {/* ✅ 비밀번호 정책 안내 (빨간색) */}
          <p className="auth__error">{passwordRuleText}</p>

          <Button variant="primary" onClick={handleSignup} disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </div>

        {/* ✅ 로그인으로 돌아가기 링크 */}
        <p className="auth__subtext">
          이미 계정이 있으신가요? <Link to="/login">로그인 하기</Link>
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
