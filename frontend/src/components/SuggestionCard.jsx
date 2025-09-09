import React from "react";
import { useNavigate } from "react-router-dom";

function SuggestionCard({ user }) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/dashboard/profile/${user._id}`);
  };

  if (!user) return <p>Loading user...</p>;

  return (
    <div
      onClick={handleClick}
      className="border p-4 rounded-lg shadow-md bg-white"
    >
      <h3 className="text-lg font-semibold">{user.name}</h3>
      <p className="text-gray-600">Email: {user.email}</p>
      <p className="text-sm text-gray-800">
        <strong>Skills They Have:</strong> {user.skillsHave?.join(", ") || "None"}
      </p>
      <p className="text-sm text-gray-800">
        <strong>Skills They Want:</strong> {user.skillsWant?.join(", ") || "None"}
      </p>
    </div>
  );
}

export default SuggestionCard;
