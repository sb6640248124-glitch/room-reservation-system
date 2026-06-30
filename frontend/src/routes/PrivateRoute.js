import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ ต้องเป็น user
  if (user.role !== "user") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default PrivateRoute;