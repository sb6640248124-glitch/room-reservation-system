import { useEffect, useState } from "react";

function ReservationTable() {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    fetch("https://room-reservation-system-production.up.railway.app/api/reservations")
      .then(res => res.json())
      .then(data => setReservations(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📅 ตารางการจองห้อง</h2>

      <table border="1" cellPadding="8" width="100%">
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th>ผู้จอง</th>
            <th>ห้อง</th>
            <th>วันที่</th>
            <th>เวลา</th>
            <th>จำนวนคน</th>
            <th>วัตถุประสงค์</th>
            <th>สถานะ</th>
          </tr>
        </thead>

        <tbody>
          {reservations.map(r => (
            <tr key={r.reservation_id}>
              <td>{r.username}</td>
              <td>{r.room_name}</td>
              <td>{r.start_date}</td>
              <td>{r.start_time} - {r.end_time}</td>
              <td>{r.user_amount}</td>
              <td>{r.purpose}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReservationTable;
