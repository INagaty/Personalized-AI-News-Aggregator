const authRoute = require("./authRoutes");
const userRoutes = require("./userRoutes");

const mountRoutes = (app) => {
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/users", userRoutes);
};

module.exports = mountRoutes;
