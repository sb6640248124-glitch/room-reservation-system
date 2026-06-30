const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/reservations", (req, res) => {
  const { user_id, active_only } = req.query;
  const params = [];
  const filters = [];

  if (user_id) {
    filters.push("r.user_id = ?");
    params.push(user_id);
  }

  if (active_only === "1" || active_only === "true") {
    filters.push(`
      r.status NOT IN ('rejected', 'cancelled', 'canceled', 'ไม่อนุมัติ', 'ยกเลิก')
    `);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sql = `
    SELECT
      r.reservation_id,
      r.user_id,
      r.room_id,
      r.start_date,
      r.end_date,
      r.start_time,
      r.end_time,
      r.user_amount,
      r.purpose,
      r.status,
      r.booking_date AS created_at,
      u.full_name AS username,
      rm.room_name,
      rm.floor,
      rm.capacity,
      b.building_name,
      rt.room_type_name
    FROM reservations r
    LEFT JOIN users u ON r.user_id = u.user_id
    LEFT JOIN rooms rm ON r.room_id = rm.room_id
    LEFT JOIN buildings b ON rm.building_id = b.building_id
    LEFT JOIN room_types rt ON rm.room_type_id = rt.room_type_id
    ${whereClause}
    ORDER BY r.start_date DESC, r.start_time DESC, r.reservation_id DESC
  `;

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("RESERVATIONS ERROR:", err);
      return res.status(500).json({
        message: "เกิดข้อผิดพลาดในการโหลดรายการจอง",
      });
    }

    res.json(rows);
  });
});

router.post("/reservations", (req, res) => {
  const {
    user_id,
    room_id,
    start_date,
    end_date,
    start_time,
    end_time,
    user_amount,
    purpose,
  } = req.body;

  if (!user_id || !room_id || !start_date || !start_time || !end_time || !user_amount) {
    return res.status(400).json({
      message: "กรุณากรอกข้อมูลการจองให้ครบถ้วน",
    });
  }

  if (start_time >= end_time) {
    return res.status(400).json({
      message: "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด",
    });
  }

  const bookingEndDate = end_date || start_date;

  const conflictSql = `
    SELECT 1
    FROM schedules s
    WHERE s.room_id = ?
      AND s.date BETWEEN ? AND ?
      AND s.start_time < ?
      AND s.end_time > ?
    LIMIT 1
  `;

  db.query(
    conflictSql,
    [room_id, start_date, bookingEndDate, end_time, start_time],
    (scheduleErr, scheduleRows) => {
      if (scheduleErr) {
        console.error("SCHEDULE CONFLICT ERROR:", scheduleErr);
        return res.status(500).json({
          message: "เกิดข้อผิดพลาดในการตรวจสอบตารางเรียน",
        });
      }

      if (scheduleRows.length > 0) {
        return res.status(409).json({
          message: "ช่วงเวลานี้มีตารางเรียนแล้ว",
        });
      }

      const reservationConflictSql = `
        SELECT 1
        FROM reservations rv
        WHERE rv.room_id = ?
          AND rv.start_date <= ?
          AND rv.end_date >= ?
          AND rv.start_time < ?
          AND rv.end_time > ?
          AND rv.status NOT IN ('rejected', 'cancelled', 'canceled', 'ไม่อนุมัติ', 'ยกเลิก')
        LIMIT 1
      `;

      db.query(
        reservationConflictSql,
        [room_id, bookingEndDate, start_date, end_time, start_time],
        (reservationErr, reservationRows) => {
          if (reservationErr) {
            console.error("RESERVATION CONFLICT ERROR:", reservationErr);
            return res.status(500).json({
              message: "เกิดข้อผิดพลาดในการตรวจสอบรายการจอง",
            });
          }

          if (reservationRows.length > 0) {
            return res.status(409).json({
              message: "ช่วงเวลานี้มีผู้จองแล้ว",
            });
          }

          const insertSql = `
            INSERT INTO reservations (
              user_id,
              room_id,
              booking_date,
              start_date,
              end_date,
              start_time,
              end_time,
              user_amount,
              purpose,
              status
            )
            VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, 'pending')
          `;

          db.query(
            insertSql,
            [
              user_id,
              room_id,
              start_date,
              bookingEndDate,
              start_time,
              end_time,
              user_amount,
              purpose || "",
            ],
            (insertErr, result) => {
              if (insertErr) {
                console.error("CREATE RESERVATION ERROR:", insertErr);
                return res.status(500).json({
                  message: "เกิดข้อผิดพลาดในการบันทึกการจอง",
                });
              }

              res.status(201).json({
                message: "จองห้องสำเร็จ",
                reservation_id: result.insertId,
              });
            }
          );
        }
      );
    }
  );
});

router.put("/reservations/:id/cancel", (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "ไม่พบข้อมูลผู้ใช้" });
  }

  const sql = `
    UPDATE reservations
    SET status = 'cancelled'
    WHERE reservation_id = ?
      AND user_id = ?
      AND status NOT IN ('approved', 'rejected', 'cancelled')
  `;

  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      console.error("CANCEL RESERVATION ERROR:", err);
      return res.status(500).json({
        message: "เกิดข้อผิดพลาดในการยกเลิกรายการจอง",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "ไม่สามารถยกเลิกรายการนี้ได้",
      });
    }

    res.json({ message: "ยกเลิกรายการจองสำเร็จ" });
  });
});

router.put("/reservations/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ["pending", "processing", "approved", "rejected"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
  }

  const sql = `
    UPDATE reservations
    SET status = ?
    WHERE reservation_id = ?
      AND status NOT IN ('cancelled', 'canceled', 'ยกเลิก')
  `;

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("UPDATE RESERVATION STATUS ERROR:", err);
      return res.status(500).json({
        message: "เกิดข้อผิดพลาดในการอัปเดตสถานะการจอง",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "ไม่สามารถอัปเดตสถานะรายการนี้ได้",
      });
    }

    res.json({ message: "อัปเดตสถานะการจองสำเร็จ" });
  });
});

module.exports = router;
