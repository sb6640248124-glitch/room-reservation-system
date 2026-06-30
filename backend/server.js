require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

/* =========================================
   🔹 Middleware
========================================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================
   🔹 Routes
========================================= */
const buildingRoutes = require("./routes/buildings");
const loginRoutes = require("./routes/login");
const roomTypeRoutes = require("./routes/roomTypes");
const roomsRoutes = require("./routes/rooms");
const scheduleRoutes = require("./routes/schedules");
const reservationRoutes = require("./routes/reservations");
const userRoutes = require("./routes/users");

app.use("/api", buildingRoutes);
app.use("/api", loginRoutes);
app.use("/api", roomTypeRoutes);
app.use("/api", roomsRoutes);
app.use("/api", scheduleRoutes);
app.use("/api", reservationRoutes);
app.use("/api", userRoutes);

/* =========================================
   🔹 Test Route
========================================= */
app.get("/", (req, res) => {
  res.send("🚀 API Server is running...");
});

/* =========================================
   🔹 404 Handler
========================================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================================
   🔹 Global Error Handler
========================================= */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

/* =========================================
   🔹 Start Server
========================================= */
const PORT = 3002;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

