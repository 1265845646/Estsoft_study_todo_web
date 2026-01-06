import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getMyCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", (req, res) => {
  res.json({ ok: true, userId: req.user.userId });
});

// 카테고리 목록
router.get("/" , getMyCategories);

// 카테고리 생성
router.post("/", createCategory);

// 카테고리 수정
router.put("/:id", updateCategory);

// 카테고리 삭제
 router.delete("/:id", deleteCategory);

 export default router;
 