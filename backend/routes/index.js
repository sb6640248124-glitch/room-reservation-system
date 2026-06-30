const express = require("express");
const router = express.Router();
const db = require("../db");

/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT user_id, full_name, email, role
    FROM users
    WHERE email = ? AND password = ?
  `;

  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    res.json({
      success: true,
      user: results[0],
    });
  });
});

module.exports = router;
