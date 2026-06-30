const express = require("express");
const router = express.Router();
const db = require("../db");

const addColumnIfMissing = (columnSql) => {
  db.query(`ALTER TABLE schedules ADD COLUMN ${columnSql}`, (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("Schedule column update failed:", err.message);
    }
  });
};

addColumnIfMissing("repeat_type VARCHAR(50) NOT NULL DEFAULT 'none'");
addColumnIfMissing("repeat_interval INT NOT NULL DEFAULT 1");
addColumnIfMissing("repeat_days TEXT NULL");
addColumnIfMissing("repeat_end_date DATE NULL");

const normalizeRepeatDays = (repeatDays) => {
  if (Array.isArray(repeatDays)) return JSON.stringify(repeatDays.map(Number));
  if (!repeatDays) return JSON.stringify([]);

  try {
    const parsed = JSON.parse(repeatDays);
    return JSON.stringify(Array.isArray(parsed) ? parsed.map(Number) : []);
  } catch {
    return JSON.stringify(
      String(repeatDays)
        .split(",")
        .map((day) => Number(day))
        .filter((day) => !Number.isNaN(day))
    );
  }
};

// =============================
// GET ALL SCHEDULES
// =============================
router.get("/schedules", (req, res) => {
  const sql = `
    SELECT 
      s.schedule_id,
      s.subject_name,
      s.instructor,
      s.date,
      s.start_time,
      s.end_time,
      s.repeat_type,
      s.repeat_interval,
      s.repeat_days,
      s.repeat_end_date,
      r.building_id,
      s.room_id,
      r.room_name
    FROM schedules s
    LEFT JOIN rooms r ON s.room_id = r.room_id
    ORDER BY s.date ASC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// =============================
// GET BUILDINGS
// =============================
router.get("/buildings", (req, res) => {
  db.query(
    "SELECT building_id, building_name FROM buildings WHERE building_status = 'ใช้งาน'",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

// =============================
// GET ROOMS BY BUILDING
// =============================
router.get("/rooms/:buildingId", (req, res) => {
  db.query(
    "SELECT room_id, room_name FROM rooms WHERE building_id = ? AND status = 'ใช้งาน'",
    [req.params.buildingId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

// =============================
// DELETE
// =============================
router.delete("/schedules/:id", (req, res) => {
  db.query(
    "DELETE FROM schedules WHERE schedule_id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Deleted successfully" });
    }
  );
});

router.put("/schedules/:id", (req, res) => {
  const { id } = req.params;
  const {
    subject_name,
    instructor,
    date,
    start_time,
    end_time,
    room_id,
    repeat_type = "none",
    repeat_interval = 1,
    repeat_days = [],
    repeat_end_date = null,
  } = req.body;

  const sql = `
    UPDATE schedules
    SET subject_name = ?,
        instructor = ?,
        date = ?,
        start_time = ?,
        end_time = ?,
        room_id = ?,
        repeat_type = ?,
        repeat_interval = ?,
        repeat_days = ?,
        repeat_end_date = ?
    WHERE schedule_id = ?
  `;

  db.query(
    sql,
    [
      subject_name,
      instructor,
      date,
      start_time,
      end_time,
      room_id,
      repeat_type,
      Number(repeat_interval) || 1,
      normalizeRepeatDays(repeat_days),
      repeat_end_date || null,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Updated successfully" });
    }
  );
});

// =============================
// CREATE
// =============================
router.post("/schedules", (req, res) => {
  const {
    subject_name,
    instructor,
    date,
    start_time,
    end_time,
    room_id,
    repeat_type = "none",
    repeat_interval = 1,
    repeat_days = [],
    repeat_end_date = null,
  } = req.body;

  const sql = `
    INSERT INTO schedules 
    (
      subject_name,
      instructor,
      date,
      start_time,
      end_time,
      room_id,
      repeat_type,
      repeat_interval,
      repeat_days,
      repeat_end_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      subject_name,
      instructor,
      date,
      start_time,
      end_time,
      room_id,
      repeat_type,
      Number(repeat_interval) || 1,
      normalizeRepeatDays(repeat_days),
      repeat_end_date || null,
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Created successfully" });
    }
  );
});

module.exports = router;
