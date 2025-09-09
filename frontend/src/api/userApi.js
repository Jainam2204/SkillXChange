import axios from "axios";

export const fetchSuggestions = async () => {
  try {
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);
    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await axios.get("http://localhost:5000/user/suggestions", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Suggestions response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    throw error;
  }
};
