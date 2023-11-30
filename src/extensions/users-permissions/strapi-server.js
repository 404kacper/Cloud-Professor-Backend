const crypto = require("crypto");

module.exports = (plugin) => {
  async function generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        "rsa",
        {
          modulusLength: 2048, // length in bits
          publicKeyEncoding: {
            type: "pkcs1", // Public Key Cryptography Standards 1
            format: "pem", // Most common formatting choice
          },
          privateKeyEncoding: {
            type: "pkcs1",
            format: "pem",
          },
        },
        (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
          } else {
            resolve({ publicKey, privateKey });
          }
        }
      );
    });
  }

  function encryptPrivateKey(privateKey, password) {
    // Generate a secure, random initialization vector
    const iv = crypto.randomBytes(16);

    // Generate a cipher key from the password
    const key = crypto.scryptSync(password, "salt", 32);

    // Create a cipher instance using aes-256-cbc algorithm
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return the encrypted data along with the IV
    return { encrypted, iv: iv.toString("hex") };
  }

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

      // Assuming `ctx.state.user` holds your user model
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
    method: "POST", // or 'PUT', 'POST', etc., as per your requirement
    // needs to be /setup/create in order for koa.js to don't interpret new route as api/users/:id (for findOne)
    // I guess now it makes sense why there is a prefix by default
    path: "/users/setup/create", // The desired path for your setup route
    // REMEMBER: changing name of the handler removes all permissions in admin panel
    // - you will be alway getting forbidden response
    handler: "user.setup", // Points to the setup function in user controller
    config: {
      policies: ["global::is-authenticated"],
      prefix: "",
    },
  });

  return plugin;
};
