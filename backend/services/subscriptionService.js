const razorpay = require("../utils/razorpay");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const crypto = require("crypto");

const plans = {
  Basic: { price: 99, connectionsAllowed: 5, durationDays: 30 },
  Premium: { price: 299, connectionsAllowed: 15, durationDays: 30 },
};

exports.createOrder = async (planName) => {
  if (!plans[planName]) throw new Error("Invalid plan selected");
  const plan = plans[planName];

  const shortId = crypto.randomBytes(4).toString("hex");

  const options = {
    amount: plan.price * 100,
    currency: "INR",
    receipt: `receipt_${shortId}`,
  };

  return await razorpay.orders.create(options);
};

exports.verifyPayment = async ({ userId, planName, orderId, paymentId, signature }) => {
  if (!plans[planName]) throw new Error("Invalid plan selected");
  const plan = plans[planName];

  // Validate Razorpay signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generatedSignature !== signature) {
    throw new Error("Invalid payment signature");
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

  const existingSubscription = await Subscription.findOne({ userId, status: "active" });

  if (existingSubscription) {
    existingSubscription.planName = planName;
    existingSubscription.price = plan.price;
    existingSubscription.connectionsAllowed = plan.connectionsAllowed;
    existingSubscription.connectionsLeft = plan.connectionsAllowed;
    existingSubscription.expiryDate = expiryDate;
    existingSubscription.paymentId = paymentId;
    await existingSubscription.save();
  } else {
    const newSubscription = new Subscription({
      userId,
      planName,
      price: plan.price,
      connectionsAllowed: plan.connectionsAllowed,
      connectionsLeft: plan.connectionsAllowed,
      expiryDate,
      paymentId,
      status: "active",
    });
    await newSubscription.save();
  }

  return { message: "Subscription activated successfully!" };
};

exports.getSubscriptionStatus = async (userId) => {
  const subscription = await Subscription.findOne({ userId, status: "active" });

  if (!subscription) {
    return { isSubscribed: false, plan: null, connectionsLeft: 2 };
  }

  return {
    isSubscribed: true,
    plan: subscription.planName,
    expiryDate: subscription.expiryDate,
    connectionsLeft: subscription.connectionsLeft,
  };
};

exports.resetFreeConnections = async () => {
  await User.updateMany(
    { _id: { $nin: await Subscription.distinct("userId", { status: "active" }) } },
    { $set: { freeConnectionsLeft: 2 } }
  );
};

exports.expireSubscriptions = async () => {
  const now = new Date();
  const expiredSubscriptions = await Subscription.find({
    expiryDate: { $lt: now },
    status: "active",
  });

  for (const sub of expiredSubscriptions) {
    sub.status = "expired";
    await sub.save();
    await User.updateOne({ _id: sub.userId }, { freeConnectionsLeft: 2 });
  }

  return expiredSubscriptions.length;
};
