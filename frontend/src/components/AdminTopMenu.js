// import { useNavigate, useLocation } from "react-router-dom";
// import { useEffect, useState } from "react";
// import "../pages/Home.css"; 

// export default function AdminTopMenu() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const storedUser = JSON.parse(localStorage.getItem("user"));

//     if (!storedUser || !storedUser.user) {
//       navigate("/login", { replace: true });
//       return;
//     }

//     setUser(storedUser.user);
//   }, [navigate]);

//   if (!user) return null;

//   const isAdmin = user.role === "admin";

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     navigate("/login");
//   };

//   const isActive = (path) => location.pathname.startsWith(path);

//   return (
//     <header className="top-menu">
//       <div className="menu-left">
//         <nav className="menu-tabs">
//           <button
//             className={`tab ${isActive("/home") ? "active" : ""}`}
//             onClick={() => navigate("/home")}
//           >
//             🏫 ระบบจองห้อง
//           </button>

//           <button
//             className={`tab ${isActive("/reservations") ? "active" : ""}`}
//             onClick={() => navigate("/reservations")}
//           >
//             รายการจองห้อง
//           </button>

//           {isAdmin && (
//             <>
//               <button
//                 className={`tab ${isActive("/admin/rooms") ? "active" : ""}`}
//                 onClick={() => navigate("/admin/rooms")}
//               >
//                 จัดการข้อมูลอาคารและห้อง
//               </button>

//               <button
//                 className={`tab ${isActive("/admin/schedule") ? "active" : ""}`}
//                 onClick={() => navigate("/admin/schedule")}
//               >
//                 จัดการข้อมูลตารางเรียน
//               </button>

//               <button
//                 className={`tab ${isActive("/admin/users") ? "active" : ""}`}
//                 onClick={() => navigate("/admin/users")}
//               >
//                 จัดการข้อมูลผู้ใช้
//               </button>

//               <button className="tab">รายงาน</button>
//             </>
//           )}
//         </nav>
//       </div>

//       <button className="logout-btn" onClick={handleLogout}>
//         ออกจากระบบ ⎋
//       </button>
//     </header>
//   );
// }
