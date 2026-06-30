import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainMenuTabs from "../components/MainMenuTabs";
import "./Report.css";

const apiBaseUrl = "http://localhost:3002/api";

const statusConfig = {
  pending: { label: "ยังไม่ส่งเอกสาร", className: "pending" },
  processing: { label: "กำลังดำเนินการ", className: "processing" },
  approved: { label: "อนุมัติแล้ว", className: "approved" },
  rejected: { label: "ไม่อนุมัติ", className: "rejected" },
  cancelled: { label: "ยกเลิก", className: "cancelled" },
  canceled: { label: "ยกเลิก", className: "cancelled" },
};

const getStatusInfo = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  return statusConfig[normalized] || {
    label: value || "รอตรวจสอบ",
    className: "pending",
  };
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => String(value || "-").slice(0, 5);

function Report() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError("");

        const [reservationRes, roomRes, userRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/reservations`),
          axios.get(`${apiBaseUrl}/rooms`),
          axios.get(`${apiBaseUrl}/users`),
        ]);

        setReservations(Array.isArray(reservationRes.data) ? reservationRes.data : []);
        setRooms(Array.isArray(roomRes.data) ? roomRes.data : []);
        setUsers(Array.isArray(userRes.data) ? userRes.data : []);
      } catch (err) {
        setError("โหลดข้อมูลรายงานไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const years = useMemo(() => {
    const foundYears = reservations
      .map((item) => new Date(item.start_date).getFullYear())
      .filter((year) => !Number.isNaN(year));
    return [...new Set(foundYears)].sort((a, b) => b - a);
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      const date = new Date(item.start_date);
      if (Number.isNaN(date.getTime())) return true;

      const matchesMonth =
        monthFilter === "all" || String(date.getMonth() + 1) === monthFilter;
      const matchesYear =
        yearFilter === "all" || String(date.getFullYear()) === yearFilter;

      return matchesMonth && matchesYear;
    });
  }, [monthFilter, reservations, yearFilter]);

  const statusCounts = useMemo(() => {
    return filteredReservations.reduce((acc, item) => {
      const status = getStatusInfo(item.status).className;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [filteredReservations]);

  const popularRooms = useMemo(() => {
    const roomMap = new Map();

    filteredReservations.forEach((item) => {
      const key = item.room_id || item.room_name || "unknown";
      const current = roomMap.get(key) || {
        room_id: item.room_id,
        room_name: item.room_name || "-",
        building_name: item.building_name || "-",
        count: 0,
      };

      current.count += 1;
      roomMap.set(key, current);
    });

    return [...roomMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredReservations]);

  const recentReservations = filteredReservations.slice(0, 8);
  const approvedCount = statusCounts.approved || 0;
  const pendingCount = (statusCounts.pending || 0) + (statusCounts.processing || 0);
  const cancelledCount = statusCounts.cancelled || 0;

  return (
    <div className="report-page">
      <MainMenuTabs />

      <main className="report-shell">
        <section className="report-header">
          <div>
            <p>รายงานสำหรับแอดมิน</p>
            <h1>รายงานการจองห้อง</h1>
            <span>สรุปจำนวนการจอง สถานะ ห้องยอดนิยม และรายการล่าสุด</span>
          </div>

          <div className="report-actions">
            <div className="report-filters">
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                <option value="all">ทุกเดือน</option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {new Date(2026, index, 1).toLocaleString("th-TH", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="all">ทุกปี</option>
                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year + 543}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="print-report-btn"
              onClick={() => window.print()}
            >
              พิมพ์รายงาน
            </button>
          </div>
        </section>

        {loading && <div className="report-state">กำลังโหลดรายงาน...</div>}
        {!loading && error && <div className="report-state error">{error}</div>}

        {!loading && !error && (
          <>
            <section className="report-summary-grid">
              <article className="report-card total">
                <span>ทั้งหมด</span>
                <strong>{filteredReservations.length}</strong>
                <p>รายการจอง</p>
              </article>
              <article className="report-card approved">
                <span>อนุมัติแล้ว</span>
                <strong>{approvedCount}</strong>
                <p>พร้อมใช้งาน</p>
              </article>
              <article className="report-card pending">
                <span>รอดำเนินการ</span>
                <strong>{pendingCount}</strong>
                <p>รอตรวจสอบ</p>
              </article>
              <article className="report-card cancelled">
                <span>ยกเลิก</span>
                <strong>{cancelledCount}</strong>
                <p>รายการที่ถูกยกเลิก</p>
              </article>
              <article className="report-card rooms">
                <span>ห้องทั้งหมด</span>
                <strong>{rooms.length}</strong>
                <p>ในระบบ</p>
              </article>
              <article className="report-card users">
                <span>ผู้ใช้ทั้งหมด</span>
                <strong>{users.length}</strong>
                <p>บัญชีผู้ใช้</p>
              </article>
            </section>

            <section className="report-grid">
              <article className="report-panel">
                <div className="panel-title">
                  <h2>สถานะการจอง</h2>
                  <span>{filteredReservations.length} รายการ</span>
                </div>

                <div className="status-list">
                  {Object.entries(statusConfig)
                    .filter(([key]) => key !== "canceled")
                    .map(([key, item]) => (
                      <div className="status-row" key={key}>
                        <span className={`status-dot ${item.className}`}></span>
                        <p>{item.label}</p>
                        <strong>{statusCounts[item.className] || 0}</strong>
                      </div>
                    ))}
                </div>
              </article>

              <article className="report-panel">
                <div className="panel-title">
                  <h2>ห้องที่ถูกจองบ่อย</h2>
                  <span>สูงสุด 5 ห้อง</span>
                </div>

                {popularRooms.length === 0 ? (
                  <p className="empty-report">ยังไม่มีข้อมูลการจอง</p>
                ) : (
                  <div className="popular-list">
                    {popularRooms.map((room, index) => (
                      <div className="popular-room" key={`${room.room_id}-${index}`}>
                        <strong>{index + 1}</strong>
                        <div>
                          <h3>{room.room_name}</h3>
                          <p>{room.building_name}</p>
                        </div>
                        <span>{room.count} ครั้ง</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <section className="report-panel">
              <div className="panel-title">
                <h2>รายการจองล่าสุด</h2>
                <span>{recentReservations.length} รายการ</span>
              </div>

              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>ผู้จอง</th>
                      <th>ห้อง</th>
                      <th>วันที่</th>
                      <th>เวลา</th>
                      <th>วัตถุประสงค์</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReservations.length === 0 ? (
                      <tr>
                        <td colSpan="6">ยังไม่มีรายการจองในช่วงที่เลือก</td>
                      </tr>
                    ) : (
                      recentReservations.map((item) => {
                        const status = getStatusInfo(item.status);
                        return (
                          <tr key={item.reservation_id}>
                            <td>{item.username || "-"}</td>
                            <td>
                              {item.room_name || "-"}
                              <small>{item.building_name || "-"}</small>
                            </td>
                            <td>{formatDate(item.start_date)}</td>
                            <td>
                              {formatTime(item.start_time)} - {formatTime(item.end_time)}
                            </td>
                            <td>{item.purpose || "-"}</td>
                            <td>
                              <span className={`report-status ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Report;
