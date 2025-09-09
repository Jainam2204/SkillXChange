const subscriptionService = require("../services/subscriptionService");

exports.createOrder = async (req, res) => {
  try {
    const { planName } = req.body;
    const order = await subscriptionService.createOrder(planName);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const response = await subscriptionService.verifyPayment(req.body);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await subscriptionService.getSubscriptionStatus(userId);
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
