import { useEffect, useState } from "react";
import axios from "axios";

function RoomTypesTab() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [mode, setMode] = useState("add");
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    const res = await axios.get("http://localhost:3002/api/room-types");
    setRoomTypes(res.data);
  };

  const resetForm = () => {
    setMode("add");
    setEditId(null);
    setName("");
  };

  const openEdit = (roomType) => {
    setMode("edit");
    setEditId(roomType.room_type_id);
    setName(roomType.room_type_name || "");
  };

  const toggleStatus = async (roomType) => {
    const currentStatus = roomType.room_type_status || "ใช้งาน";
    const nextStatus = currentStatus === "ใช้งาน" ? "ปิดใช้งาน" : "ใช้งาน";

    await axios.put(
      `http://localhost:3002/api/room-types/${roomType.room_type_id}`,
      { room_type_status: nextStatus }
    );

    loadRoomTypes();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("กรุณากรอกชื่อประเภทห้อง");
      return;
    }

    if (mode === "edit") {
      await axios.put(`http://localhost:3002/api/room-types/${editId}`, {
        room_type_name: name.trim(),
      });
    } else {
      await axios.post("http://localhost:3002/api/room-types", {
        room_type_name: name.trim(),
      });
    }

    resetForm();
    loadRoomTypes();
  };

  return (
    <div className="admin-manage-layout">
      <aside className="admin-side-form">
        <div className="side-form-header">
          <h3>{mode === "edit" ? "แก้ไขประเภทห้อง" : "เพิ่มประเภทห้อง"}</h3>
          <p>
            {mode === "edit"
              ? "แก้ไขชื่อประเภทห้องที่เลือก"
              : "เพิ่มประเภทห้องใหม่เข้าระบบ"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            ชื่อประเภทห้อง
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="กรอกชื่อประเภทห้อง"
            />
          </label>

          <div className="side-form-actions">
            <button type="submit" className="btn-save">
              {mode === "edit" ? "บันทึกแก้ไข" : "เพิ่มประเภทห้อง"}
            </button>
            {mode === "edit" && (
              <button type="button" className="btn-cancel" onClick={resetForm}>
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </aside>

      <section className="admin-table-panel">
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อประเภทห้อง</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((roomType) => (
              <tr key={roomType.room_type_id}>
                <td>{roomType.room_type_name}</td>
                <td>{roomType.room_type_status || "ใช้งาน"}</td>
                <td>
                  <button onClick={() => openEdit(roomType)}>แก้ไข</button>
                  <button onClick={() => toggleStatus(roomType)}>
                    เปลี่ยนสถานะ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default RoomTypesTab;
