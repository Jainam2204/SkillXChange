import axios from "axios";
import { Bell, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const bellRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      const response = await axios.get(
        `http://localhost:5000/user/notifications/${user._id}`
      );
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error in fetching notifications : ", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await axios.post("http://localhost:5000/user/notifications/read", {
        notificationId: notification._id,
      });
      navigate(`/dashboard/profile/${notification.senderId}`);
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notification._id)
      );
      setShowDropdown(false);
    } catch (error) {
      console.error("Mark as read notification failed : ", error);
    }
  };

  const handleAuth = () => {
    if (isLoggedIn) {
      localStorage.clear();
      setIsLoggedIn(false);
      navigate("/login");
    } else {
      navigate("/login");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur shadow-md px-4 py-2 flex items-center justify-between">
      <div
        className="text-2xl font-extrabold text-blue-700 cursor-pointer tracking-tight"
        onClick={() => navigate("/")}
      >
        SkillXChange
      </div>

      {isLoggedIn && (
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-1 shadow-inner transition w-72"
        >
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search users, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-gray-700"
          />
        </form>
      )}

      <div className="flex items-center gap-4">
        {isLoggedIn && (
          <div className="relative" ref={bellRef}>
            <button
              className="relative rounded-full p-2 hover:bg-blue-100 transition"
              onClick={() => setShowDropdown((v) => !v)}
              type="button"
              aria-label="Show notifications"
            >
              <Bell className="w-6 h-6 text-blue-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow">
                  {notifications.length}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in z-50">
                <div className="p-3 border-b font-semibold text-blue-700 bg-blue-50">
                  Notifications
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-gray-400 text-center">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className="px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-blue-50 transition"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="font-medium text-gray-800">
                          {notification.senderName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {notification.senderEmail}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleAuth}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-semibold shadow transition"
        >
          {isLoggedIn ? "Logout" : "Login"}
        </button>
      </div>
    </nav>
  );
}
