import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { logout } from "../../api/authApi";
import { clearAccessToken } from "../../api/tokenStore";

export default function Header({ title = "Task Manager", subtitle }) {
  const nav = useNavigate();

  async function handleLogout() {
    try {
      await logout(); // ✅ 서버 세션 정리(쿠키 삭제 + redis 삭제)
    } catch (e) {
      // 실패해도 프론트는 로그아웃 처리 진행
    } finally {
      clearAccessToken(); // ✅ 메모리 토큰 제거
      nav("/login", { replace: true });
    }
  }

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">{title}</h1>
        {subtitle && <p className="header__subtitle">{subtitle}</p>}
      </div>

      <div className="header__right">
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
