const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }
  res.status(200).json({ status: "success", data: user });
});

// exports.setPreferences = asyncHandler(async (req, res, next) => {
//   const { preferences } = req.body;
//   if (!preferences) {
//     return next(new ApiError(400, "Preferences are required"));
//   }
//   const user = await User.findByIdAndUpdate(
//     req.user.id,
//     { preferences },
//     { new: true, runValidators: true }
//   );
//   if (!user) {
//     return next(new ApiError(404, "User not found"));
//   }
//   res.status(200).json({ status: "success", data: user });
// });
