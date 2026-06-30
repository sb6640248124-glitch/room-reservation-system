import { useEffect, useState } from "react";
import axios from "axios";

function ScheduleTab() {
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [newSchedule, setNewSchedule] = useState({
    room_id: "",
    subject_name: "",
    instructor: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    fetchSchedules();
    fetchRooms();
  }, []);

  const fetchSchedules = async () => {
    const res = await axios.get("https://room-reservation-system-production.up.railway.app/api/schedules");
    setSchedules(res.data);
  };

  const fetchRooms = async () => {
    const res = await axios.get("https://room-reservation-system-production.up.railway.app/api/rooms");
    setRooms(res.data);
  };

  const handleAdd = async () => {
    await axios.post("https://room-reservation-system-production.up.railway.app/api/schedules", {
      ...newSchedule,
      room_id: Number(newSchedule.room_id),
    });

    setNewSchedule({
      room_id: "",
      subject_name: "",
      instructor: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
    });

    fetchSchedules();
  };

  const handleDelete = async (id) => {
    await axios.delete(`https://room-reservation-system-production.up.railway.app/api/schedules/${id}`);
    fetchSchedules();
  };

  return (
    <>
      <h4>📅 จัดการตารางเรียน</h4>

      <div className="card p-3 mb-3">
        <select
          className="form-select mb-2"
          value={newSchedule.room_id}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, room_id: e.target.value })
          }
        >
          <option value="">-- เลือกห้อง --</option>
          {rooms.map((r) => (
            <option key={r.room_id} value={r.room_id}>
              {r.room_name}
            </option>
          ))}
        </select>

        <input
          className="form-control mb-2"
          placeholder="ชื่อวิชา"
          value={newSchedule.subject_name}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, subject_name: e.target.value })
          }
        />

        <input
          className="form-control mb-2"
          placeholder="อาจารย์"
          value={newSchedule.instructor}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, instructor: e.target.value })
          }
        />

        <select
          className="form-select mb-2"
          value={newSchedule.day_of_week}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, day_of_week: e.target.value })
          }
        >
          <option value="">-- เลือกวัน --</option>
          <option>จันทร์</option>
          <option>อังคาร</option>
          <option>พุธ</option>
          <option>พฤหัสบดี</option>
          <option>ศุกร์</option>
        </select>

        <input
          type="time"
          className="form-control mb-2"
          value={newSchedule.start_time}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, start_time: e.target.value })
          }
        />

        <input
          type="time"
          className="form-control mb-2"
          value={newSchedule.end_time}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, end_time: e.target.value })
          }
        />

        <button className="btn btn-success" onClick={handleAdd}>
          ➕ เพิ่มตารางเรียน
        </button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ห้อง</th>
            <th>วิชา</th>
            <th>อาจารย์</th>
            <th>วัน</th>
            <th>เวลา</th>
            <th>จัดการ</th>
          </tr>
        </thead>

        <tbody>
          {schedules.map((s) => (
            <tr key={s.schedule_id}>
              <td>{s.room_name}</td>
              <td>{s.subject_name}</td>
              <td>{s.instructor}</td>
              <td>{s.day_of_week}</td>
              <td>
                {s.start_time} - {s.end_time}
              </td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(s.schedule_id)}
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default ScheduleTab;
