module.exports = {
  routes: [
    {
      method: "POST",
      path: "/files/upload",
      handler: "files.upload",
    },
    {
      method: "GET",
      path: "/files/me",
      handler: "files.retrieveMe",
    },
    {
      method: "GET",
      path: "/files/tome",
      handler: "files.retrieveSharedWithMe"
    },
  ],
};
