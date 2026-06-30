// import { Link, useLocation } from "react-router-dom";
// import "./AdminNavbar.css";

// function AdminNavbar() {
//   const location = useLocation();

//   const isActive = (path) =>
//     location.pathname.startsWith(path) ? "nav-item active" : "nav-item";

//   return (
//     <div className="navbar">
//       <div className="navbar-left">
//         🏫 <span className="logo-text">ระบบจองห้อง</span>
//       </div>

//       <div className="navbar-center">
//         <Link to="/admin/home" className={isActive("/admin/home")}>
//           ระบบจองห้อง
//         </Link>

//         <Link to="/admin/bookings" className={isActive("/admin/bookings")}>
//           รายการจองห้อง
//         </Link>

//         <Link to="/admin/rooms" className={isActive("/admin/rooms")}>
//           จัดการข้อมูลอาคารและห้อง
//         </Link>

//         <Link to="/admin/users" className={isActive("/admin/users")}>
//           จัดการข้อมูลผู้ใช้
//         </Link>

//         <Link to="/admin/reports" className={isActive("/admin/reports")}>
//           รายงาน
//         </Link>
//       </div>

//       <div className="navbar-right">
//         <button className="logout-btn">ออกจากระบบ</button>
//       </div>
//     </div>
//   );
// }

// export default AdminNavbar;
