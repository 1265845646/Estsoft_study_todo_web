// src/api/todosApi.js
import { api } from "./apiClient";

/**
 * GET /todos?filter=today|week|incomplete
 * filter 없으면 전체(내 todos) 조회
 */
export async function getTodos(filter) {
  const res = await api.get("/todos", {
    params: filter ? { filter } : {},
  });
  // 백 응답: { ok: true, todos: [...] }
  return res.data.todos;
}

/**
 * POST /todos
 * data: { title, due_date, category_id?, content? }
 */
export async function createTodo(data) {
  const res = await api.post("/todos", data);
  // 백 응답: { ok: true, todo: {...} }
  return res.data.todo;
}

/**
 * PUT /todos/:id
 * data: { title, due_date, category_id?, content? }
 */
export async function updateTodo(id, data) {
  const res = await api.put(`/todos/${id}`, data);
  return res.data.todo;
}

/**
 * PATCH /todos/:id/complete
 * 완료/미완료 토글
 */
export async function toggleTodoComplete(id) {
  const res = await api.patch(`/todos/${id}/complete`);
  return res.data.todo;
}

/**
 * DELETE /todos/:id
 */
export async function deleteTodo(id) {
  const res = await api.delete(`/todos/${id}`);
  return res.data; // { ok: true, message: "삭제 완료" }
}
