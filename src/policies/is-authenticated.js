const jwt = require("jsonwebtoken");

module.exports = (policyContext, config, { strapi }) => {
  const authHeader = policyContext.request.header.authorization;

  if (!authHeader) {
    return false;
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    strapi.config.get("plugin.users-permissions.jwtSecret"),
    {},
    (err, tokenPayload = {}) => {
      if (err) {
        return false;
      }
      // returns id of a user stored in database
      // console.log(tokenPayload);
      return true;
    }
  );
};
