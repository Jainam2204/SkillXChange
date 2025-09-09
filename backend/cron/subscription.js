const cron = require("node-cron");
const subscriptionService = require("../services/subscriptionService");

cron.schedule("0 0 1 * *", async () => {
  console.log("🔄 Resetting connections for free users...");
  await subscriptionService.resetFreeConnections();
  console.log("✅ Free users reset complete!");
});

cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Checking for expired subscriptions...");
  const expiredCount = await subscriptionService.expireSubscriptions();
  console.log(`✅ Expired ${expiredCount} subscriptions.`);
});
