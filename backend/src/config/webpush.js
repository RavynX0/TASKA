const webpush = require("web-push");
const config = require("./env");

const isConfigured = Boolean(config.vapid.publicKey && config.vapid.privateKey);

if (isConfigured) {
  webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey);
} else {
  console.warn(
    "VAPID keys are not set - push notifications are disabled. " +
      "Generate them with: node -e \"console.log(require('web-push').generateVAPIDKeys())\""
  );
}

module.exports = { webpush, isConfigured };
