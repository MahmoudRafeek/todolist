const express = require("express");

const {
  signup,
  login,
  refreshToken,
  resizeImage,
  uploadUserImage,
  getUser,
  getLoggedUserData,
  updateLoggedUserData,
  deleteLoggedUserData,
} = require("../services/authService");

const router = express.Router();

router.post("/signup", uploadUserImage, resizeImage, signup);
router.get("/refreshToken", refreshToken);
router.post("/login", login);

const authService = require("../services/authService");

router.use(authService.protect);

router.get("/getMe", getLoggedUserData, getUser);
router.put("/updateMe", uploadUserImage, resizeImage, updateLoggedUserData);
router.delete("/deleteMe", deleteLoggedUserData);
module.exports = router;

module.exports = router;
