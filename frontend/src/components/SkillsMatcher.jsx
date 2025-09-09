import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const SkillsMatcher = ({ userId, setMatchedUsers }) => {
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSkills = async () => {
      const res = await axios.get(
        `http://localhost:5000/user/skills/unique/${userId}`
      );
      setSkillsOptions(res.data);
    };

    fetchSkills();
  }, [userId]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedSkill) {
        setMatches([]);
        setMatchedUsers([]);
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:5000/user/search/${userId}/${selectedSkill}`
        );
        setMatches(res.data);
        setMatchedUsers(res.data);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setMatches([]);
        setMatchedUsers([]);
      }
    };

    fetchMatches();
  }, [selectedSkill, userId, setMatchedUsers]);

  return (
    <div className="p-4 w-full max-w-4xl mx-auto">
      <div className="relative w-full mb-6">
        <label className="block mb-3 text-lg font-bold text-gray-800">
          Select a Skill
        </label>
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="block w-full bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-xl focus:ring-blue-600 focus:border-blue-600 p-3 shadow-sm transition duration-200"
        >
          <option value="">-- Choose a skill --</option>
          {skillsOptions.map((skill, idx) => (
            <option key={idx} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      {matches.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((user) => (
            <Card
              key={user._id}
              className="cursor-pointer transition-transform transform hover:scale-105 hover:shadow-lg rounded-lg"
              onClick={() => navigate(`/dashboard/profile/${user._id}`)}
            >
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Skills They Have:</strong>{" "}
                  {user.skillsHave?.join(", ") || "None"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Skills They Want:</strong>{" "}
                  {user.skillsWant?.join(", ") || "None"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsMatcher;
