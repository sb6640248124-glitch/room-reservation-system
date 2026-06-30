const express = require("express");
const router = express.Router();
const db = require("../db");

console.log("✅ users.js loaded");

router.get("/users", (req, res) => {
  db.query(
    `
    SELECT
      user_id,
      full_name,
      email,
      role,
      phone
    FROM users
    ORDER BY user_id DESC
    `,
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้",
        });
      }

      res.json(rows);
    }
  );
});

router.post("/users", (req, res) => {
  const { full_name, email, password, phone = "", role = "user" } = req.body;
  const allowedRoles = ["user", "admin"];

  if (!full_name || !email || !password) {
    return res.status(400).json({
      message: "กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน",
    });
  }

  if (!email.endsWith("@lru.ac.th")) {
    return res.status(400).json({
      message: "ต้องใช้ Email @lru.ac.th เท่านั้น",
    });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "สิทธิ์ผู้ใช้ไม่ถูกต้อง" });
  }

  db.query("SELECT user_id FROM users WHERE email = ?", [email], (findErr, rows) => {
    if (findErr) {
      console.error(findErr);
      return res.status(500).json({ message: "ตรวจสอบอีเมลไม่สำเร็จ" });
    }

    if (rows.length > 0) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    db.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password,
        role,
        phone,
        email_verified
      )
      VALUES (?, ?, ?, ?, ?, 1)
      `,
      [full_name.trim(), email.trim(), password, role, phone.trim()],
      (insertErr, result) => {
        if (insertErr) {
          console.error(insertErr);
          return res.status(500).json({ message: "เพิ่มผู้ใช้ไม่สำเร็จ" });
        }

        return res.status(201).json({
          message: "เพิ่มผู้ใช้สำเร็จ",
          user: {
            user_id: result.insertId,
            full_name: full_name.trim(),
            email: email.trim(),
            role,
            phone: phone.trim(),
          },
        });
      }
    );
  });
});

router.get("/users/:id", (req, res) => {
  db.query(
    `
    SELECT
      user_id,
      full_name,
      email,
      password,
      role,
      phone
    FROM users
    WHERE user_id = ?
    `,
    [req.params.id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูลส่วนตัว",
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }

      res.json(rows[0]);
    }
  );
});

router.put("/users/:id/profile", (req, res) => {
  const { full_name, password, phone } = req.body;

  if (!full_name || !password || !phone) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  db.query(
    `
    UPDATE users
    SET full_name = ?,
        password = ?,
        phone = ?
    WHERE user_id = ?
    `,
    [full_name, password, phone, req.params.id],
    (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนตัว",
        });
      }

      db.query(
        `
        SELECT
          user_id,
          full_name,
          email,
          password,
          role,
          phone
        FROM users
        WHERE user_id = ?
        `,
        [req.params.id],
        (selectErr, rows) => {
          if (selectErr) {
            console.error(selectErr);
            return res.status(500).json({
              message: "เกิดข้อผิดพลาดในการโหลดข้อมูลที่บันทึกแล้ว",
            });
          }

          if (rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
          }

          res.json({
            message: "บันทึกข้อมูลส่วนตัวสำเร็จ",
            user: rows[0],
          });
        }
      );
    }
  );
});

router.put("/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ["user", "admin"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "สิทธิ์ไม่ถูกต้อง" });
  }

  db.query(
    "UPDATE users SET role = ? WHERE user_id = ?",
    [role, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "เปลี่ยนสิทธิ์ไม่สำเร็จ" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }

      res.json({ message: "เปลี่ยนสิทธิ์สำเร็จ", role });
    }
  );
});

router.put("/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "กรุณากรอกรหัสผ่านใหม่" });
  }

  db.query(
    "UPDATE users SET password = ? WHERE user_id = ?",
    [password, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "แก้ไขรหัสผ่านไม่สำเร็จ" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }

      return res.json({ message: "แก้ไขรหัสผ่านสำเร็จ" });
    }
  );
});

module.exports = router;
