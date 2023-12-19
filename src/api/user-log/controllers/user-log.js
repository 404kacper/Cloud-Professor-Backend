"use strict";

/**
 * user-log controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::user-log.user-log",
  ({ strapi }) => ({
    async find(ctx) {
      // Get the logged-in user's ID
      const userId = ctx.state.user?.id;

      // Check if a user is logged in
      if (!userId) {
        return ctx.badRequest("No authenticated user found");
      }

      const response = await strapi.entityService.findMany(
        "api::user-log.user-log",
        {
          filters: {
            user: userId,
          },
          limit: 25,
          fields: ["id", "createdAt", "associatedFile"],
          // set hard limit of 25 so that the query doesn't get too big
          populate: {
            user: {
              fields: ["id", "publicKey"],
            },
          },
        }
      );

      // Return the response
      return response;
    },
  })
);
