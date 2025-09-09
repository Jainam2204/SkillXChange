import React, { useState } from "react";
import axios from "axios";
import VideoCard from "./VideoCard";

const CourseSuggestions = () => {
  const [skill, setSkill] = useState("");
  const [channel, setChannel] = useState("freecodecamp");
  const [videos, setVideos] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.post("http://localhost:5000/recommend-channel-videos", {
        interests: [skill],
        channel,
      });
      setVideos(response.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch videos");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Skill Course Recommender</h2>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <input
          type="text"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Enter a skill e.g. Python, React"
          className="px-4 py-2 border rounded w-full md:w-1/2"
        />

        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="freecodecamp">freeCodeCamp</option>
          <option value="netninja">The Net Ninja</option>
          <option value="codewithharry">Code With Harry</option>
          <option value="traversymedia">Traversy Media</option>
        </select>

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {videos.map((video, idx) => <VideoCard key={idx} video={video} />)}
      </div>
    </div>
  );
};

export default CourseSuggestions;
