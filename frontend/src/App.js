import { Routes, Route } from "react-router-dom";
//import { BrowserRouter } from 'react-router-dom';

import Login from "./pages/Login";
import Register from "./Register";
import VerifyEmail from "./VerifyEmail";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Home from "./pages/adminHome";
import Admin from "./pages/userHome";
import AdminRooms from "./pages/admin/AdminRooms";
// import AdminSchedule from "./pages/admin/AdminSchedule";
import ScheduleManage from "./pages/ScheduleManage";
import AdminRoute from "./routes/AdminRoute";
import PrivateRoute from "./routes/PrivateRoute";
import BuildingRoomAdmin from "./pages/BuildingRoomAdmin";
import ReservationList from "./pages/ReservationList";
import UserManage from "./pages/UserManage";
import Report from "./pages/Report";
import Profile from "./pages/Profile";
import PublicHome from "./pages/PublicHome";

function App() {
  return (
    <Routes>
  <Route path="/" element={<PublicHome />} />

  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/verify-email" element={<VerifyEmail />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />

  <Route
    path="/reservation-list"
    element={
      <PrivateRoute>
        <ReservationList />
      </PrivateRoute>
    }
  />

  <Route
    path="/profile"
    element={
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    }
  />

  <Route
  path="/admin/users"
  element={
    <AdminRoute>
      <UserManage />
    </AdminRoute>
  }
/>

  <Route
    path="/admin/reservations"
    element={
      <AdminRoute>
        <ReservationList />
      </AdminRoute>
    }
  />

  <Route
    path="/admin/report"
    element={
      <AdminRoute>
        <Report />
      </AdminRoute>
    }
  />

<Route
  path="/report"
  element={
    <PrivateRoute>
      <Report />
    </PrivateRoute>
  }
/>

  {/* ✅ user ธรรมดา */}
  <Route
    path="/home"
    element={
      <PrivateRoute>
        <Home />
      </PrivateRoute>
    }
  />

  {/* ✅ admin เท่านั้น */}
  <Route
    path="/admin"
    element={
      <AdminRoute>
        <Admin />
      </AdminRoute>
    }
  />

  <Route
  path="/admin/rooms"
  element={
    <AdminRoute>
      <BuildingRoomAdmin />
    </AdminRoute>
  }
/>

  <Route
    path="/admin/schedules"
    element={
      <AdminRoute>
        <ScheduleManage />
      </AdminRoute>
    }
  />
</Routes>
  );
}

export default App;
