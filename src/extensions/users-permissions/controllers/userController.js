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

      const { encrypted, iv } = await encryptPrivateKey(
        privateKey,
        masterPassword
      );

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
  retrieveMyKeys: async (ctx) => {
    try {
      // Check if user already has setup done or keys are not empty
      if (!ctx.state.user.doneSetup || !ctx.state.user.privateKey) {
        ctx.throw(400, "Error retrieving the key");
      }

      const data = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        {
          fields: ["publicKey", "privateKey", "iv"],
        }
      );

      if (!data || !data.privateKey) {
        ctx.throw(400, "Key not found");
      }

      ctx.body = {
        publicKey: data.publicKey,
        privateKey: data.privateKey,
        iv: data.iv,
      };
    } catch (err) {
      ctx.body = { error: err };
    }
  },

  // Retrieves encrypted private key from the database
  customFind: async (ctx) => {
    try {
      // Default values for limit and page
      let limit = ctx.query._limit ? parseInt(ctx.query._limit) : 8; // Default limit is 8
      const page = ctx.query.page ? parseInt(ctx.query.page) : 1; // Default page is 1

      // logic to don't allow queries bigger than 20
      limit = limit > 20 ? 8 : limit;

      // Calculate the offset
      const offset = (page - 1) * limit;

      // Fetch users with limit and offset
      const users = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          limit: limit,
          start: offset,
        }
      );

      // Return the users
      ctx.body = users;
    } catch (err) {
      ctx.body = { error: err.message };
    }
  },
};

module.exports = userController;
