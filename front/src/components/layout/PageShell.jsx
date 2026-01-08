import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { logout } from "../../api/authApi";
import { clearAccessToken } from "../../api/tokenStore";

export default function PageShell({ title = "Task Manager", subtitle, children }) {
  const nav = useNavigate();

  async function handleLogout() {
    try {
      await logout(); // ✅ 서버: redis 정리 + refresh 쿠키 삭제
    } catch (e) {
      // 실패해도 프론트는 로그아웃 처리 계속
    } finally {
      clearAccessToken(); // ✅ 메모리 accessToken 제거
      nav("/login", { replace: true }); // ✅ 로그인 페이지로
    }
  }

  return (
    <div className="shell">
      <header className="shell__top">
  <div className="shell__centerTitle">
    <h1 className="shell__title">{title}</h1>
    {subtitle ? <p className="shell__subtitle">{subtitle}</p> : null}
  </div>

  <div className="shell__topRight">
    <Button variant="ghost" onClick={handleLogout}>
      Logout
    </Button>
  </div>
</header>


      <main className="shell__main">{children}</main>
    </div>
  );
}
