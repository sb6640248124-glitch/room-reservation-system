const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   📌 GET: ดึงข้อมูลอาคารทั้งหมด
========================= */
router.get("/buildings", (req, res) => {
  db.query("SELECT * FROM buildings", (err, results) => {
    if (err) {
      console.error("Error fetching buildings:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

/* =========================
   ➕ POST: เพิ่มอาคาร
========================= */
router.post("/buildings", (req, res) => {
  const { building_name } = req.body;

  if (!building_name) {
    return res.status(400).json({ message: "กรุณากรอกชื่ออาคาร" });
  }

  db.query(
    "INSERT INTO buildings (building_name, building_status) VALUES (?, 'ใช้งาน')",
    [building_name],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ message: "Insert failed" });
      }

      res.json({
        message: "เพิ่มอาคารสำเร็จ",
        insertId: result.insertId,
      });
    }
  );
});

/* =========================
   🔄 PUT: เปลี่ยนสถานะอาคาร
========================= */
router.put("/buildings/:id", (req, res) => {
  const { id } = req.params;
  const { building_name, building_status } = req.body;
  const updates = [];
  const params = [];

  if (building_name !== undefined) {
    updates.push("building_name = ?");
    params.push(building_name);
  }

  if (building_status !== undefined) {
    updates.push("building_status = ?");
    params.push(building_status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "ไม่มีข้อมูลสำหรับอัปเดต" });
  }

  params.push(id);

  db.query(
    `UPDATE buildings SET ${updates.join(", ")} WHERE building_id = ?`,
    params,
    (err, result) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ message: "Update failed" });
      }

      res.json({ message: "Update success" });
    }
  );
});

module.exports = router;
