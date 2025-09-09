import React from "react";
import SkillsMatcher from "./SkillsMatcher";
import SuggestionCard from "./SuggestionCard";
import { useOutletContext } from "react-router-dom";

const SuggestionsHome = () => {
  const { user, matchedUsers, setMatchedUsers, suggestions, loading } =
    useOutletContext();
  return (
    <>
      <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800 tracking-tight">
        Skill Exchange Suggestions
      </h2>

      {user && (
        <div className="mb-10 p-6 rounded-xl bg-white shadow-md">
          <SkillsMatcher userId={user._id} setMatchedUsers={setMatchedUsers} />
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading suggestions...</p>
      ) : matchedUsers.length === 0 ? (
        suggestions.length === 0 ? (
          <p className="text-center text-gray-500">
            No matching users found yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 px-4">
            {suggestions.map((suggestedUser) => (
              <SuggestionCard key={suggestedUser._id} user={suggestedUser} />
            ))}
          </div>
        )
      ) : null}
    </>
  );
};

export default SuggestionsHome;
