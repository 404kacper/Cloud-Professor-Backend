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

      // Check if user that is sending file has completed setup
      // Otherwise he doesn't have a key to encrypt the file
      if (!ctx.state.user.doneSetup) {
        ctx.throw(400, "User hasn't completed setup yet");
      }

      // Specify recipient for the file
      let recipientId;

      if (!fileRecipient) {
        // If not included recipient is the uploader
        recipientId = ctx.state.user.id;
      } else {
        // If included find recipient by id and assign his id as relation
        const recipientUser = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({ select: ["id"], where: { email: fileRecipient } });

        // throw error if recipient not found
        if (!recipientUser) {
          ctx.throw(404, "Recipient user not found");
        }

        // returns object with only user id
        recipientId = recipientUser.id;
      }

      // Create the file
      // And set relations to the user and the recipient
      const createdFile = await strapi.entityService.create(
        "api::user-file.user-file",
        {
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
        }
      );

      // This part creates log for file recipient
      if (recipientId !== ctx.state.user.id) {
        await strapi.entityService.create("api::user-log.user-log", {
          data: {
            recipient: recipientId,
            author: ctx.state.user.id,
            associatedFile: createdFile.fileName,
          },
        });
      }

      // This part prepares response object
      // & increments totalFiles & upladFiles fields for the user
      // Retrieve the current user id
      const userId = ctx.state.user.id;

      // Fetch the current user data
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      // Increment totalFiles field for the user
      await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            totalFiles: user.totalFiles ? user.totalFiles + 1 : 1,
            uploadedFiles: user.uploadedFiles ? user.uploadedFiles + 1 : 1,
          },
        }
      );

      const responseObject = {
        id: createdFile.id,
        fileName: createdFile.fileName,
        keySize: createdFile.keySize,
        size: createdFile.size,
        createdAt: createdFile.createdAt,
        key: createdFile.key,
      };

      ctx.body = responseObject;
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
