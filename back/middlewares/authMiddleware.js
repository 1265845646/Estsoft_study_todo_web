import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { redisClient } from "../redis/redisClient.js";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

// errorCode 기준(프론트 분기용)
const ERR = {
  NO_TOKEN: "AUTH_NO_TOKEN",
  INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  EXPIRED_TOKEN: "AUTH_EXPIRED_TOKEN",
  INVALID_PAYLOAD: "AUTH_INVALID_PAYLOAD",
  SESSION_EXPIRED: "AUTH_SESSION_EXPIRED", // tokenVersion mismatch
  USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
};

if (!ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is missing");
}


export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        ok: false,
        errorCode: ERR.NO_TOKEN,
        message: "Access token missing",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, ACCESS_SECRET);
    } catch (e) {
      // 만료 vs 기타 오류를 구분해주면 프론트 UX가 좋아짐
      const isExpired = e?.name === "TokenExpiredError";
      return res.status(401).json({
        ok: false,
        errorCode: isExpired ? ERR.EXPIRED_TOKEN : ERR.INVALID_TOKEN,
        message: isExpired ? "Access token expired" : "Access token invalid",
      });
    }

    const userId = payload.userId;
    const tokenVersionInToken = payload.tokenVersion;

    if (!userId || tokenVersionInToken === undefined || tokenVersionInToken === null) {
      return res.status(401).json({
        ok: false,
        errorCode: ERR.INVALID_PAYLOAD,
        message: "Invalid token payload",
      });
    }

    const versionKey = `user_version:${userId}`;

    // Redis에서 조회
    let cachedVersion = await redisClient.get(versionKey);

    // 캐시 미스면 DB 조회 후 캐시
    if (cachedVersion === null) {
      const result = await pool.query(
        "SELECT token_version FROM users WHERE id = $1 LIMIT 1",
        [userId]
      );

      if (!result.rows.length) {
        return res.status(401).json({
          ok: false,
          errorCode: ERR.USER_NOT_FOUND,
          message: "User not found",
        });
      }

      const dbVersion = result.rows[0].token_version;

      // TTL(캐시) — 너희 정책대로 조정 가능
      const ttlSeconds = 60 * 60 * 24 * 7;
      await redisClient.set(versionKey, String(dbVersion), { EX: ttlSeconds });

      cachedVersion = String(dbVersion);
    }

    // 버전 불일치면 "전체 세션 무효화" 상태
    if (String(tokenVersionInToken) !== String(cachedVersion)) {
      return res.status(401).json({
        ok: false,
        errorCode: ERR.SESSION_EXPIRED,
        message: "Session expired",
      });
    }

    // 통과 → req.user에 주입 (너희가 쓰기로 한 형태)
    req.user = { userId: String(userId) };
    return next();
  } catch (err) {
    console.error("[authMiddleware] error:", err);
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}
