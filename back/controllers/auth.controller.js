import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";
import { redisClient } from "../redis/redisClient.js";


function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRES_IN || "15m",
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRES_IN || "7d",
  });
}

// ✅ 쿠키 옵션 (로컬: secure=false)
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/refresh", // refresh에만 쿠키 붙게
  };
}

export async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "email, password는 필수입니다." });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, token_version, created_at`,
      [email, hashed]
    );

    res.status(201).json({ ok: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, message: "이미 존재하는 이메일입니다." });
    }
    res.status(500).json({ ok: false, message: "회원가입 실패", error: err.message });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "email, password는 필수입니다." });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password, token_version
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    // ✅ Access는 tokenVersion 포함
    const accessPayload = { userId: user.id, tokenVersion: user.token_version };
    const accessToken = signAccessToken(accessPayload);

    // ✅ Refresh는 userId만 넣는 게 안전(버전 검증은 Redis/DB로)
    const refreshPayload = { userId: user.id };
    const refreshToken = signRefreshToken(refreshPayload);

    // ✅ Redis 저장
    const refreshTtl = 60 * 60 * 24 * 7;
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, { EX: refreshTtl });
    await redisClient.set(`user_version:${user.id}`, String(user.token_version), { EX: refreshTtl });

    // ✅ 쿠키에 refreshToken 심기 (프론트는 refreshToken을 몰라도 됨)
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    return res.json({
      ok: true,
      user: { id: user.id, email: user.email },
      accessToken,
      // ❌ refreshToken은 이제 body로 안 내려줌
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "로그인 실패", error: err.message });
  }
}

export async function refresh(req, res) {
  // ✅ 쿠키에서 받기
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ ok: false, errorCode: "AUTH_REFRESH_MISSING", message: "refreshToken이 필요합니다." });
  }

  try {
    // 1) refreshToken 검증
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = decoded.userId;

    // 2) Redis 비교(저장된 refresh와 일치해야 함)
    const saved = await redisClient.get(`refresh_token:${userId}`);
    if (!saved || saved !== refreshToken) {
      // mismatch면 강제로 폐기
      await redisClient.del(`refresh_token:${userId}`);
      await redisClient.del(`user_version:${userId}`);
      res.clearCookie("refreshToken", { path: "/auth/refresh" });

      return res.status(401).json({ ok: false, errorCode: "AUTH_REFRESH_MISMATCH", message: "Refresh Token이 유효하지 않습니다." });
    }

    // 3) token_version 조회(캐시 미스면 DB)
    let currentVersion = await redisClient.get(`user_version:${userId}`);
    if (currentVersion == null) {
      const r = await pool.query(`SELECT token_version FROM users WHERE id=$1`, [userId]);
      if (r.rowCount === 0) return res.status(401).json({ ok: false, errorCode: "AUTH_USER_NOT_FOUND", message: "사용자 없음" });

      currentVersion = String(r.rows[0].token_version);
      await redisClient.set(`user_version:${userId}`, currentVersion, { EX: 60 * 60 * 24 * 7 });
    }

    // 4) ✅ Rotation: refresh도 새로 발급해서 Redis/쿠키 교체
    const newRefreshToken = signRefreshToken({ userId });
    await redisClient.set(`refresh_token:${userId}`, newRefreshToken, { EX: 60 * 60 * 24 * 7 });
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions());

    // 5) access 재발급
    const newAccessToken = signAccessToken({ userId, tokenVersion: Number(currentVersion) });

    return res.json({ ok: true, accessToken: newAccessToken });
  } catch (err) {
    // 만료/위조 포함
    res.clearCookie("refreshToken", { path: "/auth/refresh" });
    return res.status(401).json({ ok: false, errorCode: "AUTH_REFRESH_INVALID", message: "Refresh Token 검증 실패", error: err.message });
  }
}

// ✅ logout은 body로 userId 받지 말고 access 기반으로 처리하는 게 정석
// (프론트는 userId 안 보내도 됨)
export async function logout(req, res) {
  const userId = req.user?.userId; // authMiddleware가 주입
  if (!userId) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  try {
    await redisClient.del(`refresh_token:${userId}`);
    await redisClient.del(`user_version:${userId}`);
    res.clearCookie("refreshToken", { path: "/auth/refresh" });

    return res.json({ ok: true, message: "로그아웃 완료" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "로그아웃 실패", error: err.message });
  }
}
