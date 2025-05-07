const express = require("express");

const { getMe } = require("../controllers/userController");

const { verifyToken } = require("../utils/verifyUser");

const router = express.Router();

router.route("/getMe").get(verifyToken, getMe);

module.exports = router;
