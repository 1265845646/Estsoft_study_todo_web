import { useEffect } from "react";
import PageShell from "../../components/layout/PageShell";
import { getTodos } from "../../api/todosApi";

export default function TodoPage() {
  useEffect(() => {
    async function loadTodos() {
      try {
        // ✅ 인가(authMiddleware) 통과 테스트
        const todos = await getTodos();
        console.log("✅ todos 조회 성공:", todos);
      } catch (err) {
        console.error(
          "❌ todos 조회 실패:",
          err.response?.data || err.message
        );
      }
    }

    loadTodos();
  }, []);

  return (
    <PageShell subtitle="Plan your tasks and stay organized">
      <div className="board">
        {/* 왼쪽: 할 일 입력 + 카테고리 */}
        <section className="card">
          <h2 className="card__title">Add New Task</h2>
          <p>왼쪽: 입력 + 카테고리 선택 자리</p>
        </section>

        {/* 가운데: 캘린더 */}
        <section className="card">
          <h2 className="card__title">Calendar</h2>
          <p>가운데: 캘린더 자리</p>
        </section>

        {/* 오른쪽: 할 일 리스트 */}
        <section className="card">
          <h2 className="card__title">Tasks</h2>
          <p>오른쪽: 리스트 자리</p>
        </section>
      </div>
    </PageShell>
  );
}
