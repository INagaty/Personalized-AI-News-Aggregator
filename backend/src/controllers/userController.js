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

exports.getPreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  // Define a list of all possible preferences (this could come from a config or DB)
  const allPreferences = [
    "sports",
    "technology",
    "business",
    "health",
    "entertainment",
  ];

  // Get user's selected preferences
  const selectedPreferences = user.preferences;

  // Filter out the preferences that the user has already selected
  const availablePreferences = allPreferences.filter(
    (pref) => !selectedPreferences.includes(pref)
  );

  // Send back the user's selected preferences and available preferences for the dropdown
  res.status(200).json({
    status: "success",
    data: {
      selectedPreferences,
      availablePreferences,
    },
  });
});

exports.updatePreferences = asyncHandler(async (req, res, next) => {
  const { preferencesToAdd, preferencesToRemove } = req.body;

  // Fetch user
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  // Add new preferences
  if (preferencesToAdd && Array.isArray(preferencesToAdd)) {
    user.preferences = [...new Set([...user.preferences, ...preferencesToAdd])];
  }

  // Remove selected preferences
  if (preferencesToRemove && Array.isArray(preferencesToRemove)) {
    user.preferences = user.preferences.filter(
      (pref) => !preferencesToRemove.includes(pref)
    );
  }

  // Save the updated preferences
  await user.save();

  // Return the updated user preferences
  res.status(200).json({
    status: "success",
    data: user.preferences,
  });
});
