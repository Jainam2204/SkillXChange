import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { fetchSuggestions } from "@/api/userApi";
import { BookOpen, CreditCard, LayoutDashboard, User2Icon, Users } from "lucide-react";

export default function Dashboard() {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const user = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const getSuggestions = async () => {
      try {
        const response = await fetchSuggestions();
        setSuggestions(response);
      } catch (error) {
        setError("Error fetching suggestions");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      getSuggestions();
      setUserName(user.name);
    }
  }, [user]);

  if (!user) return <p>Loading user...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/6 min-w-[180px] bg-gray-200 p-4 flex flex-col gap-4">
          <Link
            to={`/dashboard/profile-update/${user._id}`}
            className="flex items-center gap-2 text-gray-800 hover:bg-gray-300 p-2 rounded-md"
          >
            <User2Icon size={18} />
            {`Hello ${user.name}`}
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-800 hover:bg-gray-300 p-2 rounded-md"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            to="/dashboard/course-suggestions"
            className="flex items-center gap-2 text-gray-800 hover:bg-gray-300 p-2 rounded-md"
          >
            <BookOpen size={18} />
            Course Suggestions
          </Link>

          <Link
            to="/dashboard/view-profiles"
            className="flex items-center gap-2 text-gray-800 hover:bg-gray-300 p-2 rounded-md"
          >
            <Users size={18} />
            Connected Users
          </Link>

          <Link
            to="/dashboard/subscription"
            className="flex items-center gap-2 text-gray-800 hover:bg-gray-300 p-2 rounded-md"
          >
            <CreditCard size={18} />
            Subscription
          </Link>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <p>Loading suggestions...</p>
          ) : (
            <Outlet
              context={{ user, matchedUsers, setMatchedUsers, suggestions }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
