'use strict';

/**
 * user-file service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-file.user-file');
