const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/ReservationTable", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM reservations"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;