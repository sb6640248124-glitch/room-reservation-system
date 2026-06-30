import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import thLocale from "@fullcalendar/core/locales/th";

function AdminSchedule() {
  const [events, setEvents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    subject_name: "",
    instructor: "",
    building_id: "",
    room_id: "",
  });

  /* ================= FETCH BUILDINGS ================= */
  useEffect(() => {
    axios.get("http://localhost:3002/api/buildings")
      .then(res => setBuildings(res.data))
      .catch(err => console.error(err));
  }, []);

  /* ================= FETCH ROOMS ================= */
  useEffect(() => {
    axios.get("http://localhost:3002/api/rooms")
      .then(res => setRooms(res.data))
      .catch(err => console.error(err));
  }, []);

  /* ================= FETCH SCHEDULES ================= */
  const fetchSchedules = async () => {
    try {
      const res = await axios.get("http://localhost:3002/api/schedules");

      const formatted = res.data.map(item => ({
        id: item.schedule_id,
        title: `${item.subject_name}\n${item.start_time.slice(0,5)} - ${item.end_time.slice(0,5)} (${item.room_name})`,
        start: `${item.date}T${item.start_time}`,
        end: `${item.date}T${item.end_time}`,
        backgroundColor: getRoomColor(item.room_id),
        borderColor: getRoomColor(item.room_id),
      }));

      setEvents(formatted);

    } catch (err) {
      console.error("โหลดตารางไม่สำเร็จ:", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  /* ================= ROOM COLOR ================= */
  const getRoomColor = (roomId) => {
    const colors = [
      "#4CAF50",
      "#2196F3",
      "#FF9800",
      "#9C27B0",
      "#E91E63",
      "#009688"
    ];
    return colors[roomId % colors.length];
  };

  /* ================= CLICK DATE ================= */
  const handleDateClick = (info) => {
    setFormData({
      date: info.dateStr,
      start_time: "",
      end_time: "",
      subject_name: "",
      instructor: "",
      building_id: "",
      room_id: "",
    });
    setShowForm(true);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.building_id || !formData.room_id) {
      alert("กรุณาเลือกอาคารและห้อง");
      return;
    }

    if (formData.start_time >= formData.end_time) {
      alert("เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "http://localhost:3002/api/schedules",
        {
          ...formData,
          building_id: Number(formData.building_id),
          room_id: Number(formData.room_id)
        }
      );

      await fetchSchedules();
      setShowForm(false);

    } catch (err) {
      console.error("POST ERROR:", err.response?.data || err.message);
      alert("บันทึกไม่สำเร็จ");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2> ตารางเรียน</h2>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={thLocale}
        events={events}
        dateClick={handleDateClick}
        height="auto"
        eventDisplay="block"
      />

      {showForm && (
        <div style={{
          marginTop: 20,
          background: "#ffffff",
          padding: 20,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3>เพิ่มตารางเรียน วันที่ {formData.date}</h3>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="ชื่อวิชา"
              value={formData.subject_name}
              onChange={(e) =>
                setFormData({ ...formData, subject_name: e.target.value })
              }
              required
            />

            <br /><br />

            <input
              placeholder="อาจารย์ผู้สอน"
              value={formData.instructor}
              onChange={(e) =>
                setFormData({ ...formData, instructor: e.target.value })
              }
              required
            />

            <br /><br />

            <select
              value={formData.building_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  building_id: e.target.value,
                  room_id: "",
                })
              }
              required
            >
              <option value="">-- เลือกอาคาร --</option>
              {buildings.map(b => (
                <option key={b.building_id} value={b.building_id}>
                  {b.building_name}
                </option>
              ))}
            </select>

            <br /><br />

            <select
              value={formData.room_id}
              onChange={(e) =>
                setFormData({ ...formData, room_id: e.target.value })
              }
              required
            >
              <option value="">-- เลือกห้อง --</option>
              {rooms
                .filter(room =>
                  room.building_id === Number(formData.building_id)
                )
                .map(room => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.room_name}
                  </option>
                ))}
            </select>

            <br /><br />

            <input
              type="time"
              value={formData.start_time}
              onChange={(e) =>
                setFormData({ ...formData, start_time: e.target.value })
              }
              required
            />

            <input
              type="time"
              value={formData.end_time}
              onChange={(e) =>
                setFormData({ ...formData, end_time: e.target.value })
              }
              required
            />

            <br /><br />

            <button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ marginLeft: 10 }}
            >
              ยกเลิก
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminSchedule;
