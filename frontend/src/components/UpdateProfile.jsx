import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const UpdateProfile = () => {
  const userId = useParams().id;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    skillsHave: [],
    skillsWant: [],
  });

  useEffect(() => {
    axios.get(`http://localhost:5000/user/profile/${userId}`).then((res) => {
      setFormData({
        name: res.data.name || "",
        email: res.data.email || "",
        skillsHave: res.data.skillsHave || [],
        skillsWant: res.data.skillsWant || [],
      });
    });
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillChange = (type, index, value) => {
    const updatedSkills = [...formData[type]];
    updatedSkills[index] = value;
    setFormData({ ...formData, [type]: updatedSkills });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, skillsHave, skillsWant } = formData;
  
    try {
      await axios.put(`http://localhost:5000/user/update-profile/${userId}`, {
        name,
        skillsHave,
        skillsWant,
      });
  
      toast.success("Profile updated!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000); 
    } catch (error) {
      toast.error("Update failed. Try again.");
    }
  };

  console.log(userId);
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-1">
            Email
          </label>
          <input
            type="text"
            value={formData.email}
            readOnly
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-1">
            Skills You Have
          </label>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              className="w-full mb-2 p-2 border border-gray-300 rounded-md"
              value={formData.skillsHave[i] || ""}
              onChange={(e) =>
                handleSkillChange("skillsHave", i, e.target.value)
              }
            />
          ))}
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-1">
            Skills You Want
          </label>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              className="w-full mb-2 p-2 border border-gray-300 rounded-md"
              value={formData.skillsWant[i] || ""}
              onChange={(e) =>
                handleSkillChange("skillsWant", i, e.target.value)
              }
            />
          ))}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;
