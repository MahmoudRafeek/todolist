const jwt = require("jsonwebtoken");

const createToken = (payload, expiresIn) => {
  return jwt.sign({ userId: payload }, process.env.JWT_SECRET_KEY, {
    expiresIn,
  });
};

module.exports = createToken;
