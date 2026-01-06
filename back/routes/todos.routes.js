import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodoComplete,
  deleteTodo,
} from "../controllers/todos.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getTodos);
router.post("/", createTodo);
router.put("/:id", updateTodo);
router.patch("/:id/complete", toggleTodoComplete);
router.delete("/:id", deleteTodo);

export default router;
