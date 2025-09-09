import { useState, useEffect } from "react";
import {
  createOrder,
  verifyPayment,
  getSubscriptionStatus,
} from "../api/paymentApi";
import useAuth from "@/hooks/useAuth";

const Subscription = () => {
  const plans = {
    Basic: { connectionsAllowed: 5, price: 99 },
    Premium: { connectionsAllowed: 15, price: 299 },
  };

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuth();
  useEffect(() => {
    if (!currentUser || !currentUser._id) return;

    const fetchSubscriptionStatus = async () => {
      try {
        const data = await getSubscriptionStatus(currentUser._id);
        const now = new Date();
        const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        const isExpired = expiryDate && expiryDate < now;

        setSubscription({
          ...data,
          isSubscribed: data.isSubscribed && !isExpired,
        });
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [currentUser]);

  const handleSubscribe = async (planName) => {
    try {
      const orderData = await createOrder(currentUser._id, planName);

      const options = {
        key: "rzp_test_dMsLDQLJDCGKIF",
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "Your Website Name",
        description: `Subscription for ${planName}`,
        handler: async (response) => {
          try {
            await verifyPayment(currentUser._id, planName, response);
            alert("Subscription activated successfully!");
            setSubscription((prev) => ({
              ...prev,
              isSubscribed: true,
              plan: planName,
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              connectionsLeft: plans[planName].connectionsAllowed,
            }));
          } catch (error) {
            alert("Payment verification failed");
          }
        },
        theme: { color: "#3399cc" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Failed to initiate payment");
    }
  };

  if (loading) return <p>Loading subscription details...</p>;

  return (
    <div className="flex-1 bg-white p-8">
      <h2 className="text-3xl font-bold text-center mb-8">Subscription plan</h2>

      {subscription?.isSubscribed ? (
        <p className="text-green-600 text-center mb-6">
          Subscribed to <strong>{subscription.plan}</strong> until{" "}
          {new Date(subscription.expiryDate).toDateString()}
        </p>
      ) : (
        <p className="text-red-600 text-center mb-6">
          No active subscription. You have{" "}
          <strong>{subscription.connectionsLeft || 2}</strong> free connections.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="bg-gray-100 h-[420px] rounded-lg shadow-md flex flex-col justify-between p-6">
          <div>
            <h3 className="text-xl font-semibold text-center mb-2">
              Basic Plan
            </h3>
            <p className="text-center text-lg text-gray-700 mb-4">
              ₹99 / month
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Perfect for beginners who want to try the platform. Great to get a
              few initial connections.
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1 mt-3">
              <li>5 connections per month</li>
              <li>Access to messaging</li>
              <li>Basic profile visibility</li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe("Basic")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mt-6"
          >
            Subscribe
          </button>
        </div>

        <div className="bg-gray-100 h-[420px] rounded-lg shadow-md flex flex-col justify-between p-6">
          <div>
            <h3 className="text-xl font-semibold text-center mb-2">
              Premium Plan
            </h3>
            <p className="text-center text-lg text-gray-700 mb-4">
              ₹299 / month
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Best for users who want to explore the full potential of the
              platform with higher limits and visibility.
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1 mt-3">
              <li>15 connections per month</li>
              <li>Priority visibility on search</li>
              <li>Direct messaging without limits</li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe("Premium")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mt-6"
          >
            Subscribe
          </button>
        </div>

        <div className="bg-gray-100 h-[420px] rounded-lg shadow-md flex flex-col justify-between p-6">
          <div>
            <h3 className="text-xl font-semibold text-center mb-2">
              Coming Soon
            </h3>
            <p className="text-center text-lg text-gray-500 mb-4">
              More features incoming!
            </p>
            <p className="text-sm text-gray-600 mb-2">
              We’re working on exciting new plans with enhanced tools and even
              more visibility.
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1 mt-3">
              <li>Unlimited connections</li>
              <li>AI-based match recommendations</li>
              <li>Video profile highlights</li>
            </ul>
          </div>
          <button
            disabled
            className="bg-gray-400 text-white font-semibold py-2 px-4 rounded mt-6 cursor-not-allowed"
          >
            Stay Tuned
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
