// src/api/authApi.js
import { api } from "./apiClient";

// ✅ 회원가입
export async function signup(email, password) {
  const res = await api.post("/auth/signup", { email, password });
  return res.data; // { ok: true, user: {...} }
}

// ✅ 로그인
export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data; // { ok: true, user, accessToken }
}

// ✅ 로그아웃
export async function logout() {
  const res = await api.post("/auth/logout", {});
  return res.data; // { ok: true, message: "로그아웃 완료" }
}