"use strict";

/**
 * user-file router
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::user-file.user-file", {
  config: {
    findOne: {
      middlewares: ["api::user-file.is-owner"],
    },
    delete: {
      middlewares: ["api::user-file.is-owner"],
    },
  },
});
