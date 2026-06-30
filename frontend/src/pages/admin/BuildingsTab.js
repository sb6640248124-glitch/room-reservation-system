import { useEffect, useState } from "react";
import axios from "axios";

const emptyForm = {
  building_name: "",
};

function BuildingsTab() {
  const [buildings, setBuildings] = useState([]);
  const [mode, setMode] = useState("add");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    const res = await axios.get("https://room-reservation-system-production.up.railway.app/api/buildings");
    setBuildings(res.data);
  };

  const resetForm = () => {
    setMode("add");
    setEditId(null);
    setForm(emptyForm);
  };

  const openEdit = (building) => {
    setMode("edit");
    setEditId(building.building_id);
    setForm({ building_name: building.building_name || "" });
  };

  const toggleActive = async (building) => {
    const newStatus =
      building.building_status === "ใช้งาน" ? "ปิดใช้งาน" : "ใช้งาน";

    await axios.put(
      `https://room-reservation-system-production.up.railway.app/api/buildings/${building.building_id}`,
      { building_status: newStatus }
    );

    loadBuildings();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.building_name.trim()) {
      alert("กรุณากรอกชื่ออาคาร");
      return;
    }

    if (mode === "edit") {
      await axios.put(`https://room-reservation-system-production.up.railway.app/api/buildings/${editId}`, {
        building_name: form.building_name.trim(),
      });
    } else {
      await axios.post("https://room-reservation-system-production.up.railway.app/api/buildings", {
        building_name: form.building_name.trim(),
      });
    }

    resetForm();
    loadBuildings();
  };

  return (
    <div className="admin-manage-layout">
      <aside className="admin-side-form">
        <div className="side-form-header">
          <h3>{mode === "edit" ? "แก้ไขอาคาร" : "เพิ่มอาคาร"}</h3>
          <p>
            {mode === "edit"
              ? "แก้ไขชื่ออาคารที่เลือก"
              : "เพิ่มอาคารใหม่เข้าระบบ"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            ชื่ออาคาร
            <input
              value={form.building_name}
              onChange={(event) =>
                setForm({ ...form, building_name: event.target.value })
              }
              placeholder="กรอกชื่ออาคาร"
            />
          </label>

          <div className="side-form-actions">
            <button type="submit" className="btn-save">
              {mode === "edit" ? "บันทึกแก้ไข" : "เพิ่มอาคาร"}
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
              <th>ชื่ออาคาร</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {buildings.map((building) => (
              <tr key={building.building_id}>
                <td>{building.building_name}</td>
                <td>{building.building_status}</td>
                <td>
                  <button onClick={() => openEdit(building)}>แก้ไข</button>
                  <button onClick={() => toggleActive(building)}>
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

export default BuildingsTab;
