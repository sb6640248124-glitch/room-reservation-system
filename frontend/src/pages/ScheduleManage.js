import { useEffect, useState } from "react";
import MainMenuTabs from "../components/MainMenuTabs";
import "./ScheduleManage.css";
import "./admin/AdminRooms.css";

const emptyForm = {
  subject_name: "",
  instructor: "",
  date: "",
  start_time: "",
  end_time: "",
  building_id: "",
  room_id: "",
  repeat_type: "none",
  repeat_interval: 1,
  repeat_days: [],
  repeat_end_date: "",
};

const repeatOptions = [
  { value: "none", label: "ไม่เกิดซ้ำ" },
  { value: "daily", label: "รายวัน" },
  { value: "weekly_monday", label: "รายสัปดาห์ ใน วันจันทร์" },
  { value: "monthly_second_monday", label: "รายเดือน ทุกวันจันทร์ที่สอง" },
  { value: "yearly_jun8", label: "รายปี ในเดือน มิถุนายน วันที่ 8" },
  { value: "weekdays", label: "ทุกวันธรรมดา (วันจันทร์ถึงวันศุกร์)" },
  { value: "custom", label: "กำหนดเอง..." },
];

const weekDays = [
  { value: 1, label: "จ" },
  { value: 2, label: "อ" },
  { value: 3, label: "พ" },
  { value: 4, label: "พฤ" },
  { value: 5, label: "ศ" },
  { value: 6, label: "ส" },
  { value: 0, label: "อา" },
];

const fullDayNames = {
  0: "อาทิตย์",
  1: "จันทร์",
  2: "อังคาร",
  3: "พุธ",
  4: "พฤหัสบดี",
  5: "ศุกร์",
  6: "เสาร์",
};

const getDayFromDate = (dateValue) => {
  if (!dateValue) return 1;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 1;
  return date.getDay();
};

const formatInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
);
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

const splitTime = (value) => {
  const [hour = "", minute = ""] = String(value || "").split(":");
  return { hour, minute };
};

