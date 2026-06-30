require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "zephyr.proxy.rlwy.net",
  port: 30859,
  user: "root",
  password: "oclItItgmrfWDTDyZrkWCyhyqnbFkVcs",
  database: "room_reservation_db"
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connect error:", err);
    return;
  }
  console.log("✅ MySQL Connected");
});

module.exports = db;