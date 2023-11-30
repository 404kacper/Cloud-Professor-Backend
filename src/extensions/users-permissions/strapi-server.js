const { generateKeyPair, encryptPrivateKey } = require("./utils/encryption");

module.exports = (plugin) => {
  // Define the setup function in the user controller
  plugin.controllers.user.setup = async (ctx) => {
    try {
      // Check if user already has setup done or keys are not empty
      if (
        ctx.state.user.doneSetup ||
        ctx.state.user.publicKey ||
        ctx.state.user.privateKey
      ) {
        ctx.throw(400, "User already completed setup");
      }

      const { publicKey, privateKey } = await generateKeyPair();

      // Encrypt the private key with the master-password
      const masterPassword = ctx.request.body.masterPassword;
      if (!masterPassword) {
        ctx.throw(400, "Master password is required");
      }

      const { encrypted, iv } = encryptPrivateKey(privateKey, masterPassword);

      // Update the user model with the new keys
      await strapi.entityService.update(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        {
          data: {
            publicKey: publicKey,
            privateKey: encrypted,
            iv: iv,
            doneSetup: true,
          },
        }
      );

      ctx.body = "Keys generated and saved successfully";
    } catch (err) {
      ctx.body = { error: err };
    }
  };

  // Add the setup route directly to the plugin's routes
  plugin.routes["content-api"].routes.push({
    method: "POST",
    // needs to be /setup/create in order for koa.js to don't interpret new route as api/users/:id (for findOne)
    // I guess now it makes sense why there is a prefix by default
    path: "/users/setup/create", // The desired path for your setup route
    // REMEMBER: changing name of the handler removes all permissions in admin panel
    // - you will be alway getting forbidden response
    handler: "user.setup", // points to the setup controller directly above
    config: {
      policies: ["global::is-authenticated"],
      prefix: "",
    },
  });

  return plugin;
};
