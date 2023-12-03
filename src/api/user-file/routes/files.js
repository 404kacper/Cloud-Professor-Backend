module.exports = {
  routes: [
    {
      method: "POST",
      path: "/files/upload",
      handler: "files.upload",
      config: {
        policies: ["global::is-authenticated"],
      },
    },
  ],
};
