import { pool } from "../db/pool.js";

/**
 * GET /todos?filter=today|week|incomplete
 */
export async function getTodos(req, res) {
  const userId = req.user.userId;
  const { filter } = req.query;

  try {
    let query = `
      SELECT
        id,
        category_id,
        title,
        content,
        due_date,
        is_completed,
        completed_at,
        created_at,
        updated_at
      FROM todos
      WHERE user_id = $1
    `;
    const params = [userId];

    if (filter === "today") {
      query += ` AND due_date = CURRENT_DATE`;
    }

    if (filter === "week") {
      query += `
        AND due_date >= CURRENT_DATE
        AND due_date < CURRENT_DATE + INTERVAL '7 days'
      `;
    }

    if (filter === "incomplete") {
      query += ` AND is_completed = false`;
    }

    query += ` ORDER BY due_date ASC, id ASC`;

    const result = await pool.query(query, params);
    return res.json({ ok: true, todos: result.rows });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Todo 조회 실패",
      error: err.message,
    });
  }
}

/**
 * POST /todos
 */
export async function createTodo(req, res) {
  const userId = req.user.userId;
  const { category_id, title, content, due_date } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({
      ok: false,
      message: "title, due_date는 필수입니다.",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO todos (user_id, category_id, title, content, due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [userId, category_id || null, title, content || null, due_date]
    );

    return res.status(201).json({ ok: true, todo: result.rows[0] });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Todo 생성 실패",
      error: err.message,
    });
  }
}

/**
 * PUT /todos/:id
 */
export async function updateTodo(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;
  const { category_id, title, content, due_date } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({
      ok: false,
      message: "title, due_date는 필수입니다.",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE todos
      SET
        category_id = $1,
        title = $2,
        content = $3,
        due_date = $4
      WHERE id = $5 AND user_id = $6
      RETURNING *
      `,
      [
        category_id || null,
        title,
        content || null,
        due_date,
        id,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Todo를 찾을 수 없습니다.",
      });
    }

    return res.json({ ok: true, todo: result.rows[0] });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Todo 수정 실패",
      error: err.message,
    });
  }
}

/**
 * PATCH /todos/:id/complete
 */
export async function toggleTodoComplete(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE todos
      SET
        is_completed = NOT is_completed,
        completed_at = CASE
          WHEN is_completed = false THEN NOW()
          ELSE NULL
        END
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Todo를 찾을 수 없습니다.",
      });
    }

    return res.json({ ok: true, todo: result.rows[0] });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Todo 완료 토글 실패",
      error: err.message,
    });
  }
}

/**
 * DELETE /todos/:id
 */
export async function deleteTodo(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM todos
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Todo를 찾을 수 없습니다.",
      });
    }

    return res.json({ ok: true, message: "삭제 완료" });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Todo 삭제 실패",
      error: err.message,
    });
  }
}
