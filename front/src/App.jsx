import { useEffect } from "react";
import { api } from "./api/apiClient";
import { setAccessToken } from "./api/tokenStore";

function App() {
  useEffect(() => {
    async function testCategories() {
      try {
        // ✅ 1. 앱 시작 시 refresh 한번 (메모리 accessToken 복구)
        const refreshRes = await api.post("/auth/refresh");
        if (refreshRes.data?.accessToken) {
          setAccessToken(refreshRes.data.accessToken);
          console.log("accessToken 복구 완료");
        }

        // ✅ 2. 카테고리 목록 호출 (authMiddleware 통과 테스트)
        const res = await api.get("/categories");
        console.log("카테고리 목록:", res.data);
      } catch (err) {
        console.error("에러:", err.response?.data || err.message);
      }
    }

    testCategories();
  }, []);

  return (
    <div>
      <h1>Todo App</h1>
      <p>콘솔을 열어 결과를 확인하세요.</p>
    </div>
  );
}

export default App;
