const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const app = express();
const participantRoutes = require("./routes/participantRoutes");
// const { protect } = require("./middleware/authMiddleware");
const tournamentRoutes = require("./routes/tournamentRoutes");
const {
  protect,
  authorize,
} = require("./middleware/authMiddleware");
const contestRoutes = require("./routes/contestRoutes");
const adminRoutes = require("./routes/adminRoutes");
app.use(cors());
app.use(express.json());

app.use("/api/tournaments/:tournamentId/contests", contestRoutes);
app.use("/api/tournaments", participantRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
// app.get(
//   "/api/admin-test",
//   protect,
//   authorize("ADMIN"),
//   (req, res) => {
//     res.json({
//       success: true,
//       message: "Admin access granted",
//       user: req.user,
//     });
//   }
// );
// app.get("/api/protected", protect, (req, res) => {
//   res.json({
//     success: true,
//     message: "You can access this protected route",
//     user: req.user,
//   });
// });

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Code Arena API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    database: "connected",
  });
});

module.exports = app;
