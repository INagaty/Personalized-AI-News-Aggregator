const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ApiError = require("./utils/apiError");
const mountRoutes = require("./routes");
const dotenv = require("dotenv");
dotenv.config();
console.log("Loaded API Key:", process.env.NEWS_API_KEY); // Should log the API key
const dbConnection = require("./config/db");
const globalError = require("./middlewares/errorMiddleware");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

// MongoDB connection
dbConnection();

//express app
const app = express();

// Enable other domains to access your application
app.use(cors());
app.options("*", cors());

// Middleware
app.use(bodyParser.json());

// Mount Routes
mountRoutes(app);

app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalError);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle rejection outside express
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
