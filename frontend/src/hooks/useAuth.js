import { useState, useEffect } from "react";
import api from "../utils/api"; // ✅ use cookie-based api

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // ✅ Cookie is sent automatically
        const res = await api.get("/auth/me");

        setUser(res.data);

        // optional: for UI persistence
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        console.error("Auth check failed:", err);

        // Clear UI state only (no token exists anymore)
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};

export default useAuth;
