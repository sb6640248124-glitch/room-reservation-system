import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Calendar from "../components/Calendar";
import "./Home.css";

const apiBaseUrl = "https://room-reservation-system-production.up.railway.app/api";

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const hourOptions = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0")
);

const minuteOptions = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, "0")
);

function TimeDropdown({ value, onChange, ariaLabel }) {
  const [hour = "00", minute = "00"] = String(value || "00:00").split(":");

  return (
    <div className="time-dropdown" aria-label={ariaLabel}>
      <select
        aria-label={`${ariaLabel} ชั่วโมง`}
        value={hour}
        onChange={(event) => onChange(`${event.target.value}:${minute}`)}
      >
        {hourOptions.map((option) => (
          <option key={option} value={option}>
            {option} ชั่วโมง
          </option>
        ))}
      </select>
      <span aria-hidden="true">:</span>
      <select
        aria-label={`${ariaLabel} นาที`}
        value={minute}
        onChange={(event) => onChange(`${hour}:${event.target.value}`)}
      >
        {minuteOptions.map((option) => (
          <option key={option} value={option}>
            {option} นาที
          </option>
        ))}
      </select>
    </div>
  );
}

function PublicHome() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [filters, setFilters] = useState({
    room_type_id: "",
    room_id: "",
    building_id: "",
    date: todayInputValue(),
    start_time: "08:00",
    end_time: "09:00",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [scheduleRes, reservationRes, roomRes, buildingRes, roomTypeRes] =
          await Promise.all([
            axios.get(`${apiBaseUrl}/schedules`),
            axios.get(`${apiBaseUrl}/reservations?active_only=1`),
            axios.get(`${apiBaseUrl}/rooms`),
            axios.get(`${apiBaseUrl}/buildings`),
            axios.get(`${apiBaseUrl}/room-types`),
          ]);

        setSchedules(scheduleRes.data);
        setReservations(reservationRes.data);
        setRooms(roomRes.data);
        setBuildings(buildingRes.data);
        setRoomTypes(roomTypeRes.data);
      } catch (err) {
        setSearchError("โหลดข้อมูลรายการห้องไม่สำเร็จ");
      }
    };

    fetchInitialData();
  }, []);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesBuilding =
          !filters.building_id || String(room.building_id) === filters.building_id;
        const matchesRoomType =
          !filters.room_type_id ||
          String(room.room_type_id) === filters.room_type_id;

        return matchesBuilding && matchesRoomType;
      }),
    [filters.building_id, filters.room_type_id, rooms]
  );

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === "building_id" || field === "room_type_id"
        ? { room_id: "" }
        : {}),
    }));
  };

  const handleSearch = async () => {
    if (!filters.date || !filters.start_time || !filters.end_time) {
      setSearchError("กรุณาเลือกวันที่และเวลาให้ครบ");
      return;
    }

    if (filters.start_time >= filters.end_time) {
      setSearchError("เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด");
      return;
    }

    try {
      setSearching(true);
      setSearchError("");
      setHasSearched(true);
      setSelectedDate(filters.date);
      setCurrentDate(new Date(`${filters.date}T00:00:00`));

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await axios.get(`${apiBaseUrl}/rooms/available?${params}`);
      setAvailableRooms(res.data);
    } catch (err) {
      setAvailableRooms([]);
      setSearchError(err.response?.data?.message || "ค้นหาห้องว่างไม่สำเร็จ");
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setFilters({
      room_type_id: "",
      room_id: "",
      building_id: "",
      date: todayInputValue(),
      start_time: "08:00",
      end_time: "09:00",
    });
    setAvailableRooms([]);
    setHasSearched(false);
    setSearchError("");
    setSelectedDate("");
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    updateFilter("date", date);
  };

  return (
    <div className="home public-page">
      <header className="public-topbar">
        <div>
          <strong>ระบบจองห้อง</strong>
          <span>ดูรายการห้องและตารางการใช้งานก่อนเข้าสู่ระบบ</span>
        </div>
        <nav>
          <button type="button" onClick={() => navigate("/login")}>
            เข้าสู่ระบบ
          </button>
          <button type="button" onClick={() => navigate("/register")}>
            ลงทะเบียน
          </button>
        </nav>
      </header>

      <main className="public-shell">
        <section className="public-search-panel">
          <div className="public-panel-heading">
            <p>ค้นหาห้องว่าง</p>
            <h1>รายการห้องสำหรับผู้ใช้งานทั่วไป</h1>
          </div>

          <div className="public-filter-grid">
            <select
              value={filters.room_type_id}
              onChange={(event) => updateFilter("room_type_id", event.target.value)}
            >
              <option value="">- ทุกประเภทห้อง -</option>
              {roomTypes.map((type) => (
                <option key={type.room_type_id} value={type.room_type_id}>
                  {type.room_type_name}
                </option>
              ))}
            </select>

            <select
              value={filters.building_id}
              onChange={(event) => updateFilter("building_id", event.target.value)}
            >
              <option value="">- ทุกอาคาร -</option>
              {buildings.map((building) => (
                <option key={building.building_id} value={building.building_id}>
                  {building.building_name}
                </option>
              ))}
            </select>

            <select
              value={filters.room_id}
              onChange={(event) => updateFilter("room_id", event.target.value)}
            >
              <option value="">- ทุกห้อง -</option>
              {filteredRooms.map((room) => (
                <option key={room.room_id} value={room.room_id}>
                  {room.room_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.date}
              onChange={(event) => updateFilter("date", event.target.value)}
            />
            <label className="public-time-field">
              เวลาเริ่ม
              <TimeDropdown
                ariaLabel="เวลาเริ่ม"
                value={filters.start_time}
                onChange={(value) => updateFilter("start_time", value)}
              />
            </label>
            <label className="public-time-field">
              เวลาสิ้นสุด
              <TimeDropdown
                ariaLabel="เวลาสิ้นสุด"
                value={filters.end_time}
                onChange={(value) => updateFilter("end_time", value)}
              />
            </label>

            <button type="button" className="btn-primary" onClick={handleSearch}>
              {searching ? "กำลังค้นหา..." : "ค้นหา"}
            </button>
            <button type="button" className="btn-secondary" onClick={handleReset}>
              รีเซ็ต
            </button>
          </div>

          {searchError && <div className="search-error">{searchError}</div>}

          {hasSearched && !searchError && (
            <div className="public-results">
              <div className="results-title">
                <span>ผลการค้นหา</span>
                <strong>{availableRooms.length} ห้อง</strong>
              </div>

              {availableRooms.length === 0 ? (
                <p className="empty-result">ไม่พบห้องว่างตามเงื่อนไขนี้</p>
              ) : (
                <div className="public-room-grid">
                  {availableRooms.map((room) => (
                    <article className="available-room public-room-card" key={room.room_id}>
                      <h4>{room.room_name}</h4>
                      <p>
                        {room.building_name || "-"} | {room.room_type_name || "-"}
                      </p>
                      <span>
                        ชั้น {room.floor || "-"} | {room.capacity || "-"} ที่นั่ง
                      </span>
                      {room.equipment && <small>อุปกรณ์: {room.equipment}</small>}
                      <button type="button" onClick={() => navigate("/login")}>
                        เข้าสู่ระบบเพื่อจอง
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="public-calendar-panel">
          <div className="admin-calendar-header">
            <h2>
              {currentDate.toLocaleString("th-TH", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="calendar-actions">
              <button
                type="button"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                ‹
              </button>
              <button type="button" onClick={() => setCurrentDate(new Date())}>
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                ›
              </button>
            </div>
          </div>

          <Calendar
            year={year}
            month={month}
            reservations={reservations}
            schedules={schedules}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
          />
        </section>
      </main>
    </div>
  );
}

export default PublicHome;
