// src/api/categoriesApi.js
import { api } from "./apiClient";

// ✅ 내 카테고리 목록 조회
export async function getCategories() {
  const res = await api.get("/categories");
  // 백 응답: { ok: true, categories: [...] }
  return res.data.categories;
}

// ✅ 카테고리 생성
export async function createCategory(name) {
  const res = await api.post("/categories", { name });
  // 백 응답: { ok: true, category: {...} }
  return res.data.category;
}

// ✅ 카테고리 수정
export async function updateCategory(id, name) {
  const res = await api.put(`/categories/${id}`, { name });
  return res.data.category;
}

// ✅ 카테고리 삭제
export async function deleteCategory(id) {
  const res = await api.delete(`/categories/${id}`);
  return res.data; // { ok: true, message: "삭제 완료" }
}
