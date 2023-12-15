module.exports = {
  async upload(ctx, next) {
    try {
      // Extract fields from request body
      const {
        fileKey,
        fileKeySize,
        fileData,
        fileIv,
        fileName,
        fileSize,
        fileRecipient,
      } = ctx.request.body;

      if (
        !fileKey ||
        !fileKeySize ||
        !fileData ||
        !fileIv ||
        !fileName ||
        !fileSize
      ) {
        ctx.throw(400, "Some of the required fields are missing");
      }

      // Specify recipient for the file
      let recipientId;

      if (!fileRecipient) {
        // If not included recipient is the uploader
        recipientId = ctx.state.user.id;
      } else {
        // If included find recipient by id and assign his id as relation
        const idObject = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({ select: ["id"], where: { email: fileRecipient } });
        // returns object with only user id
        recipientId = idObject.id;
      }

      // Check if user that is sending file has completed setup
      // Otherwise he doesn't have a key to encrypt the file
      if (!ctx.state.user.doneSetup) {
        ctx.throw(400, "User hasn't completed setup yet");
      }

      // Create the file
      // And set relations to the user and the recipient
      await strapi.entityService.create("api::user-file.user-file", {
        data: {
          fileName: fileName,
          key: fileKey,
          contents: fileData,
          size: fileSize,
          author: ctx.state.user.id,
          fileIv: fileIv,
          recipient: recipientId,
          keySize: fileKeySize,
        },
      });

      ctx.body = "File uploaded successfully";
    } catch (err) {
      ctx.body = { error: err };
    }
  },

  async retrieveMe(ctx, next) {
    try {
      const userId = ctx.state.user.id;

      // files sent to me by me
      const files = await strapi.entityService.findMany(
        "api::user-file.user-file",
        {
          filters: { author: userId, recipient: userId },
          fields: ["id", "fileName", "keySize", "size", "createdAt", "key"],
        }
      );

      ctx.body = files;
    } catch (err) {
      ctx.body = { error: err };
    }
  },

  async retrieveSharedWithMe(ctx, next) {
    try {
      const userId = ctx.state.user.id;

      // files sent to me by others
      const files = await strapi.entityService.findMany(
        "api::user-file.user-file",
        {
          filters: { author: { $not: userId }, recipient: userId },
          fields: ["id", "fileName", "keySize", "size", "key"],
          populate: { author: { fields: "email" } },
        }
      );

      ctx.body = files;
    } catch (err) {
      ctx.body = { error: err };
    }
  },
};
