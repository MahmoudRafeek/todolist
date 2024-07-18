const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const createToken = require("../utils/createToken");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");

const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const User = require("../models/userModel");
exports.uploadUserImage = uploadSingleImage("profileImg");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/users/${filename}`);

    // Save image into our db
    req.body.profileImg = filename;
  }

  next();
});

// @desc    Signup
// @route   GET /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  // Check if phone exists
  const existingUser = await User.findOne({ phone: req.body.phone });
  if (existingUser) {
    return next(new ApiError("Phone number already exists", 400));
  }

  // 1- Create user
  const user = await User.create(req.body);

  // 2- Generate token
  const access_token = createToken(user._id, "1m");
  const refresh_token = createToken(user._id, "90d");

  res.status(201).json({ data: user, access_token, refresh_token });
});

// @desc    Login
// @route   GET /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  // 1) check if password and email in the body (validation)
  // 2) check if user exist & check if password is correct
  const user = await User.findOne({ phone: req.body.phone });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect phone or password", 401));
  }

  // 3)  Generate token
  const access_token = createToken(user._id, "1m");
  const refresh_token = createToken(user._id, "90d");

  // Delete password from response
  delete user._doc.password;
  // 4) send response to client side
  res.status(200).json({ data: user, access_token, refresh_token });
});

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ApiError("Refresh token is required", 401));
  }

  // try {
  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

  // Check if user exists
  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new ApiError("Invalid refresh token", 401));
  }

  // Generate new tokens
  const access_token = createToken(user._id, "1m");
  // const new_refresh_token = createToken(user._id, "90d");

  res.status(200).json({ access_token });
  // } catch (err) {
  //   return next(new ApiError("Invalid or expired refresh token", 403));
  // }
});

// @desc   make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exist, if exist get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login, Please login to get access this route",
        401
      )
    );
  }

  const decoded = jwt.decode(token, { complete: true });

  if (!decoded || decoded.payload.exp * 1000 < Date.now()) {
    return next(new ApiError("not authorized need to refresh", 401));
  }

  // 2) Verify token (no change happens, expired token)
  const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3) Check if user exists
  const currentUser = await User.findById(verified.userId);
  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }

  req.user = currentUser;
  next();
});

// @desc    Authorization (User Permissions)
// ["admin", "manager"]
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) access roles
    // 2) access registered user (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }
    next();
  });

// // @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(`No todo found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: user });
});

// @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/Protect
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc    Update logged user data (without password, role)
// @route   PUT /api/v1/users/updateMe
// @access  Private/Protect
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
  });

  // console.log(updatedUser);

  res.status(200).json({ data: updatedUser });
});

// @desc    Deactivate logged user
// @route   DELETE /api/v1/users/deleteMe
// @access  Private/Protect
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: "Success" });
});
