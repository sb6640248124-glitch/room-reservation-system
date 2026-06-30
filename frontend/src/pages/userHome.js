import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainMenuTabs from "../components/MainMenuTabs";
import Calendar from "../components/Calendar";
import "./Home.css";
import axios from "axios";

const apiBaseUrl = "http://localhost:3002/api";

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const statusText = (value) => String(value || "").trim().toLowerCase();

const inactiveReservationStatuses = [
  "cancelled",
  "canceled",
  "rejected",
  "ยกเลิก",
  "ไม่อนุมัติ",
  "ปฏิเสธ",
];

const isInactiveReservation = (reservation) => {
  const status = statusText(reservation.status);
  return inactiveReservationStatuses.some((hidden) => status.includes(hidden));
};

const isUpcomingReservation = (reservation) => {
  const endDate = String(
    reservation.end_date || reservation.start_date || ""
  ).slice(0, 10);
  const endTime = String(reservation.end_time || "23:59").slice(0, 5);

  if (!endDate) return true;

  return `${endDate}T${endTime}` >= new Date().toISOString().slice(0, 16);
};

function AdminBookingHome() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState(null);
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
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    setUser(storedUser);
  }, [navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [scheduleRes, reservationRes, roomRes, buildingRes, roomTypeRes] =
          await Promise.all([
            axios.get(`${apiBaseUrl}/schedules`),
            axios.get(`${apiBaseUrl}/reservations`),
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
        console.error("โหลดข้อมูลหน้าแอดมินไม่สำเร็จ", err);
      }
    };

    fetchInitialData();
  }, []);

  const activeReservations = useMemo(
    () =>
      reservations.filter((reservation) => !isInactiveReservation(reservation)),
    [reservations]
  );

  const stats = useMemo(() => {
    const today = todayInputValue();

    const upcoming = activeReservations.filter(isUpcomingReservation);
    const pending = activeReservations.filter((item) => {
      const status = statusText(item.status);
      return status.includes("pending") || status.includes("รอดำเนินการ");
    }).length;
    const approved = activeReservations.filter((item) => {
      const status = statusText(item.status);
      return status.includes("approved") || status.includes("อนุมัติ");
    }).length;
    const todayApproved = activeReservations.filter((item) => {
      const startDate = String(item.start_date || "").slice(0, 10);
      const status = statusText(item.status);
      return (
        startDate === today &&
        (status.includes("approved") || status.includes("อนุมัติ"))
      );
    }).length;

    return [
      {
        label: "ยังไม่ถึงวันเวลา",
        value: upcoming.length,
        className: "orange",
      },
      {
        label: "ได้รับการอนุมัติแล้ว",
        value: approved,
        className: "green",
      },
      {
        label: "กำลังดำเนินการ",
        value: pending,
        className: "pink",
      },
      {
        label: "อนุมัติวันนี้",
        value: todayApproved,
        className: "blue",
      },
    ];
  }, [activeReservations]);

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

  if (!user) return null;

  const handleFilterChange = (field, value) => {
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
      setSearchError("กรุณาเลือกวันที่และเวลาให้ครบถ้วน");
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
      setCurrentDate(new Date(filters.date));

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await axios.get(`${apiBaseUrl}/rooms/available?${params}`);
      setAvailableRooms(res.data);
    } catch (err) {
      setAvailableRooms([]);
      setSearchError(
        err.response?.data?.message || "ค้นหาห้องว่างไม่สำเร็จ"
      );
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
    setFilters((current) => ({ ...current, date }));
  };

  return (
    <div className="home admin-booking-page">
      <MainMenuTabs />

      <main className="admin-booking-shell">
        <section className="admin-status-grid" aria-label="สรุปสถานะการจอง">
          {stats.map((item) => (
            <div className={`admin-status-card ${item.className}`} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="admin-calendar-panel">
          <div className="admin-panel-title">ตารางการจองห้อง</div>

          <div className="admin-filter-row">
            <select
              value={filters.room_type_id}
              onChange={(e) => handleFilterChange("room_type_id", e.target.value)}
            >
              <option value="">- เลือกประเภทห้อง -</option>
              {roomTypes.map((type) => (
                <option key={type.room_type_id} value={type.room_type_id}>
                  {type.room_type_name}
                </option>
              ))}
            </select>

            <select
              value={filters.building_id}
              onChange={(e) => handleFilterChange("building_id", e.target.value)}
            >
              <option value="">- เลือกอาคาร -</option>
              {buildings.map((building) => (
                <option key={building.building_id} value={building.building_id}>
                  {building.building_name}
                </option>
              ))}
            </select>

            <select
              value={filters.room_id}
              onChange={(e) => handleFilterChange("room_id", e.target.value)}
            >
              <option value="">- เลือกห้อง -</option>
              {filteredRooms.map((room) => (
                <option key={room.room_id} value={room.room_id}>
                  {room.room_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
            />

            <input
              type="time"
              value={filters.start_time}
              onChange={(e) => handleFilterChange("start_time", e.target.value)}
            />

            <input
              type="time"
              value={filters.end_time}
              onChange={(e) => handleFilterChange("end_time", e.target.value)}
            />

            <button type="button" className="btn-primary" onClick={handleSearch}>
              {searching ? "กำลังค้นหา..." : "ค้นหา"}
            </button>

            <button type="button" className="btn-secondary" onClick={handleReset}>
              รีเซ็ต
            </button>
          </div>

          {searchError && <div className="search-error">{searchError}</div>}

          {hasSearched && !searchError && (
            <div className="admin-search-summary">
              พบห้องว่าง {availableRooms.length} ห้อง ในช่วง {filters.start_time} -{" "}
              {filters.end_time}
            </div>
          )}

          {hasSearched && !searchError && (
            <div className="admin-available-results">
              <div className="results-title">
                <span>ผลการค้นหา</span>
                <strong>{availableRooms.length} ห้อง</strong>
              </div>

              {availableRooms.length === 0 ? (
                <p className="empty-result">ไม่พบห้องว่างตามเงื่อนไขนี้</p>
              ) : (
                <div className="admin-available-list">
                  {availableRooms.map((room) => (
                    <div className="available-room" key={room.room_id}>
                      <h4>{room.room_name}</h4>
                      <p>
                        {room.building_name || "-"} | {room.room_type_name || "-"}
                      </p>
                      <span>
                        ชั้น {room.floor || "-"} | {room.capacity || "-"} ที่นั่ง
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
            reservations={activeReservations}
            schedules={schedules}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
          />

        </section>
      </main>
    </div>
  );
}

export default AdminBookingHome;
