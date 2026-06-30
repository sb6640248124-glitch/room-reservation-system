import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  console.log("ADMIN CHECK:", user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ ต้องเป็น admin เท่านั้น
  if (user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default AdminRoute;