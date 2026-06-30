import "./Calendar.css";
import { useEffect, useState } from "react";

const hiddenReservationStatuses = [
  "cancelled",
  "canceled",
  "rejected",
  "ยกเลิก",
  "ไม่อนุมัติ",
];

const shouldShowReservation = (reservation) => {
  const status = String(reservation?.status || "").trim().toLowerCase();
  return !hiddenReservationStatuses.some((hiddenStatus) =>
    status.includes(hiddenStatus.toLowerCase())
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

function Calendar({
  year,
  month,
  reservations = [],
  schedules = [],
  selectedDate = "",
  onDateClick,
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = now;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const cells = [];

  const formatDate = (y, m, d) => {
    return (
      y +
      "-" +
      String(m + 1).padStart(2, "0") +
      "-" +
      String(d).padStart(2, "0")
    );
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

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="cell empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const isToday =
      formatDate(today.getFullYear(), today.getMonth(), today.getDate()) ===
      dateStr;

    const daySchedules = schedules.filter((schedule) => {
      if (!schedule.date || !schedule.end_time) return false;

      const scheduleDate = new Date(schedule.date);
      const scheduleDateStr = formatDate(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate()
      );

      const repeatType = schedule.repeat_type || "none";
      const isNormal = scheduleDateStr === dateStr && repeatType === "none";
      const isRecurring = shouldShowRecurring(schedule, dateStr);

      if (!isNormal && !isRecurring) return false;

      if (isToday) {
        const [hour, minute] = String(schedule.end_time).split(":");
        const endTime = new Date();
        endTime.setHours(hour, minute, 0);
        return endTime > now;
      }

      return true;
    });

    const dayReservations = reservations.filter((reservation) => {
      if (!shouldShowReservation(reservation)) return false;
      if (!reservation.start_date || !reservation.end_date || !reservation.end_time) {
        return false;
      }

      const start = new Date(reservation.start_date);
      const end = new Date(reservation.end_date);
      const startStr = formatDate(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const endStr = formatDate(end.getFullYear(), end.getMonth(), end.getDate());
      const inRange = dateStr >= startStr && dateStr <= endStr;
      const isRecurring = shouldShowRecurring(reservation, dateStr);

      if (!inRange && !isRecurring) return false;

      if (isToday) {
        const [hour, minute] = String(reservation.end_time).split(":");
        const endTime = new Date();
        endTime.setHours(hour, minute, 0);
        return endTime > now;
      }

      return true;
    });

    cells.push(
      <button
        type="button"
        key={day}
        className={`cell day ${isToday ? "today" : ""} ${
          selectedDate === dateStr ? "selected" : ""
        }`}
        onClick={() => onDateClick?.(dateStr)}
      >
        <span className="date-number">{day}</span>

        <div className="events">
          {daySchedules.map((schedule) => (
            <div key={schedule.schedule_id} className="event schedule">
              {schedule.room_name ? `${schedule.room_name} ` : ""}
              {String(schedule.start_time || "").slice(0, 5)} -{" "}
              {String(schedule.end_time || "").slice(0, 5)}
            </div>
          ))}

          {dayReservations.map((reservation) => (
            <div key={reservation.reservation_id} className="event reservation">
              {reservation.room_name ? `${reservation.room_name} ` : ""}
              {String(reservation.start_time || "").slice(0, 5)} -{" "}
              {String(reservation.end_time || "").slice(0, 5)}
            </div>
          ))}
        </div>
      </button>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header-row">
        {dayNames.map((dayName) => (
          <div key={dayName} className="day-name">
            {dayName}
          </div>
        ))}
      </div>

      <div className="calendar-grid">{cells}</div>
    </div>
  );
}

export default Calendar;
