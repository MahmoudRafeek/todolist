const express = require("express");

const authService = require("../services/authService");

const {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  uploadTodoImage,
  resizeImage,
} = require("../services/todoService");

const router = express.Router();

router
  .route("/")
  .get(authService.protect, authService.allowedTo("user"), getTodos)
  .post(
    authService.protect,
    authService.allowedTo("user"),
    uploadTodoImage,
    resizeImage,
    createTodo
  );
router
  .route("/:id")
  .get(authService.protect, authService.allowedTo("user"), getTodo)
  .put(
    authService.protect,
    authService.allowedTo("user"),
    uploadTodoImage,
    resizeImage,
    updateTodo
  )
  .delete(authService.protect, authService.allowedTo("user"), deleteTodo);

module.exports = router;
