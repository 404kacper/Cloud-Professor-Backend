const {
  setupKeys,
  retrieveMyPrivateKey,
} = require("./controllers/userController");

module.exports = (plugin) => {
  // Define the setup function in the user controller
  plugin.controllers.user.setup = setupKeys;
  plugin.controllers.user.myKey = retrieveMyPrivateKey;

  // Add the setup route directly to the plugin's routes
  plugin.routes["content-api"].routes.push({
    method: "POST",
    // needs to be /setup/create in order for koa.js to don't interpret new route as api/users/:id (for findOne)
    // I guess now it makes sense why there is a prefix by default
    path: "/users/setup/create",
    // REMEMBER: changing name of the handler removes all permissions in admin panel
    // - you will be alway getting forbidden response
    handler: "user.setup", // points to the setup controller directly above
    config: {
      policies: ["global::is-authenticated"],
      prefix: "",
    },
  });

  plugin.routes["content-api"].routes.push({
    method: "GET",
    path: "/users/setup/mykey",
    handler: "user.myKey",
    config: {
      policies: ["global::is-authenticated"],
      prefix: "",
    },
  });

  return plugin;
};
