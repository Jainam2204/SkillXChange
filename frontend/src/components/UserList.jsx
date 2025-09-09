import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL = "http://localhost:5000";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated");
      return;
    }

    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    const userId = decodedToken.userId;
    setLoggedInUserId(userId);

    if (!userId) {
      setError("Invalid user ID");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/user/getusers?loggedInUserId=${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError("Error fetching users");
        console.error(err);
      }
    };

    fetchUsers();
  }, []);

  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="p-4 bg-white shadow-md rounded-md relative"
          >
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-gray-600">
              <strong>Skills Have:</strong> {user.skillsHave.join(", ")}
            </p>
            <p className="text-gray-600">
              <strong>Skills Want:</strong> {user.skillsWant.join(", ")}
            </p>

            {user.hasUnreadMessages && (
              <p className="text-red-500 font-semibold mt-2">
                New messages available
              </p>
            )}

            <Link
              to={`/chat/${user._id}`}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded block text-center"
            >
              Chat
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
