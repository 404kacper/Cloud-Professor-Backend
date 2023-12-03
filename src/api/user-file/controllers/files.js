module.exports = {
  async upload(ctx, next) {
    try {
      // Extract fields from request body
      const { fileKey, fileData, fileIv, fileName, fileSize } =
        ctx.request.body;

      if (!fileKey || !fileData || !fileIv || !fileName || !fileSize) {
        ctx.throw(400, "Some of the required fields are missing");
      }

      // Create the file
      // And set relation in user
      await strapi.entityService.create("api::user-file.user-file", {
        data: {
          fileName: fileName,
          key: fileKey,
          contents: fileData,
          size: fileSize,
          user: ctx.state.user.id,
          fileIv: fileIv,
        },
      });

      ctx.body = "Keys generated and saved successfully";
    } catch (err) {
      ctx.body = { error: err };
    }
  },
};
