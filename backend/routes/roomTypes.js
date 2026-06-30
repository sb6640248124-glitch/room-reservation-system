const express = require("express");
const router = express.Router();
const db = require("../db");

db.query(
  "ALTER TABLE room_types ADD COLUMN room_type_status VARCHAR(50) NOT NULL DEFAULT 'ใช้งาน'",
  (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("ADD room_type_status COLUMN ERROR:", err);
    }
  }
);

router.get("/room-types", (req, res) => {
  db.query("SELECT * FROM room_types", (err, results) => {
    if (err) {
      console.error("GET room-types error:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

router.post("/room-types", (req, res) => {
  const { room_type_name } = req.body;

  if (!room_type_name) {
    return res.status(400).json({ message: "room_type_name required" });
  }

  db.query(
    "INSERT INTO room_types (room_type_name, room_type_status) VALUES (?, 'ใช้งาน')",
    [room_type_name],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "created", id: result.insertId });
    }
  );
});

router.put("/room-types/:id", (req, res) => {
  const { id } = req.params;
  const { room_type_name, room_type_status } = req.body;
  const updates = [];
  const params = [];

  if (room_type_name !== undefined) {
    updates.push("room_type_name = ?");
    params.push(room_type_name);
  }

  if (room_type_status !== undefined) {
    updates.push("room_type_status = ?");
    params.push(room_type_status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "ไม่มีข้อมูลสำหรับอัปเดต" });
  }

  params.push(id);

  db.query(
    `UPDATE room_types SET ${updates.join(", ")} WHERE room_type_id = ?`,
    params,
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "updated" });
    }
  );
});

module.exports = router;
