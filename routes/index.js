const authRoute = require("./authRoute");
const todoRoute = require("./todoRoute");

const mountRoutes = (app) => {
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/todo", todoRoute);
};

module.exports = mountRoutes;
