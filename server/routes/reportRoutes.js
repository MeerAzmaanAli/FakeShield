const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createReport, getMyReports } = require("../controllers/reportController");
const { agencyOnly } = require("../middleware/roleMiddleware");
const {
  getAllReports,
  getReportById,
  updateReportStatus,
  getAuditLogs,
} = require("../controllers/agencyController");

const reportRoutes = express.Router();

// POST / -> protect -> createReport
reportRoutes.post("/", protect, createReport);
// GET /my -> protect -> getMyReports
reportRoutes.get("/my", protect, getMyReports);
// GET /audit -> protect + agencyOnly -> getAuditLogs
reportRoutes.get("/audit", protect, agencyOnly, getAuditLogs);
// GET / -> protect + agencyOnly -> getAllReports
reportRoutes.get("/", protect, agencyOnly, getAllReports);
// GET /:id -> protect + agencyOnly -> getReportById
reportRoutes.get("/:id", protect, agencyOnly, getReportById);
// PUT /:id/status -> protect + agencyOnly -> updateReportStatus
reportRoutes.put("/:id/status", protect, agencyOnly, updateReportStatus);

module.exports = reportRoutes;
