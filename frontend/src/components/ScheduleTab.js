// import React, { useEffect, useState } from "react";
// import axios from "axios";

// function ScheduleTab() {
//   const [schedules, setSchedules] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [buildings, setBuildings] = useState([]);

//   const [building_id, setBuildingId] = useState("");
//   const [room_id, setRoomId] = useState("");

//   const [subject_name, setSubjectName] = useState("");
//   const [instructor, setInstructor] = useState("");
//   const [date, setDate] = useState("");
//   const [start_time, setStartTime] = useState("");
//   const [end_time, setEndTime] = useState("");

//   // ============================
//   // โหลดตารางเรียน
//   // ============================
//   const fetchSchedules = async () => {
//     try {
//       const res = await axios.get("http://localhost:3002/api/schedules");
//       setSchedules(res.data);
//     } catch (err) {
//       console.error("โหลด schedules ไม่สำเร็จ:", err);
//     }
//   };

//   // ============================
//   // โหลดอาคาร
//   // ============================
//   const fetchBuildings = async () => {
//     try {
//       const res = await axios.get("http://localhost:3002/api/buildings");
//       setBuildings(res.data);
//     } catch (err) {
//       console.error("โหลด buildings ไม่สำเร็จ:", err);
//     }
//   };

//   // ============================
//   // โหลดห้องตามอาคาร
//   // ============================
//   const fetchRoomsByBuilding = async (id) => {
//     if (!id) return;

//     try {
//       console.log("กำลังดึงห้องของอาคาร:", id);

//       const res = await axios.get(
//         `http://localhost:3002/api/rooms/by-building/${id}`
//       );

//       console.log("rooms ที่ได้:", res.data);

//       setRooms(res.data);
//     } catch (err) {
//       console.error("โหลด rooms ไม่สำเร็จ:", err);
//       setRooms([]);
//     }
//   };

//   useEffect(() => {
//     fetchSchedules();
//     fetchBuildings();
//   }, []);

//   // ============================
//   // เพิ่มตารางเรียน
//   // ============================
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await axios.post("http://localhost:3002/api/schedules", {
//         room_id,
//         subject_name,
//         instructor,
//         date,
//         start_time,
//         end_time,
//       });

//       alert("✅ เพิ่มตารางเรียนสำเร็จ");

//       setSubjectName("");
//       setInstructor("");
//       setDate("");
//       setStartTime("");
//       setEndTime("");
//       setRoomId("");
//       setBuildingId("");
//       setRooms([]);

//       fetchSchedules();
//     } catch (err) {
//       console.error("เพิ่มตารางไม่สำเร็จ:", err);
//     }
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>📅 จัดการตารางเรียน</h2>

//       <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>

//         {/* ===== เลือกอาคาร ===== */}
//         <div>
//           <label>อาคาร:</label>
//           <select
//             value={building_id}
//             onChange={(e) => {
//               const id = e.target.value;
//               setBuildingId(id);
//               setRoomId("");
//               fetchRoomsByBuilding(id);
//             }}
//             required
//           >
//             <option value="">-- เลือกอาคาร --</option>
//             {buildings.map((b) => (
//               <option key={b.building_id} value={b.building_id}>
//                 {b.building_name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* ===== เลือกห้อง ===== */}
//         <div>
//           <label>ห้อง:</label>
//           <select
//             value={room_id}
//             onChange={(e) => setRoomId(e.target.value)}
//             required
//             disabled={!building_id}
//           >
//             <option value="">-- เลือกห้อง --</option>
//             {rooms.length === 0 && building_id && (
//               <option disabled>ไม่มีห้องในอาคารนี้</option>
//             )}
//             {rooms.map((room) => (
//               <option key={room.room_id} value={room.room_id}>
//                 {room.room_name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label>ชื่อวิชา:</label>
//           <input
//             type="text"
//             value={subject_name}
//             onChange={(e) => setSubjectName(e.target.value)}
//             required
//           />
//         </div>

//         <div>
//           <label>ผู้สอน:</label>
//           <input
//             type="text"
//             value={instructor}
//             onChange={(e) => setInstructor(e.target.value)}
//             required
//           />
//         </div>

//         <div>
//           <label>วันที่:</label>
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             required
//           />
//         </div>

//         <div>
//           <label>เวลาเริ่ม:</label>
//           <input
//             type="time"
//             value={start_time}
//             onChange={(e) => setStartTime(e.target.value)}
//             required
//           />
//         </div>

//         <div>
//           <label>เวลาสิ้นสุด:</label>
//           <input
//             type="time"
//             value={end_time}
//             onChange={(e) => setEndTime(e.target.value)}
//             required
//           />
//         </div>

//         <button type="submit" style={{ marginTop: "10px" }}>
//           ➕ เพิ่มตารางเรียน
//         </button>
//       </form>
//     </div>
//   );
// }

// export default ScheduleTab;
