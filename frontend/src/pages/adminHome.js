import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import TopMenu from "../components/TopMenu";
import MainMenuTabs from "../components/MainMenuTabs";
import Calendar from "../components/Calendar";
import "./Home.css";
import axios from "axios";

const todayInputValue = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10);
};

const bookingTimeSlots = [
  ["08:00", "09:00"],
  ["09:00", "10:00"],
  ["10:00", "11:00"],
  ["11:00", "12:00"],
  ["12:00", "13:00"],
  ["13:00", "14:00"],
  ["14:00", "15:00"],
  ["15:00", "16:00"],
  ["16:00", "17:00"],
];

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

const inactiveReservationStatuses = [
  "rejected",
  "cancelled",
  "canceled",
  "ไม่อนุมัติ",
  "ยกเลิก",
];

const formatDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const isActiveReservation = (reservation) => {
  const status = String(reservation?.status || "").trim().toLowerCase();
  return !inactiveReservationStatuses.some((hiddenStatus) =>
    status.includes(hiddenStatus.toLowerCase())
  );
};

const overlapsTime = (startA, endA, startB, endB) => {
  return String(startA).slice(0, 5) < String(endB).slice(0, 5) &&
    String(endA).slice(0, 5) > String(startB).slice(0, 5);
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

const dateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const diffInDays = (start, end) => {
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
};

const isSecondMonday = (date) => {
  return date.getDay() === 1 && Math.ceil(date.getDate() / 7) === 2;
};

const shouldShowRecurring = (item, dateStr) => {
  const repeatType = item.repeat_type || "none";
  if (repeatType === "none") return false;

  const baseDate = dateOnly(item.date || item.start_date);
  const current = dateOnly(dateStr);
  if (current < baseDate) return false;

  if (item.repeat_end_date) {
    const repeatEndDate = dateOnly(item.repeat_end_date);
    if (current > repeatEndDate) return false;
  }

  const daysSinceStart = diffInDays(baseDate, current);
  const interval = Math.max(Number(item.repeat_interval || 1), 1);
  const dayOfWeek = current.getDay();

  if (repeatType === "daily") {
    return daysSinceStart % interval === 0;
  }

  if (repeatType === "weekdays") {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (repeatType === "weekly") {
    const repeatDays = parseRepeatDays(item.repeat_days);
    const weekIndex = Math.floor(daysSinceStart / 7);
    return repeatDays.includes(dayOfWeek) && weekIndex % interval === 0;
  }

  if (repeatType === "monthly_second_monday") {
    return isSecondMonday(current);
  }

  if (repeatType === "yearly_jun8") {
    return current.getMonth() === 5 && current.getDate() === 8;
  }

  return false;
};

function Home() {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotSummaries, setSlotSummaries] = useState([]);
  const [bookingRooms, setBookingRooms] = useState([]);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [filters, setFilters] = useState({
    room_type_id: "",
    room_id: "",
    building_id: "",
    date: todayInputValue(),
    start_time: "08:00",
    end_time: "09:00",
  });
  const [bookingForm, setBookingForm] = useState({
    room_id: "",
    start_time: "08:00",
    end_time: "09:00",
    user_amount: 1,
    purpose: "",
  });

//   useEffect(() => {
//   axios.get("http://localhost:3002/api/ReservationTable")
//     .then(res => setReservations(res.data))
//     .catch(err => console.error(err));
// }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  //  ตรวจสอบ login + โหลดข้อมูล
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
          axios.get("http://localhost:3002/api/schedules"),
          axios.get("http://localhost:3002/api/reservations?active_only=1"),
          axios.get("http://localhost:3002/api/rooms"),
          axios.get("http://localhost:3002/api/buildings"),
          axios.get("http://localhost:3002/api/room-types"),
        ]);

      setSchedules(scheduleRes.data);
      setReservations(reservationRes.data);
      setRooms(roomRes.data);
      setBuildings(buildingRes.data);
      setRoomTypes(roomTypeRes.data);
    } catch (err) {
      console.error("โหลดข้อมูลไม่สำเร็จ", err);
    }
  };

  fetchInitialData();
}, []);



  //  ยังไม่มี user → ไม่ render
  if (!user) return null;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const filteredRooms = rooms.filter((room) => {
    const matchesBuilding =
      !filters.building_id || String(room.building_id) === filters.building_id;
    const matchesRoomType =
      !filters.room_type_id || String(room.room_type_id) === filters.room_type_id;

    return matchesBuilding && matchesRoomType;
  });

  const selectedBookingRoom = bookingRooms.find(
    (room) => String(room.room_id) === String(bookingForm.room_id)
  );

  const selectedBookingDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const isSelectedRoomBusy = (startTime, endTime, roomIdOverride = bookingForm.room_id) => {
    if (!roomIdOverride || !selectedDate) return false;

    const roomId = String(roomIdOverride);
    const dateKey = formatDateKey(selectedDate);

    const hasReservationConflict = reservations.some((reservation) => {
      if (!isActiveReservation(reservation)) return false;
      if (String(reservation.room_id) !== roomId) return false;

      const startDate = formatDateKey(reservation.start_date);
      const endDate = formatDateKey(reservation.end_date || reservation.start_date);
      const inDateRange = dateKey >= startDate && dateKey <= endDate;
      const isRecurringReservation = shouldShowRecurring(reservation, dateKey);
      if (!inDateRange && !isRecurringReservation) return false;

      return overlapsTime(
        startTime,
        endTime,
        reservation.start_time,
        reservation.end_time
      );
    });

    if (hasReservationConflict) return true;

    return schedules.some((schedule) => {
      if (String(schedule.room_id) !== roomId) return false;

      const scheduleDate = formatDateKey(schedule.date);
      const isNormalSchedule =
        scheduleDate === dateKey && (schedule.repeat_type || "none") === "none";
      const isRecurringSchedule = shouldShowRecurring(schedule, dateKey);

      if (!isNormalSchedule && !isRecurringSchedule) return false;

      return overlapsTime(startTime, endTime, schedule.start_time, schedule.end_time);
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === "building_id" || field === "room_type_id" ? { room_id: "" } : {}),
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

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await axios.get(
        `http://localhost:3002/api/rooms/available?${params.toString()}`
      );

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
    setSearchError("");
    setHasSearched(false);
  };

  const getAvailableRooms = async ({ date, start_time, end_time, room_id }) => {
    const params = new URLSearchParams({
      date,
      start_time,
      end_time,
    });

    ["room_type_id", "building_id", "room_id"].forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });

    if (room_id) {
      params.set("room_id", room_id);
    }

    const res = await axios.get(
      `http://localhost:3002/api/rooms/available?${params.toString()}`
    );

    return res.data;
  };

  const loadBookingRooms = async ({ date, start_time, end_time }) => {
    const roomsForSlot = await getAvailableRooms({ date, start_time, end_time });
    setBookingRooms(roomsForSlot);
    setBookingForm((current) => ({
      ...current,
      start_time,
      end_time,
      room_id: roomsForSlot.some(
        (room) => String(room.room_id) === String(current.room_id)
      )
        ? current.room_id
        : "",
    }));
  };

  const loadDateAvailability = async (date) => {
    setSlotLoading(true);
    setBookingError("");
    setBookingSuccess("");

    try {
      const summaries = await Promise.all(
        bookingTimeSlots.map(async ([start_time, end_time]) => {
          const roomsForSlot = await getAvailableRooms({
            date,
            start_time,
            end_time,
          });
          return {
            start_time,
            end_time,
            count: roomsForSlot.length,
          };
        })
      );

      setSlotSummaries(summaries);

      const firstAvailable = summaries.find((slot) => slot.count > 0);
      if (firstAvailable) {
        await loadBookingRooms({ date, ...firstAvailable });
      } else {
        setBookingRooms([]);
        setBookingForm((current) => ({
          ...current,
          room_id: "",
          start_time: "08:00",
          end_time: "09:00",
        }));
      }
    } catch (err) {
      setSlotSummaries([]);
      setBookingRooms([]);
      setBookingError(err.response?.data?.message || "โหลดช่วงเวลาว่างไม่สำเร็จ");
    } finally {
      setSlotLoading(false);
    }
  };

  const handleCalendarDateClick = (date) => {
    setSelectedDate(date);
    setBookingOpen(true);
    setFilters((current) => ({ ...current, date }));
    loadDateAvailability(date);
  };

  const handleSlotSelect = async (slot) => {
    if (slot.count === 0 || isSelectedRoomBusy(slot.start_time, slot.end_time)) {
      setBookingError("ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกช่วงเวลาอื่น");
      return;
    }

    try {
      setBookingError("");
      await loadBookingRooms({
        date: selectedDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
      });
    } catch (err) {
      setBookingError(err.response?.data?.message || "โหลดห้องว่างไม่สำเร็จ");
    }
  };

  const handleBookingRoomChange = async (roomId) => {
    setBookingForm((current) => ({
      ...current,
      room_id: roomId,
    }));
    setBookingError("");
    setBookingSuccess("");

    if (!selectedDate) return;

    try {
      setSlotLoading(true);
      const summaries = await Promise.all(
        bookingTimeSlots.map(async ([start_time, end_time]) => {
          const roomsForSlot = await getAvailableRooms({
            date: selectedDate,
            start_time,
            end_time,
            room_id: roomId,
          });

          return {
            start_time,
            end_time,
            count: roomId && roomsForSlot.length === 0 ? 0 : roomsForSlot.length,
          };
        })
      );

      setSlotSummaries(summaries);

      const currentSlot = summaries.find(
        (slot) =>
          slot.start_time === bookingForm.start_time &&
          slot.end_time === bookingForm.end_time
      );

      if (
        roomId &&
        currentSlot &&
        (currentSlot.count === 0 ||
          isSelectedRoomBusy(currentSlot.start_time, currentSlot.end_time, roomId))
      ) {
        setBookingError("ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกช่วงเวลาอื่น");
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || "ตรวจสอบช่วงเวลาไม่สำเร็จ");
    } finally {
      setSlotLoading(false);
    }
  };

  const handleBookingTimeChange = (field, value) => {
    setBookingForm((current) => ({
      ...current,
      [field]: value,
      room_id: "",
    }));
    setBookingRooms([]);
    setBookingError("");
  };

  const handleCheckCustomTime = async () => {
    if (!bookingForm.start_time || !bookingForm.end_time) {
      setBookingError("กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุด");
      return;
    }

    if (bookingForm.start_time >= bookingForm.end_time) {
      setBookingError("เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด");
      return;
    }

    try {
      setSlotLoading(true);
      setBookingError("");
      setBookingSuccess("");
      await loadBookingRooms({
        date: selectedDate,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
      });
    } catch (err) {
      setBookingRooms([]);
      setBookingError(err.response?.data?.message || "โหลดห้องว่างไม่สำเร็จ");
    } finally {
      setSlotLoading(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!bookingForm.room_id) {
      setBookingError("กรุณาเลือกห้องที่ต้องการจอง");
      return;
    }

    if (isSelectedRoomBusy(bookingForm.start_time, bookingForm.end_time)) {
      setBookingError("ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกช่วงเวลาอื่น");
      return;
    }

    const roomLabel = selectedBookingRoom
      ? [
          selectedBookingRoom.room_name || selectedBookingRoom.room_number || "ห้องที่เลือก",
          selectedBookingRoom.building_name,
          selectedBookingRoom.capacity ? `${selectedBookingRoom.capacity} ที่นั่ง` : "",
        ]
          .filter(Boolean)
          .join(" | ")
      : "ห้องที่เลือก";

    const confirmed = window.confirm(
      [
        "ต้องการยืนยันการจองห้องใช่ไหม",
        "",
        `ห้อง: ${roomLabel}`,
        `วันที่: ${selectedBookingDateLabel}`,
        `เวลา: ${bookingForm.start_time} - ${bookingForm.end_time}`,
        `จำนวนผู้ใช้: ${bookingForm.user_amount}`,
      ].join("\n")
    );

    if (!confirmed) return;

    try {
      setSubmittingBooking(true);
      setBookingError("");
      setBookingSuccess("");

      await axios.post("http://localhost:3002/api/reservations", {
        user_id: user.user_id,
        room_id: bookingForm.room_id,
        start_date: selectedDate,
        end_date: selectedDate,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        user_amount: bookingForm.user_amount,
        purpose: bookingForm.purpose,
      });

      setBookingSuccess("ส่งคำขอจองห้องสำเร็จ");
      setBookingForm((current) => ({ ...current, purpose: "", user_amount: 1 }));

      const reservationRes = await axios.get("http://localhost:3002/api/reservations?active_only=1");
      setReservations(reservationRes.data);
      await loadDateAvailability(selectedDate);
    } catch (err) {
      setBookingError(err.response?.data?.message || "บันทึกการจองไม่สำเร็จ");
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="home">
      <MainMenuTabs />
      {/* <TopMenu active="/home" /> */}
      
      {/*  CONTENT */}
      <div className="layout">
        {/* ===== ซ้าย: ค้นหาห้อง ===== */}
    <div className="search-panel">
      <h3> ค้นหาห้องว่าง</h3>

      <label>
        ประเภทห้อง
        <select
          value={filters.room_type_id}
          onChange={(e) => handleFilterChange("room_type_id", e.target.value)}
        >
          <option value="">- ทุกประเภทห้อง -</option>
          {roomTypes.map((type) => (
            <option key={type.room_type_id} value={type.room_type_id}>
              {type.room_type_name}
            </option>
          ))}
        </select>
      </label>

      <label>
        อาคาร
        <select
          value={filters.building_id}
          onChange={(e) => handleFilterChange("building_id", e.target.value)}
        >
          <option value="">- ทุกอาคาร -</option>
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
          value={filters.room_id}
          onChange={(e) => handleFilterChange("room_id", e.target.value)}
        >
          <option value="">- ทุกห้อง -</option>
          {filteredRooms.map((room) => (
            <option key={room.room_id} value={room.room_id}>
              {room.room_name}
            </option>
          ))}
        </select>
      </label>

      <label>
        วันที่
        <input
          type="date"
          value={filters.date}
          onChange={(e) => handleFilterChange("date", e.target.value)}
        />
      </label>

      <div className="time-row">
        <label>
          เริ่ม
          <TimeDropdown
            ariaLabel="เวลาเริ่ม"
            value={filters.start_time}
            onChange={(value) => handleFilterChange("start_time", value)}
          />
        </label>
        <label>
          สิ้นสุด
          <TimeDropdown
            ariaLabel="เวลาสิ้นสุด"
            value={filters.end_time}
            onChange={(value) => handleFilterChange("end_time", value)}
          />
        </label>
      </div>

      {/* <select><option>- เลือกวัน/เดือน/ปี -</option></select> */}
      {/* <select><option>- เลือกเวลา -</option></select> */}
      <div className="search-actions">
  <button className="btn-primary" onClick={handleSearch} disabled={searching}>
    {searching ? "กำลังค้นหา..." : "ค้นหา"}
  </button>
  <button className="btn-secondary" onClick={handleReset}>รีเซ็ต</button>
</div>

      {searchError && <div className="search-error">{searchError}</div>}

      {hasSearched && !searching && !searchError && (
        <div className="available-results">
          <div className="results-title">
            <span>ผลการค้นหา</span>
            <strong>{availableRooms.length} ห้อง</strong>
          </div>

          {availableRooms.length === 0 ? (
            <p className="empty-result">ไม่พบห้องว่างตามเงื่อนไขนี้</p>
          ) : (
            availableRooms.map((room) => (
              <div className="available-room" key={room.room_id}>
                <h4>{room.room_name}</h4>
                <p>{room.building_name || "-"} | {room.room_type_name || "-"}</p>
                <span>ชั้น {room.floor || "-"} | {room.capacity || "-"} ที่นั่ง</span>
                {room.equipment && (
                  <small className="room-equipment">อุปกรณ์: {room.equipment}</small>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
        <main className="main">
          <div className="calendar-header">
  <h2 className="calendar-title">
    {currentDate.toLocaleString("th-TH", {
      month: "long",
      year: "numeric",
    })}
  </h2>

            <div className="calendar-actions">
              <button onClick={prevMonth}>◀</button>
              <button onClick={goToday}>วันนี้</button>
              <button onClick={nextMonth}>▶</button>
            </div>
          </div>

          <Calendar
  year={year}
  month={month}
  reservations={reservations}
  schedules={schedules}
  selectedDate={selectedDate}
  onDateClick={handleCalendarDateClick}
/>
        </main>
      </div>

      {bookingOpen && (
        <div className="booking-modal-backdrop">
          <div className="booking-modal" role="dialog" aria-modal="true">
            <div className="booking-modal-header">
              <div>
                <p>วันที่เลือก</p>
                <h3>
                  {new Date(selectedDate).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>
              <button type="button" onClick={() => setBookingOpen(false)}>
                ปิด
              </button>
            </div>

            <div className="booking-modal-body">
              <section className="slot-panel">
                <h4>ช่วงเวลาจองห้อง</h4>
                <div className="slot-legend">
                  <span className="available-dot">จองได้</span>
                  <span className="unavailable-dot">จองไม่ได้</span>
                </div>
                {slotLoading ? (
                  <div className="booking-state">กำลังโหลดช่วงเวลา...</div>
                ) : (
                  <div className="slot-list">
                    {slotSummaries.map((slot) => {
                      const isAvailable =
                        slot.count > 0 &&
                        !isSelectedRoomBusy(slot.start_time, slot.end_time);
                      const isActive =
                        bookingForm.start_time === slot.start_time &&
                        bookingForm.end_time === slot.end_time;

                      return (
                        <button
                          type="button"
                          key={`${slot.start_time}-${slot.end_time}`}
                          className={`slot-item ${isActive ? "active" : ""} ${
                            isAvailable ? "available" : "unavailable"
                          }`}
                          disabled={!isAvailable}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          <span>{slot.start_time} - {slot.end_time}</span>
                          <strong>{isAvailable ? "จองได้" : "จองไม่ได้"}</strong>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <form className="booking-form" onSubmit={handleSubmitBooking}>
                <h4>ดำเนินการจองห้อง</h4>

                <label>
                  ห้องที่ว่าง
                  <select
                    value={bookingForm.room_id}
                    onChange={(e) => handleBookingRoomChange(e.target.value)}
                  >
                    <option value="">- เลือกห้อง -</option>
                    {bookingRooms.map((room) => (
                      <option key={room.room_id} value={room.room_id}>
                        {room.room_name} | {room.building_name} | {room.capacity} ที่นั่ง
                      </option>
                    ))}
                  </select>
                </label>

                {selectedBookingRoom?.equipment && (
                  <div className="booking-room-equipment">
                    <strong>อุปกรณ์ในห้อง</strong>
                    <p>{selectedBookingRoom.equipment}</p>
                  </div>
                )}

                <div className="time-row">
                  <label>
                    เริ่ม
                    <TimeDropdown
                      ariaLabel="เวลาเริ่มจอง"
                      value={bookingForm.start_time}
                      onChange={(value) =>
                        handleBookingTimeChange("start_time", value)
                      }
                    />
                  </label>
                  <label>
                    สิ้นสุด
                    <TimeDropdown
                      ariaLabel="เวลาสิ้นสุดการจอง"
                      value={bookingForm.end_time}
                      onChange={(value) =>
                        handleBookingTimeChange("end_time", value)
                      }
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="btn-secondary custom-time-btn"
                  onClick={handleCheckCustomTime}
                  disabled={slotLoading}
                >
                  {slotLoading ? "กำลังตรวจสอบ..." : "ตรวจสอบห้องว่างตามเวลานี้"}
                </button>

                <label>
                  จำนวนผู้ใช้
                  <input
                    type="number"
                    min="1"
                    value={bookingForm.user_amount}
                    onChange={(e) =>
                      setBookingForm((current) => ({
                        ...current,
                        user_amount: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  วัตถุประสงค์
                  <textarea
                    rows="3"
                    value={bookingForm.purpose}
                    onChange={(e) =>
                      setBookingForm((current) => ({
                        ...current,
                        purpose: e.target.value,
                      }))
                    }
                    placeholder="ระบุรายละเอียดการใช้งาน"
                  />
                </label>

                {bookingError && <div className="search-error">{bookingError}</div>}
                {bookingSuccess && <div className="booking-success">{bookingSuccess}</div>}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingBooking || bookingRooms.length === 0}
                >
                  {submittingBooking ? "กำลังบันทึก..." : "ยืนยันการจอง"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
