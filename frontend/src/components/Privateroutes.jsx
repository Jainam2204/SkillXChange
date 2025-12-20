import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem("user"); // ✅ check user, not token

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
