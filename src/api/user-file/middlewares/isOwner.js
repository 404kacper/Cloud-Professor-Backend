"use strict";

/**
 * `isOwner` middleware
 */

// middleware for interacting with individual file
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const user = ctx.state.user;
    const entryId = ctx.params.id ? ctx.params.id : undefined;
    let entry = {};

    /**
     * Gets all information about a given entry,
     * populating every relations to ensure
     * the response includes author-related information
     */
    if (entryId) {
      entry = await strapi.entityService.findOne(
        // replace the next line with your proper content-type identifier
        "api::user-file.user-file",
        entryId,
        { populate: "*" }
      );
    }

    /**
     * Compares user id and entry author id
     * to decide whether the request can be fulfilled
     * by going forward in the Strapi backend server
     */
    if (user.id !== entry.author.id) {
      return ctx.unauthorized("This action is unauthorized.");
    } else {
      return next();
    }
  };
};
