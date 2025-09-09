import { useState, useEffect } from "react";
import ChatInterface from "./Message";
import { useParams } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import Sidebar from "./Sidebar";

function Chat() {
const { userId: selectedUserId } = useParams();
const [loggedInUserId, setLoggedInUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setLoggedInUserId(decoded.userId); 
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }, []);

  return (
    <>
      {loggedInUserId && selectedUserId ? (
        <>
          <Sidebar loggedInUserId={loggedInUserId} />
          <ChatInterface
            loggedInUserId={loggedInUserId}
            selectedUserId={selectedUserId}
          />
        </>
      ) : (
        <div className="p-4 text-center">Loading chat...</div>
      )}
    </>
  );
  
}

export default Chat