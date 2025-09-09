import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import React, { useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

const Meet = () => {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const userId = `user_${Date.now()}`;
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const appID = 1636277379;
    const serverSecret = "5aee9818133828e154ff100b3fec5661";
    const roomID = roomName;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      userId,
      `User_${userId}`
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: containerRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
      maxUsers: 10,
      sharedLinks: [
        {
          name: "Copy Link",
          url: `${window.location.origin}/meet/${roomName}?userId=${userId}`,
        },
      ],
      showScreenSharingButton: true,
      showPreJoinView: false,

      onLeaveRoom: () => {
        const leaveUI = document.createElement("div");
        leaveUI.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: #f0f0f0;
        `;

        const heading = document.createElement("h2");
        heading.innerText = "You have left the meeting.";
        leaveUI.appendChild(heading);

        const rejoinBtn = document.createElement("button");
        rejoinBtn.innerText = "Rejoin Meeting";
        rejoinBtn.style.margin = "10px";
        rejoinBtn.onclick = () => {
          zp.joinRoom({
            container: containerRef.current,
            scenario: { mode: ZegoUIKitPrebuilt.VideoConference },
          });
        };

        const dashboardBtn = document.createElement("button");
        dashboardBtn.innerText = "Go to Dashboard";
        dashboardBtn.style.margin = "10px";
        dashboardBtn.onclick = () => {
          navigate("/dashboard");
        };

        leaveUI.appendChild(rejoinBtn);
        leaveUI.appendChild(dashboardBtn);

        if (containerRef.current) {
          containerRef.current.innerHTML = ""; // Clear the old UI
          containerRef.current.appendChild(leaveUI);
        }
      },
    });
  }, [roomName, userId, navigate]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />
  );
};

export default Meet;
