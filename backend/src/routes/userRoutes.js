const express = require("express");

const {
  getMe,
  updatePreferences,
  getPreferences,
} = require("../controllers/userController");
const {
  getGeneralNews,
  getPersonalizedNews,
  getSentimentForSummary,
} = require("../controllers/newsController");

// Correctly import verifyToken as a default export
const verifyToken = require("../utils/verifyUser");

const router = express.Router();

router.route("/getMe").get(verifyToken, getMe);
router.route("/allNews").get(verifyToken, getGeneralNews);
router.route("/personalizedNews").get(verifyToken, getPersonalizedNews);
router.route("/getPreferences").get(verifyToken, getPreferences);
router.route("/updatePreferences").post(verifyToken, updatePreferences);
router.route("/getSentiment").post(getSentimentForSummary);

module.exports = router;
