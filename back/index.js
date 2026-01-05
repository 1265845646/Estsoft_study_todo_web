import express from "express";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(express.json());

// DB 연결 풀
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 연결 테스트 API
app.get("/ping", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: "DB 연결 실패",
      error: err.message,
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`✅ 서버 실행: http://localhost:${process.env.PORT}`);
});
