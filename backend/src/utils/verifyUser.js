const jwt = require("jsonwebtoken");
const ApiError = require("./apiError");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header exists and starts with 'Bearer'
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError("Unauthorized", 401));
  }

  // Extract the token from the 'Bearer <token>' format
  const token = authHeader.split(" ")[1];

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new ApiError("Forbidden", 403));

    req.user = user; // Attach the user to the request
    next();
  });
};

module.exports = verifyToken;