const TimeField = ({ label, value, onChange }) => {
  const { hour, minute } = splitTime(value);

  const updateTime = (nextHour, nextMinute) => {
    if (!nextHour && !nextMinute) {
      onChange("");
      return;
    }

    onChange(`${nextHour || "00"}:${nextMinute || "00"}`);
  };

  return (
    <label>
      {label}
      <div className="time-24-control">
        <select
          value={hour}
          onChange={(event) => updateTime(event.target.value, minute)}
        >
          <option value="">ชั่วโมง</option>
          {hours.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          value={minute}
          onChange={(event) => updateTime(hour, event.target.value)}
        >
          <option value="">นาที</option>
          {minutes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
};

const parseRepeatDays = (value) => {
  if (Array.isArray(value)) return value.map(Number);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return String(value)
      .split(",")
      .map((day) => Number(day))
      .filter((day) => !Number.isNaN(day));
  }
};

const getRepeatPreset = (schedule) => {
  const type = schedule.repeat_type || "none";
  const days = parseRepeatDays(schedule.repeat_days);

  if (type === "weekly" && days.length === 1) {
    return "weekly_monday";
  }
  if (type === "weekdays") return "weekdays";
  if (type === "monthly_second_monday") return "monthly_second_monday";
  if (type === "yearly_jun8") return "yearly_jun8";
  if (type === "daily") return "daily";
  if (type === "weekly") return "custom";

  return "none";
};

const buildRepeatPayload = (form) => {
  if (form.repeat_type === "daily") {
    return { repeat_type: "daily", repeat_interval: 1, repeat_days: [] };
  }
  if (form.repeat_type === "weekly_monday") {
    return {
      repeat_type: "weekly",
      repeat_interval: 1,
      repeat_days: [getDayFromDate(form.date)],
    };
  }
  if (form.repeat_type === "monthly_second_monday") {
    return {
      repeat_type: "monthly_second_monday",
      repeat_interval: 1,
      repeat_days: [1],
    };
  }
  if (form.repeat_type === "yearly_jun8") {
    return { repeat_type: "yearly_jun8", repeat_interval: 1, repeat_days: [] };
  }
  if (form.repeat_type === "weekdays") {
    return {
      repeat_type: "weekdays",
      repeat_interval: 1,
      repeat_days: [1, 2, 3, 4, 5],
    };
  }
  if (form.repeat_type === "custom") {
    return {
      repeat_type: "weekly",
      repeat_interval: Number(form.repeat_interval) || 1,
      repeat_days: form.repeat_days,
    };
  }

  return { repeat_type: "none", repeat_interval: 1, repeat_days: [] };
};

const repeatLabel = (schedule) => {
  const preset = getRepeatPreset(schedule);
  const option = repeatOptions.find((item) => item.value === preset);
  const repeatDays = parseRepeatDays(schedule.repeat_days);

  if (preset === "weekly_monday" && repeatDays.length === 1) {
    return `รายสัปดาห์ ใน วัน${fullDayNames[repeatDays[0]] || ""}`;
  }

  if (preset === "custom") {
    const days = repeatDays
      .map((day) => weekDays.find((item) => item.value === day)?.label)
      .filter(Boolean)
      .join(", ");
    return days ? `กำหนดเอง: ${days}` : "กำหนดเอง";
  }

  return option?.label || "ไม่เกิดซ้ำ";
};

function ScheduleManage() {
  const [schedules, setSchedules] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [mode, setMode] = useState("add");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchSchedules();
    fetchBuildings();
  }, []);

  const fetchSchedules = async () => {
    const res = await fetch("https://room-reservation-system-production.up.railway.app/api/schedules");
    const data = await res.json();
    setSchedules(Array.isArray(data) ? data : []);
  };

  const fetchBuildings = async () => {
    const res = await fetch("https://room-reservation-system-production.up.railway.app/api/buildings");
    const data = await res.json();
    setBuildings(Array.isArray(data) ? data : []);
  };

  const fetchRoomsByBuilding = async (buildingId) => {
    if (!buildingId) {
      setRooms([]);
      return [];
    }

    const res = await fetch(
      `https://room-reservation-system-production.up.railway.app/api/rooms/by-building/${buildingId}`
    );
    const data = await res.json();
    const nextRooms = Array.isArray(data) ? data : [];
    setRooms(nextRooms);
    return nextRooms;
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleBuildingChange = async (buildingId) => {
    setForm((current) => ({ ...current, building_id: buildingId, room_id: "" }));
    await fetchRoomsByBuilding(buildingId);
  };

  const handleRepeatChange = (repeatType) => {
    setForm((current) => ({
      ...current,
      repeat_type: repeatType,
      repeat_days: repeatType === "custom" ? current.repeat_days : [],
      repeat_interval: current.repeat_interval || 1,
    }));
  };

  const toggleRepeatDay = (day) => {
    setForm((current) => {
      const currentDays = parseRepeatDays(current.repeat_days);
      const repeat_days = currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day];
      return { ...current, repeat_days };
    });
  };

  const resetForm = () => {
    setMode("add");
    setEditId(null);
    setRooms([]);
    setForm(emptyForm);
  };

  const openEdit = async (schedule) => {
    setMode("edit");
    setEditId(schedule.schedule_id);
    const roomOptions = await fetchRoomsByBuilding(schedule.building_id);
    const selectedRoom = roomOptions.find(
      (room) => String(room.room_id) === String(schedule.room_id)
    );

    setForm({
      subject_name: schedule.subject_name || "",
      instructor: schedule.instructor || "",
      date: formatInputDate(schedule.date),
      start_time: String(schedule.start_time || "").slice(0, 5),
      end_time: String(schedule.end_time || "").slice(0, 5),
      building_id: schedule.building_id ? String(schedule.building_id) : "",
      room_id: selectedRoom ? String(selectedRoom.room_id) : "",
      repeat_type: getRepeatPreset(schedule),
      repeat_interval: schedule.repeat_interval || 1,
      repeat_days: parseRepeatDays(schedule.repeat_days),
      repeat_end_date: schedule.repeat_end_date
        ? String(schedule.repeat_end_date).slice(0, 10)
        : "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ต้องการลบตารางเรียนนี้ใช่ไหม")) return;

    await fetch(`https://room-reservation-system-production.up.railway.app/api/schedules/${id}`, {
      method: "DELETE",
    });

    fetchSchedules();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.subject_name ||
      !form.date ||
      !form.start_time ||
      !form.end_time ||
      !form.room_id
    ) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (form.start_time >= form.end_time) {
      alert("เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด");
      return;
    }

    if (form.repeat_type === "custom" && form.repeat_days.length === 0) {
      alert("กรุณาเลือกวันที่ต้องการให้เกิดซ้ำ");
      return;
    }

    const repeatPayload = buildRepeatPayload(form);
    const payload = {
      subject_name: form.subject_name,
      instructor: form.instructor,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      room_id: form.room_id,
      repeat_end_date: form.repeat_end_date || null,
      ...repeatPayload,
    };

    const url =
      mode === "edit"
        ? `https://room-reservation-system-production.up.railway.app/api/schedules/${editId}`
        : "https://room-reservation-system-production.up.railway.app/api/schedules";

    await fetch(url, {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    resetForm();
    fetchSchedules();
  };

  return (
    <div className="home">
      <MainMenuTabs />

      <div className="admin-container schedule-admin-container">
        <h2 className="page-title">จัดการข้อมูลตารางเรียน</h2>

        <div className="admin-manage-layout">
          <aside className="admin-side-form">
            <div className="side-form-header">
              <h3>{mode === "edit" ? "แก้ไขตารางเรียน" : "เพิ่มตารางเรียน"}</h3>
              <p>
                {mode === "edit"
                  ? "แก้ไขวัน เวลา ห้อง และรูปแบบการเกิดซ้ำ"
                  : "เพิ่มตารางเรียนใหม่ พร้อมกำหนดการเกิดซ้ำ"}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                ชื่อวิชา
                <input
                  value={form.subject_name}
                  onChange={(event) =>
                    updateForm("subject_name", event.target.value)
                  }
                  placeholder="กรอกชื่อวิชา"
                />
              </label>

              <label>
                ชื่อผู้สอน
                <input
                  value={form.instructor}
                  onChange={(event) =>
                    updateForm("instructor", event.target.value)
                  }
                  placeholder="กรอกชื่อผู้สอน"
                />
              </label>

              <label>
                อาคาร
                <select
                  value={form.building_id}
                  onChange={(event) => handleBuildingChange(event.target.value)}
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
                ห้อง
                <select
                  value={form.room_id}
                  onChange={(event) => updateForm("room_id", event.target.value)}
                >
                  <option value="">- เลือกห้อง -</option>
                  {rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.room_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                วันที่เริ่มต้น
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateForm("date", event.target.value)}
                />
              </label>

              <TimeField
                label="เวลาเริ่มต้น"
                value={form.start_time}
                onChange={(value) => updateForm("start_time", value)}
              />

              <TimeField
                label="เวลาสิ้นสุด"
                value={form.end_time}
                onChange={(value) => updateForm("end_time", value)}
              />

              <label>
                การเกิดซ้ำ
                <select
                  value={form.repeat_type}
                  onChange={(event) => handleRepeatChange(event.target.value)}
                >
                  {repeatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === "weekly_monday" && form.date
                        ? `รายสัปดาห์ ใน วัน${
                            fullDayNames[getDayFromDate(form.date)]
                          }`
                        : option.label}
                    </option>
                  ))}
                </select>
              </label>

              {form.repeat_type !== "none" && (
                <label>
                  สิ้นสุดการเกิดซ้ำ
                  <input
                    type="date"
                    value={form.repeat_end_date}
                    onChange={(event) =>
                      updateForm("repeat_end_date", event.target.value)
                    }
                  />
                </label>
              )}

              {form.repeat_type === "custom" && (
                <div className="repeat-custom-box">
                  <label>
                    เกิดซ้ำทุกกี่สัปดาห์
                    <input
                      type="number"
                      min="1"
                      value={form.repeat_interval}
                      onChange={(event) =>
                        updateForm("repeat_interval", event.target.value)
                      }
                    />
                  </label>

                  <div className="repeat-day-picker">
                    {weekDays.map((day) => (
                      <button
                        type="button"
                        key={day.value}
                        className={
                          form.repeat_days.includes(day.value) ? "active" : ""
                        }
                        onClick={() => toggleRepeatDay(day.value)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="side-form-actions">
                <button type="submit" className="btn-save">
                  {mode === "edit" ? "บันทึกแก้ไข" : "เพิ่มตารางเรียน"}
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
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>ห้อง</th>
                  <th>วิชา</th>
                  <th>ผู้สอน</th>
                  <th>วัน</th>
                  <th>เวลา</th>
                  <th>เกิดซ้ำ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.schedule_id}>
                    <td>{schedule.room_name}</td>
                    <td>{schedule.subject_name}</td>
                    <td>{schedule.instructor}</td>
                    <td>
                      {schedule.date
                        ? new Date(schedule.date).toLocaleDateString("th-TH")
                        : "-"}
                    </td>
                    <td>
                      {String(schedule.start_time || "").slice(0, 5)} -{" "}
                      {String(schedule.end_time || "").slice(0, 5)}
                    </td>
                    <td>{repeatLabel(schedule)}</td>
                    <td>
                      <button onClick={() => openEdit(schedule)}>แก้ไข</button>
                      <button onClick={() => handleDelete(schedule.schedule_id)}>
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ScheduleManage;
