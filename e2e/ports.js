// The ports of the fake API (with its Mercure hub) and of the application, shared by the server, the app and the tests.
module.exports = {
  API_PORT: Number(process.env.E2E_API_PORT || 4271),
  APP_PORT: Number(process.env.E2E_APP_PORT || 4270),
};
