import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useAuth from "@/hooks/useAuth";
import { Flag, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "react-toastify";

export default function ProfileDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [roomName, setRoomName] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [hasReported, setHasReported] = useState(false);

  // For Room Name
  useEffect(() => {
    if (currentUser && id) {
      setRoomName(`meet-${[currentUser._id, id].sort().join("-")}`);
    }
  }, [currentUser, id]);

  // To fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/user/profile/${id}`
        );
        setUser(response.data);
      } catch (err) {
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  // To fetch user request status
  useEffect(() => {
    const fetchRequestStatus = async () => {
      if (currentUser) {
        try {
          const res = await axios.get(
            `http://localhost:5000/user/request/status?senderId=${currentUser._id}&receiverId=${id}`
          );
          console.log("Request status response:", res.data);
          setRequestStatus(res.data.status);
        } catch (err) {
          console.error("Error fetching request status", err);
        }
      }
    };

    fetchRequestStatus();
    const interval = setInterval(fetchRequestStatus, 3000);
    return () => clearInterval(interval);
  }, [id, currentUser]);

  // To fetch active meetings
  useEffect(() => {
    const fetchActiveMeeting = async () => {
      setLoadingMeeting(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/meet/active/${currentUser._id}`
        );
        setActiveMeeting(res.data);
      } catch (err) {
        setActiveMeeting(null);
      } finally {
        setLoadingMeeting(false);
      }
    };

    fetchActiveMeeting();
    const interval = setInterval(fetchActiveMeeting, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // To fetch report status
  useEffect(() => {
    const checkIfReported = async () => {
      if (!currentUser || !id) return;

      try {
        const res = await axios.get(
          `http://localhost:5000/user/has-reported/${id}?reporterId=${currentUser._id}`
        );
        setHasReported(res.data.hasReported);
      } catch (err) {
        console.error("Failed to check report status:", err);
      }
    };

    checkIfReported();
  }, [currentUser, id]);

  // Connection request sending method
  const sendConnectionRequest = async () => {
    if (!currentUser) {
      setMessage("User not found");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/user/connect/request",
        {
          senderId: currentUser._id,
          receiverId: id,
        }
      );

      toast.success("Connection request sent!");
      setMessage(response.data.message);

      await axios.post("http://localhost:5000/user/notifications", {
        senderId: currentUser._id,
        receiverId: id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        message: `${currentUser.name} sent you a connection request`,
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send request");
    }
  };

  // To handle accept request
  const handleAcceptRequest = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/user/connect/accept",
        {
          receiverId: currentUser._id,
          senderId: id,
        }
      );

      setRequestStatus("accepted");
      toast.success("Connection request accepted!");
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data.message);
    }
  };

  // To handle reject request
  const handleRejectRequest = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/user/connect/reject",
        {
          receiverId: currentUser._id,
          senderId: id,
        }
      );

      setRequestStatus("none");
      toast.success("Connection request rejected!");
      setMessage(response.message);
    } catch (error) {
      setMessage("Caught Error in rejecting request");
    }
  };

  // To create meeting
  const createMeeting = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/meet/create", {
        creatorId: currentUser._id,
        partnerId: id,
        roomName,
      });

      const meetingTime = new Date().toLocaleString();
      const meetLink = `${window.location.origin}/meet/${roomName}?userId=${currentUser._id}`;
      const message = `${currentUser.name} started a meeting with you at ${meetingTime}. Click to join: ${meetLink}`;

      await axios.post("http://localhost:5000/user/notifications", {
        senderId: currentUser._id,
        receiverId: id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        message,
      });

      toast.success("Meeting joined successfully!");
      navigate(`/meet/${roomName}?userId=${currentUser._id}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
  };

  const joinMeeting = async () => {
    const meetingTime = new Date().toLocaleString();
    const meetLink = `${window.location.origin}/meet/${activeMeeting.roomName}?userId=${currentUser._id}`;
    const message = `${currentUser.name} joined your meeting at ${meetingTime}. Click to join: ${meetLink}`;
  
    await axios.post("http://localhost:5000/user/notifications", {
      senderId: currentUser._id,
      receiverId: id, 
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      message,
    });
  
    navigate(`/meet/${activeMeeting.roomName}?userId=${currentUser._id}`);
  };
  
  // To handle report
  const handleReport = async () => {
    try {
      const res = await axios.post("http://localhost:5000/user/report", {
        reporterId: currentUser._id,
        reportedUserId: id,
        reason: reportReason,
      });

      if (res.status === 200) {
        toast.success("Report submitted successfully!");
        setHasReported(true);
      }
      setReportReason("");
      setReportOpen(false);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || "Something went wrong.";

      if (status === 400) {
        toast.error("You have already reported this user.");
        setHasReported(true);
      } else if (status === 403) {
        toast.error("You cannot report yourself.");
      } else {
        toast.error("Failed to submit report. Please try again later.");
      }

      console.error("Error submitting report:", message);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500">Loading user details...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-red-500">{error}</span>
      </div>
    );
  if (!user)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500">User not found</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-10 px-2">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 relative">

        {currentUser && user && currentUser._id !== user._id && (
          <Button
            variant="ghost"
            onClick={() => setReportOpen(true)}
            disabled={hasReported}
            className="group relative p-0.5 rounded-full bg-red-50 hover:bg-red-100 shadow transition"
            title={hasReported ? "Already reported" : "Report user"}
          >
            <span className="flex items-center justify-center w-10 h-10">
              <ShieldAlert className="w-5 h-5 text-red-500 group-hover:text-red-600 transition" />
            </span>
          </Button>
        )}

        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-500 mb-2">
            {user.name[0]}
          </div>
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Skills Have
            </h3>
            <div className="bg-gray-100 rounded px-3 py-2 text-gray-700 text-sm min-h-[36px]">
              {user.skillsHave?.length ? (
                user.skillsHave.join(", ")
              ) : (
                <span className="text-gray-400">None</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Skills Want
            </h3>
            <div className="bg-gray-100 rounded px-3 py-2 text-gray-700 text-sm min-h-[36px]">
              {user.skillsWant?.length ? (
                user.skillsWant.join(", ")
              ) : (
                <span className="text-gray-400">None</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 mb-4">
          {requestStatus === "pending" ? (
            <span className="text-blue-500 font-medium">Request Sent</span>
          ) : requestStatus === "accepted" ? (
            <span className="text-green-600 font-medium">
              You are connected
            </span>
          ) : requestStatus === "received" ? (
            <div className="flex gap-3">
              <Button
                onClick={handleAcceptRequest}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow"
              >
                Accept
              </Button>
              <Button
                onClick={handleRejectRequest}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow"
              >
                Reject
              </Button>
            </div>
          ) : (
            <Button
              onClick={sendConnectionRequest}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow"
            >
              Connect
            </Button>
          )}
          {message && <span className="text-sm text-gray-500">{message}</span>}
        </div>

        {requestStatus === "accepted" && (
          <div className="flex flex-col items-center gap-2 mb-4">
            {loadingMeeting ? (
              <span className="text-gray-400">Checking meeting status...</span>
            ) : activeMeeting ? (
              <Button
                onClick={joinMeeting}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow"
              >
                Join Meeting
              </Button>
            ) : (
              <Button
                onClick={createMeeting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow"
              >
                Create Meeting
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Button
            onClick={() => navigate("/subscription")}
            className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg shadow"
          >
            View Subscription Plans
          </Button>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report {user.name}</DialogTitle>
          </DialogHeader>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select a reason</option>
            <option value="Spam">Spam</option>
            <option value="Inappropriate behavior">
              Inappropriate behavior
            </option>
            <option value="Fake account">Fake account</option>
            <option value="Other">Other</option>
          </select>
          <Button
            variant="ghost"
            onClick={handleReport}
            disabled={!reportReason || hasReported}
            className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white"
          >
            Submit Report
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
