const express = require("express");
const router = express.Router();
const db = require("../db");

const ACTIVE_STATUS = "ใช้งาน";
const INACTIVE_STATUS = "ปิดใช้งาน";

db.query("ALTER TABLE rooms ADD COLUMN equipment TEXT NULL", (err) => {
  if (err && err.code !== "ER_DUP_FIELDNAME") {
    console.error("ROOM EQUIPMENT COLUMN ERROR:", err.message);
  }
});

const roomSelectSql = `
  SELECT
    r.room_id,
    r.room_name,
    r.building_id,
    r.room_type_id,
    r.floor,
    r.capacity,
    r.equipment,
    r.status,
    b.building_name,
    t.room_type_name
  FROM rooms r
  LEFT JOIN buildings b ON r.building_id = b.building_id
  LEFT JOIN room_types t ON r.room_type_id = t.room_type_id
`;

const isInvalidRoomPayload = ({
  room_name,
  floor,
  capacity,
  building_id,
  room_type_id,
}) => {
  return (
    !room_name ||
    isNaN(floor) ||
    isNaN(capacity) ||
    isNaN(building_id) ||
    isNaN(room_type_id)
  );
};

router.get("/rooms", (req, res) => {
  db.query(roomSelectSql, (err, result) => {
    if (err) {
      console.error("ROOMS ERROR:", err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

router.get("/rooms/available", (req, res) => {
  const { building_id, room_type_id, room_id, date, start_time, end_time } =
    req.query;

  if (!date || !start_time || !end_time) {
    return res.status(400).json({
      message: "กรุณาเลือกวันที่ เวลาเริ่มต้น และเวลาสิ้นสุด",
    });
  }

  if (start_time >= end_time) {
    return res.status(400).json({
      message: "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด",
    });
  }

  const filters = [];
  const params = [];

  if (building_id) {
    filters.push("r.building_id = ?");
    params.push(building_id);
  }

  if (room_type_id) {
    filters.push("r.room_type_id = ?");
    params.push(room_type_id);
  }

  if (room_id) {
    filters.push("r.room_id = ?");
    params.push(room_id);
  }

  const filterSql = filters.length > 0 ? `AND ${filters.join(" AND ")}` : "";
  const sql = `
    ${roomSelectSql}
    WHERE r.status NOT IN (?, 'inactive')
      ${filterSql}
      AND NOT EXISTS (
        SELECT 1
        FROM schedules s
        WHERE s.room_id = r.room_id
          AND s.date = ?
          AND s.start_time < ?
          AND s.end_time > ?
      )
      AND NOT EXISTS (
        SELECT 1
        FROM reservations rv
        WHERE rv.room_id = r.room_id
          AND rv.start_date <= ?
          AND rv.end_date >= ?
          AND rv.start_time < ?
          AND rv.end_time > ?
          AND rv.status NOT IN ('rejected', 'cancelled', 'canceled', 'ไม่อนุมัติ', 'ยกเลิก')
      )
    ORDER BY b.building_name ASC, r.room_name ASC
  `;

  db.query(
    sql,
    [
      INACTIVE_STATUS,
      ...params,
      date,
      end_time,
      start_time,
      date,
      date,
      end_time,
      start_time,
    ],
    (err, rows) => {
      if (err) {
        console.error("AVAILABLE ROOMS ERROR:", err);
        return res.status(500).json({
          message: "เกิดข้อผิดพลาดในการค้นหาห้องว่าง",
        });
      }

      res.json(rows);
    }
  );
});

router.post("/rooms", (req, res) => {
  const {
    room_name,
    floor,
    capacity,
    building_id,
    room_type_id,
    equipment = "",
  } = req.body;

  if (
    isInvalidRoomPayload({
      room_name,
      floor,
      capacity,
      building_id,
      room_type_id,
    })
  ) {
    return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
  }

  const sql = `
    INSERT INTO rooms
      (room_name, floor, capacity, building_id, room_type_id, equipment, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      room_name,
      floor,
      capacity,
      building_id,
      room_type_id,
      equipment,
      ACTIVE_STATUS,
    ],
    (err, result) => {
      if (err) {
        console.error("INSERT ERROR:", err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }

      res.status(201).json({
        message: "Room created successfully",
        insertId: result.insertId,
      });
    }
  );
});

router.get("/buildings", (req, res) => {
  db.query("SELECT * FROM buildings", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.get("/room-types", (req, res) => {
  db.query("SELECT * FROM room_types", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.get("/rooms/by-building/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT room_id, room_name, equipment FROM rooms WHERE building_id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error("ROOM ERROR:", err);
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

router.put("/rooms/:id", (req, res) => {
  const { id } = req.params;
  const {
    room_name,
    floor,
    capacity,
    building_id,
    room_type_id,
    equipment = "",
  } = req.body;

  if (
    isInvalidRoomPayload({
      room_name,
      floor,
      capacity,
      building_id,
      room_type_id,
    })
  ) {
    return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
  }

  const sql = `
    UPDATE rooms
    SET room_name = ?,
        floor = ?,
        capacity = ?,
        building_id = ?,
        room_type_id = ?,
        equipment = ?
    WHERE room_id = ?
  `;

  db.query(
    sql,
    [room_name, floor, capacity, building_id, room_type_id, equipment, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Room updated successfully" });
    }
  );
});

router.put("/rooms/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE rooms SET status = ? WHERE room_id = ?",
    [status, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Room status updated successfully" });
    }
  );
});

module.exports = router;
