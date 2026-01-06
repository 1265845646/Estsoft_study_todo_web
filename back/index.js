import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { pool } from "./db/pool.js";
import { connectRedis, redisClient } from "./redis/redisClient.js";
import authRouter from "./routes/auth.routes.js";
import categoriesRouter from "./routes/categories.routes.js";
import todosRouter from "./routes/todos.routes.js";

dotenv.config();

const app = express();

// ✅ 1) CORS (프론트 Origin 허용 + 쿠키 허용)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ✅ 2) 쿠키 파싱 (req.cookies 쓰려면 필요)
app.use(cookieParser());

// ✅ 3) JSON 바디 파싱
app.use(express.json());

// ✅ 서버 시작 시 Redis 연결
await connectRedis();

// ✅ 라우터 등록
app.use("/auth", authRouter);
app.use("/categories", categoriesRouter);
app.use("/todos", todosRouter);

// ✅ DB 연결 테스트
app.get("/ping", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, message: "DB 연결 실패", error: err.message });
  }
});

// ✅ Redis 연결 테스트
app.get("/redis-test", async (req, res) => {
  await redisClient.set("test:key", "hello redis");
  const value = await redisClient.get("test:key");
  res.json({ ok: true, value });
});

app.listen(process.env.PORT, () => {
  console.log(`✅ 서버 실행: http://localhost:${process.env.PORT}`);
});
