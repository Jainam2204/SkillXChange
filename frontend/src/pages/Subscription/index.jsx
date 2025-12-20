import { useState, useEffect } from "react";
import api from "../../utils/api";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";

import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/subscription`;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      resolve();
    };
    document.body.appendChild(script);
  });
};

const plans = {
  Basic: { connectionsAllowed: 5, price: 99 },
  Premium: { connectionsAllowed: 15, price: 299 },
};

const Subscription = () => {
  const { user: currentUser, loading: authLoading } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(() => {
      setRazorpayLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!currentUser || !currentUser._id) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const { data } = await api.get(`/subscription/status/${currentUser._id}`);


        const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        const isExpired = expiryDate && expiryDate < new Date();

        setSubscription({
          ...data,
          isSubscribed: data.isSubscribed && !isExpired,
          expiryDate,
        });
      } catch (err) {
        toast.error("Failed to load subscription status", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [currentUser, authLoading]);

  const handleSubscribe = async (planName) => {
    if (!currentUser?._id) {
      toast.error("Please login to subscribe");
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Razorpay is loading. Please wait a moment and try again.");
      await loadRazorpayScript();
      setRazorpayLoaded(!!window.Razorpay);
      if (!window.Razorpay) {
        toast.error("Failed to load Razorpay. Please refresh the page.");
        return;
      }
    }

    try {
      setProcessingPlan(planName);

      const { data: orderData } = await api.post(
        "/subscription/create-order",
        {
          userId: currentUser._id,
          planName,
        }
      );


      console.log("Order created:", orderData);

      if (!orderData || !orderData.orderId || !orderData.amount) {
        console.error("Invalid order data:", orderData);
        throw new Error("Invalid order data received from server");
      }

      const options = {
        key: orderData.keyId || "rzp_test_dMsLDQLJDCGKIF",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.orderId,
        name: "SkillXChange",
        description: `${planName} Plan - ${plans[planName].connectionsAllowed} connections per month`,
        prefill: {
          name: currentUser.name || "",
          email: currentUser.email || "",
          contact: currentUser.phone || "",
        },
        theme: {
          color: "#30187d",
        },
        notes: {
          plan: planName,
          userId: currentUser._id,
        },
        handler: async (response) => {
          console.log("Payment successful, response:", response);
          try {


            if (
              !response.razorpay_payment_id ||
              !response.razorpay_order_id ||
              !response.razorpay_signature
            ) {
              throw new Error("Invalid payment response from Razorpay");
            }

            console.log("Verifying payment with:", {
              userId: currentUser._id,
              planName,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });
            const verifyRes = await api.post(
              "/subscription/verify-payment",
              {
                userId: currentUser._id,
                planName,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }
            );



            console.log("Payment verified successfully:", verifyRes.data);
            toast.success("Subscription activated successfully!");

            try {
              const statusRes = await api.get(
                `/subscription/status/${currentUser._id}`
              );


              const expiryDate = statusRes.data.expiryDate
                ? new Date(statusRes.data.expiryDate)
                : null;

              setSubscription({
                ...statusRes.data,
                isSubscribed: statusRes.data.isSubscribed,
                expiryDate,
              });
            } catch (refreshErr) {
              console.error(
                "Failed to refresh subscription status:",
                refreshErr
              );
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            console.error("Error details:", {
              message: err.message,
              response: err.response?.data,
              status: err.response?.status,
            });
            toast.error(
              err.response?.data?.message ||
              err.message ||
              "Payment verification failed. Please contact support."
            );
          } finally {
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error(
          "Payment failed - Full response:",
          JSON.stringify(response, null, 2)
        );
        console.error("Error object:", response.error);
        console.error("Error details:", {
          description: response.error?.description,
          reason: response.error?.reason,
          code: response.error?.code,
          source: response.error?.source,
          step: response.error?.step,
          metadata: response.error?.metadata,
        });

        const errorDesc =
          response.error?.description ||
          response.error?.reason ||
          response.error?.code ||
          response.error?.source ||
          response.error?.step ||
          "Unknown error";

        try {
          if (razorpay && typeof razorpay.close === "function") {
            razorpay.close();
          }
        } catch (closeErr) {
          console.warn(
            "Failed to close Razorpay modal programmatically:",
            closeErr
          );
        }

        if (
          errorDesc.toLowerCase().includes("international") ||
          errorDesc.toLowerCase().includes("not supported") ||
          response.error?.reason === "international_transaction_not_allowed"
        ) {
          toast.error(
            "International cards are not supported by this merchant account. Please use an Indian card, UPI, or Netbanking, or contact support."
          );
        } else if (
          errorDesc.toLowerCase().includes("bad request") ||
          response.error?.code === "BAD_REQUEST_ERROR" ||
          response.error?.code === 400
        ) {
          toast.error(
            `Invalid payment request (400). Error: ${errorDesc}. Please check your Razorpay configuration.`
          );
        } else {
          toast.error(`Payment failed: ${errorDesc}`);
        }
        setProcessingPlan(null);
      });

      razorpay.on("modal.close", function () {
        console.log("Razorpay modal closed");
        setProcessingPlan(null);
      });

      razorpay.on("external.wallet.selected", function (response) {
        console.log("External wallet selected:", response);
      });

      console.log("Opening Razorpay checkout with options:", {
        key: options.key,
        amount: options.amount,
        order_id: options.order_id,
      });

      razorpay.open();
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Failed to initiate payment. Please try again."
      );
      setProcessingPlan(null);
    }
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{
          // minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            Loading subscription details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" sx={{ color: "error.main" }}>
          Please log in to view subscriptions
        </Typography>
      </Box>
    );
  }

  const isSubscribed = subscription?.isSubscribed;
  const activePlan = subscription?.plan;

  return (
    <Box sx={{ flex: 1, bgcolor: "#ffffff", p: 4 }}>
      <Typography variant="h4" align="center" fontWeight="bold" sx={{ mb: 2 }}>
        Subscription Plans
      </Typography>

      {isSubscribed ? (
        <Typography align="center" sx={{ mb: 3, color: "success.main" }}>
          You&apos;re subscribed to <b>{activePlan}</b> till{" "}
          <b>{subscription.expiryDate?.toDateString()}</b> <br />
          Connections left: <b>{subscription.connectionsLeft}</b>
        </Typography>
      ) : (
        <Typography align="center" sx={{ mb: 3, color: "error.main" }}>
          No active subscription. Free connections:{" "}
          <b>{subscription?.connectionsLeft ?? 2}</b>
        </Typography>
      )}

      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
        <Grid container spacing={3} justifyContent="center">

          <Grid item xs={12} md={4}>
            <PlanCard
              title="Basic Plan"
              price={99}
              features={[
                "Connect with up to 5 skill partners",
                "Perfect for starting your skill-sharing journey",
                "Start swapping skills and learning together",
              ]}
              active={activePlan === "Basic"}
              loading={processingPlan === "Basic"}
              onClick={() => handleSubscribe("Basic")}
              highlighted={activePlan === "Basic"}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <PlanCard
              title="Premium Plan"
              price={299}
              features={[
                "Connect with up to 15 skill partners",
                "Exchange skills faster and learn more",
                "Become a true SkillXchange power-user",
              ]}
              active={activePlan === "Premium"}
              loading={processingPlan === "Premium"}
              onClick={() => handleSubscribe("Premium")}
              highlighted={activePlan === "Premium"}
            />
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
};

const PlanCard = ({
  title,
  price,
  features,
  onClick,
  loading,
  active,
  highlighted,
  disabled,
}) => {
  return (
    <Card
      elevation={highlighted ? 6 : 2}
      sx={{
        p: 3,
        borderRadius: 4,
        textAlign: "center",
        transition: "0.25s ease",
        background: highlighted
          ? "linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%)"
          : "#ffffff",

        border: highlighted ? "2px solid" : "1px solid #e5e7eb",
        borderColor: highlighted ? "primary.main" : "#e5e7eb",

        "&:hover": {
          transform: highlighted ? "scale(1.02)" : "scale(1.01)",
          boxShadow: 6,
        },

        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Title */}
      <Typography variant="h5" fontWeight="700" sx={{ mb: 1 }}>
        {title}
      </Typography>

      {/* Price */}
      {price > 0 && (
        <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
          ₹{price} / month
        </Typography>
      )}

      {/* Features */}
      <List sx={{ mb: 2 }}>
        {features.map((f) => (
          <ListItem key={f} disablePadding sx={{ justifyContent: "center" }}>
            <ListItemText
              primary={f}
              primaryTypographyProps={{
                variant: "text",
                align: "center",
                sx: { mb: 0.5 },
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Button */}
      <Button
        variant={active ? "outlined" : "contained"}
        size="large"
        onClick={onClick}
        disabled={disabled || loading || active}
        sx={{
          mt: 1,
          px: 4,
          py: 1.2,
          fontWeight: 600,
          borderRadius: 3,
          minWidth: 150,
        }}
      >
        {active
          ? "Current Plan"
          : loading
            ? "Processing..."
            : disabled
              ? "Stay Tuned"
              : "Subscribe"}
      </Button>
    </Card>
  );
};

export default Subscription;
