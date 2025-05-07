const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, preferences } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    preferences,
  });
  await user.save();

  res.status(201).json({ status: "success", data: user });
});

exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(401, "Invalid email or password"));
  }
  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError(401, "Invalid email or password"));
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username,
    }, // Include role in token payload
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE_TIME }
  );
  res.status(200).json({ status: "success", data: user, token: token });
});
