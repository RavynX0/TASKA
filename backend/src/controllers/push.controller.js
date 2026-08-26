const pushSubscriptionModel = require("../models/pushSubscription.model");
const config = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");

const getPublicKey = asyncHandler(async (req, res) => {
  res.status(200).json({ publicKey: config.vapid.publicKey });
});

const subscribe = asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body;

  const subscription = await pushSubscriptionModel.upsertSubscription({
    userId: req.user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  res.status(201).json({ subscription: { id: subscription.id } });
});

const unsubscribe = asyncHandler(async (req, res) => {
  await pushSubscriptionModel.deleteByEndpoint(req.body.endpoint, req.user.id);
  res.status(204).send();
});

module.exports = { getPublicKey, subscribe, unsubscribe };
