import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyRoom = {
  room_name: "",
  floor: "",
  capacity: "",
  equipment: "",
  building_id: "",
  room_type_id: "",
};

function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [buildingId, setBuildingId] = useState("");
  const [mode, setMode] = useState("add");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyRoom);

  useEffect(() => {
    fetchRooms();
    fetchBuildings();
    fetchRoomTypes();
  }, []);

  const fetchRooms = async () => {
    const res = await axios.get("http://localhost:3002/api/rooms");
    setRooms(res.data);
  };

  const fetchBuildings = async () => {
    const res = await axios.get("http://localhost:3002/api/buildings");
    setBuildings(res.data);
  };

  const fetchRoomTypes = async () => {
    const res = await axios.get("http://localhost:3002/api/room-types");
    setRoomTypes(res.data);
  };

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        buildingId ? String(room.building_id) === String(buildingId) : true
      ),
    [buildingId, rooms]
  );

  const resetForm = () => {
    setMode("add");
    setEditId(null);
    setForm(emptyRoom);
  };

  const openEdit = (room) => {
    setMode("edit");
    setEditId(room.room_id);
    setForm({
      room_name: room.room_name || "",
      floor: room.floor ?? "",
      capacity: room.capacity ?? "",
      equipment: room.equipment || "",
      building_id: room.building_id ? String(room.building_id) : "",
      room_type_id: room.room_type_id ? String(room.room_type_id) : "",
    });
  };

  const toggleStatus = async (room) => {
    await axios.put(`http://localhost:3002/api/rooms/${room.room_id}/status`, {
      status: room.status === "ใช้งาน" ? "ปิดใช้งาน" : "ใช้งาน",
    });

    fetchRooms();
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.room_name ||
      !form.building_id ||
      !form.room_type_id ||
      form.floor === "" ||
      form.capacity === ""
    ) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const payload = {
      ...form,
      floor: Number(form.floor),
      capacity: Number(form.capacity),
      building_id: Number(form.building_id),
      room_type_id: Number(form.room_type_id),
      equipment: form.equipment.trim(),
    };

    if (mode === "edit") {
      await axios.put(`http://localhost:3002/api/rooms/${editId}`, payload);
    } else {
      await axios.post("http://localhost:3002/api/rooms", payload);
    }

    resetForm();
    fetchRooms();
  };

  return (
    <div className="admin-manage-layout">
      <aside className="admin-side-form">
        <div className="side-form-header">
          <h3>{mode === "edit" ? "แก้ไขห้อง" : "เพิ่มห้อง"}</h3>
          <p>
            {mode === "edit"
              ? "แก้ไขข้อมูลห้องที่เลือก"
              : "เพิ่มห้องใหม่เข้าระบบ"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            ชื่อห้อง
            <input
              value={form.room_name}
              onChange={(event) => updateForm("room_name", event.target.value)}
              placeholder="กรอกชื่อห้อง"
            />
          </label>

          <label>
            อาคาร
            <select
              value={form.building_id}
              onChange={(event) => updateForm("building_id", event.target.value)}
            >
              <option value="">- เลือกอาคาร -</option>
              {buildings.map((building) => (
                <option key={building.building_id} value={building.building_id}>
                  {building.building_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            ประเภทห้อง
            <select
              value={form.room_type_id}
              onChange={(event) =>
                updateForm("room_type_id", event.target.value)
              }
            >
              <option value="">- เลือกประเภทห้อง -</option>
              {roomTypes.map((roomType) => (
                <option key={roomType.room_type_id} value={roomType.room_type_id}>
                  {roomType.room_type_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            ชั้น
            <input
              type="number"
              value={form.floor}
              onChange={(event) => updateForm("floor", event.target.value)}
              placeholder="กรอกชั้น"
            />
          </label>

          <label>
            ความจุ
            <input
              type="number"
              value={form.capacity}
              onChange={(event) => updateForm("capacity", event.target.value)}
              placeholder="กรอกจำนวนที่นั่ง"
            />
          </label>

          <label>
            อุปกรณ์ในห้อง
            <textarea
              value={form.equipment}
              onChange={(event) => updateForm("equipment", event.target.value)}
              placeholder="เช่น โปรเจคเตอร์, ไมค์, เครื่องเสียง, กระดานไวท์บอร์ด"
              rows="4"
            />
          </label>

          <div className="side-form-actions">
            <button type="submit" className="btn-save">
              {mode === "edit" ? "บันทึกแก้ไข" : "เพิ่มห้อง"}
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
        <div className="table-toolbar">
          <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
            <option value="">- ทุกอาคาร -</option>
            {buildings.map((building) => (
              <option key={building.building_id} value={building.building_id}>
                {building.building_name}
              </option>
            ))}
          </select>
        </div>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ห้อง</th>
              <th>อาคาร</th>
              <th>ประเภทห้อง</th>
              <th>ชั้น</th>
              <th>ความจุ</th>
              <th>อุปกรณ์</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {filteredRooms.map((room) => (
              <tr key={room.room_id}>
                <td>{room.room_name}</td>
                <td>{room.building_name}</td>
                <td>{room.room_type_name}</td>
                <td>{room.floor}</td>
                <td>{room.capacity}</td>
                <td className="equipment-cell">{room.equipment || "-"}</td>
                <td>{room.status}</td>
                <td>
                  <button onClick={() => openEdit(room)}>แก้ไข</button>
                  <button onClick={() => toggleStatus(room)}>เปลี่ยนสถานะ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default RoomsTab;
