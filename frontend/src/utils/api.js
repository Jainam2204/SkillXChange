// utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 403 && code === "USER_BANNED") {
      window.location.href = "/banned";
    }

    return Promise.reject(error);
  }
);

export default api;
