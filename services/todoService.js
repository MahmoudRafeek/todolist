const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const Todo = require("../models/todoModel");

// Upload single image
exports.uploadTodoImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `todo-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/todo/${filename}`);

  // Save image into our db
  req.body.image = filename;

  next();
});
exports.createTodo = asyncHandler(async (req, res) => {
  req.body.user = req.user._id;

  const newTodo = await Todo.create(req.body);
  res.status(201).json({ data: newTodo });
});
exports.getTodo = asyncHandler(async (req, res, next) => {
  const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
  if (!todo) {
    return next(new ApiError(`No todo found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: todo });
});

exports.getTodos = asyncHandler(async (req, res) => {
  const apiFeatures = new ApiFeatures(
    Todo.find({ user: req.user._id }),
    req.query
  )
    .paginate()
    .filter()
    .search()
    .limitFields()
    .sort();

  const { mongooseQuery, paginationResult } = apiFeatures;
  const todos = await mongooseQuery;

  res
    .status(200)
    .json({ results: todos.length, paginationResult, data: todos });
});

exports.updateTodo = asyncHandler(async (req, res, next) => {
  const updatedTodo = await Todo.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedTodo) {
    return next(new ApiError(`No todo found with id ${req.params.id}`, 404));
  }

  res.status(200).json({ data: updatedTodo });
});

exports.deleteTodo = asyncHandler(async (req, res, next) => {
  const deletedTodo = await Todo.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!deletedTodo) {
    return next(new ApiError(`No todo found with id ${req.params.id}`, 404));
  }

  res.status(204).json({ success: true, data: {} });
});
