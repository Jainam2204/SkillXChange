import axios from "axios";

const API_BASE_URL = "http://localhost:5000/subscription";

export const createOrder = async (userId, planName) => {
  const { data } = await axios.post(`${API_BASE_URL}/create-order`, {
    userId,
    planName,
  });
  return data;
};

export const verifyPayment = async (userId, planName, paymentData) => {
  const { data } = await axios.post(`${API_BASE_URL}/verify-payment`, {
    userId,
    planName,
    orderId: paymentData.razorpay_order_id,
    paymentId: paymentData.razorpay_payment_id,
    signature: paymentData.razorpay_signature,
  });
  return data;
};

export const getSubscriptionStatus = async (userId) => {
  const { data } = await axios.get(`${API_BASE_URL}/status/${userId}`);
  return data;
};
