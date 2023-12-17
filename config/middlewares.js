module.exports = [
  "strapi::errors",
  "strapi::security",
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  {
    name: "strapi::body",
    config: {
      formLimit: "100mb",
      jsonLimit: "100mb",
      textLimit: "100mb",
      formidable: {
        maxFileSize: 100 * 1024 * 1024, // multipart data - allowed size
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
