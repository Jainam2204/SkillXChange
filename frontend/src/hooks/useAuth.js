import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      console.log("Stored token:", token);
      if (!storedUser) {
        navigate("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);

        const res = await axios.get(`http://localhost:5000/user/${parsedUser._id}`);
        const freshUser = res.data;

        if (freshUser.isBanned) {
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          localStorage.setItem("user", JSON.stringify(freshUser));
          setUser(freshUser);
          
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        localStorage.removeItem("user");
        navigate("/login");
      }
    };

    fetchUser();
    const interval = setInterval(fetchUser, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      console.log("User fetched:", user?.isBanned);
    }
  }, [user]);

  return user;
}
