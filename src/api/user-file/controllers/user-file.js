"use strict";

/**
 * user-file controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::user-file.user-file",
  ({ strapi }) => ({
    // wrap the default controller actions
    // remove attributes from the response
    // since contents field can get large now & frontend only uses id to sort attributes are uncessary
    async delete(ctx) {
      // Call the default core action
      const response = await super.delete(ctx);

      // Modify the response to remove the 'contents' field
      // the custom logic part
      if (response.data) {
        delete response.data.attributes;
      }

      // Return the modified response
      return response;
    },
  })
);
