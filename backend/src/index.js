const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ApiError = require("./utils/apiError");
const mountRoutes = require("./routes");
const dotenv = require("dotenv");
dotenv.config();

const dbConnection = require("./config/db");
const globalError = require("./middlewares/errorMiddleware");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();

const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(bodyParser.json());

// MongoDB connection
dbConnection();

// Mount Routes
mountRoutes(app);

// 404 Handler
app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalError);

// Create server for Express + Socket.IO
const serverWithApp = http.createServer(app);
const io = new Server(serverWithApp, {
  cors: {
    origin: "*", // Replace with your frontend URL in production
  },
});

// Initialize notification system AFTER io is available
const {
  checkForBreakingNews,
  setupSocketHandlers,
} = require("./controllers/notificationService");

setupSocketHandlers(io); // Setup connection/disconnection logic

// Schedule notification checks
setInterval(() => checkForBreakingNews(io), 20000); // 5 minutes

// Start server
const PORT = process.env.PORT || 5000;
serverWithApp.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection: ${err.name} | ${err.message}`);
  serverWithApp.close(() => {
    console.error("Shutting down...");
    process.exit(1);
  });
});
