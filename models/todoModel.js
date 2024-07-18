const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Too short product task"],
      maxlength: [32, "Too long product task"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      minlength: [10, "Too short product description"],
    },
    image: String,

    data: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      // required: [true, "task must belong to user"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", todoSchema);
