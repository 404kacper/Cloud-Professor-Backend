const { generateKeyPair, encryptPrivateKey } = require("../utils/encryption");
const { sanitize, validate } = require("@strapi/utils");

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
      const contentType = strapi.contentType("plugin::users-permissions.user");
      await validate.contentAPI.query(ctx.query, contentType, {
        auth: ctx.state.auth,
      });
      const sanitizedQueryParams = await sanitize.contentAPI.query(
        ctx.query,
        contentType,
        { auth: ctx.state.auth }
      );

      // also only include the necessary fields for UI
      sanitizedQueryParams.fields = ["username", "email", "id", "publicKey"];

      // Fetch users with limit and offset
      const users = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        sanitizedQueryParams
      );

      // Return the sanitized users
      ctx.body = await sanitize.contentAPI.output(users, contentType, {
        auth: ctx.state.auth,
      });
    } catch (err) {
      ctx.body = { error: err.message };
    }
  },
};

module.exports = userController;
