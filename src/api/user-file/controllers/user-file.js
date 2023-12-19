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

      // Modify the response to exclude attributes object from the response
      // Optimizes the size of the response since contents can get very large
      // the custom logic part
      if (response.data) {
        delete response.data.attributes;
      }

      // Retrieve the current user id
      const userId = ctx.state.user.id;

      // Fetch the current user data
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      // Increment totalFiles field for the user
      await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            totalFiles: user.totalFiles > 0 ? user.totalFiles - 1 : 0,
          },
        }
      );

      // Return the modified response
      return response;
    },
    // that's the method for downloading a file
    async findOne(ctx) {
      // calling the default controller action here
      const response = await super.findOne(ctx);

      // Increment the downloadedFiles field for the user
      const userId = ctx.state.user.id;

      // Fetch the current user data
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );
      // Increment the downloadedFiles field for the user
      await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            downloadedFiles: user.downloadedFiles
              ? user.downloadedFiles + 1
              : 1,
          },
        }
      );

      // Return the modified response
      return response;
    },
  })
);
