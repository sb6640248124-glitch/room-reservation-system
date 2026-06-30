import { useNavigate } from "react-router-dom";
import "./MainMenuTabs.css";

function MainMenuTabs() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="main-tabs">
      <button onClick={() => navigate(isAdmin ? "/admin" : "/home")}>
        ระบบจองห้อง
      </button>
      <button
        onClick={() =>
          navigate(isAdmin ? "/admin/reservations" : "/reservation-list")
        }
      >
        รายการจองห้อง
      </button>

      {user?.role === "user" && (
        <button onClick={() => navigate("/profile")}>จัดการข้อมูลส่วนตัว</button>
      )}

      {isAdmin && (
        <>
          <button onClick={() => navigate("/admin/users")}>
            จัดการข้อมูลผู้ใช้
          </button>
          <button onClick={() => navigate("/admin/rooms")}>
            จัดการข้อมูลห้องและอาคาร
          </button>
          <button onClick={() => navigate("/admin/schedules")}>
            จัดการข้อมูลตารางเรียน
          </button>
          <button onClick={() => navigate("/admin/report")}>รายงาน</button>
        </>
      )}

      <button className="logout" onClick={handleLogout}>
        ออกจากระบบ
      </button>
    </div>
  );
}

export default MainMenuTabs;
