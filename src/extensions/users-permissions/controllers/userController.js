const { generateKeyPair, encryptPrivateKey } = require("../utils/encryption");

const userController = {
  // Setup route for both asynchronous key
  setupKeys: async (ctx) => {
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
  },

  // Retrieves encrypted private key from the database
  retrieveMyPrivateKey: async (ctx) => {
    try {
      // Check if user already has setup done or keys are not empty
      if (!ctx.state.user.doneSetup || !ctx.state.user.privateKey) {
        ctx.throw(400, "Error retrieving the key");
      }

      const data = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        {
          fields: ["privateKey", "iv"],
        }
      );

      if (!data || !data.privateKey) {
        ctx.throw(400, "Key not found");
      }

      ctx.body = {
        privateKey: data.privateKey,
        iv: data.iv,
      };
    } catch (err) {
      ctx.body = { error: err };
    }
  },
};

module.exports = userController;
