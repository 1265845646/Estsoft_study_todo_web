import { pool } from "../db/pool.js";

// ✅ 내 카테고리 목록 조회
export async function getMyCategories(req, res) {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT id, name, created_at
       FROM categories
       WHERE user_id = $1
       ORDER BY id ASC`,
      [userId]
    );

    return res.json({ ok: true, categories: result.rows });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "카테고리 조회 실패", error: err.message });
  }
}

// ✅ 카테고리 생성
export async function createCategory(req, res) {
  const userId = req.user.userId;
  const { name } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ ok: false, message: "name은 필수입니다." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO categories (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [userId, name.trim()]
    );

    return res.status(201).json({ ok: true, category: result.rows[0] });
  } catch (err) {
    // (선택) 유니크 제약 걸려있으면 중복 처리
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, message: "이미 존재하는 카테고리 이름입니다." });
    }
    return res.status(500).json({ ok: false, message: "카테고리 생성 실패", error: err.message });
  }
}

// ✅ 카테고리 수정
export async function updateCategory(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ ok: false, message: "name은 필수입니다." });
  }

  try {
    const result = await pool.query(
      `UPDATE categories
       SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, created_at`,
      [name.trim(), id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "카테고리를 찾을 수 없습니다." });
    }

    return res.json({ ok: true, category: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, message: "이미 존재하는 카테고리 이름입니다." });
    }
    return res.status(500).json({ ok: false, message: "카테고리 수정 실패", error: err.message });
  }
}

// ✅ 카테고리 삭제
export async function deleteCategory(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM categories
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "카테고리를 찾을 수 없습니다." });
    }

    return res.json({ ok: true, message: "삭제 완료" });
  } catch (err) {
    // 만약 todos가 FK로 물려있으면 여기서 에러코드 처리 가능(선택)
    return res.status(500).json({ ok: false, message: "카테고리 삭제 실패", error: err.message });
  }
}
