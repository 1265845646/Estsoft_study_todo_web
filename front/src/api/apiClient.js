// src/api/apiClient.js
import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore";

// ✅ 백엔드 주소 (Vite 환경변수 추천)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ refresh 쿠키 보내기 위해 필수
});

let isRefreshing = false;
let refreshQueue = [];

function subscribeRefresh(cb) {
  refreshQueue.push(cb);
}

function flushQueue(newToken) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

// ✅ 요청 인터셉터: accessToken 있으면 Authorization 자동 부착
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ 응답 인터셉터: access 만료면 refresh → 재시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;
    const original = error.config;

    // 네트워크 자체 에러 (서버 다운 등)
    if (!error.response) {
      return Promise.reject(error);
    }

    // ✅ accessToken 만료일 때만 refresh 시도
    const shouldRefresh = status === 401 && errorCode === "AUTH_EXPIRED_TOKEN";

    if (shouldRefresh && !original._retry) {
      original._retry = true;

      // 이미 refresh 진행 중이면 큐에서 대기했다가 재시도
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeRefresh((newToken) => {
            if (!newToken) return reject(error);
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;

      try {
        // ✅ refresh 호출: 쿠키는 자동으로 붙음(withCredentials=true)
        const r = await api.post("/auth/refresh", {});

        const newAccessToken = r.data?.accessToken;
        if (!newAccessToken) throw new Error("No accessToken from refresh");

        setAccessToken(newAccessToken);
        flushQueue(newAccessToken);

        // 원래 요청 재시도
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshErr) {
        // refresh 실패 → 완전 로그아웃 처리
        clearAccessToken();
        flushQueue(null);

        // 여기서 라우팅은 프로젝트 방식에 맞게 처리
        // 예: window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // ✅ refresh 대상이 아닌 401들: 세션 만료/위조 토큰 등 → 로그인 유도
    if (status === 401) {
      // 대표적으로: AUTH_SESSION_EXPIRED, AUTH_INVALID_TOKEN, AUTH_NO_TOKEN ...
      clearAccessToken();
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
