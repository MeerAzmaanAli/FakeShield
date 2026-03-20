const ReportSchema = require("../models/report");
const AuditLogSchema = require('../models/AuditLog');
const { logReport } = require('../services/blockchainService');

// ── GET ALL REPORTS (agency) ───────────────────────────────────────────
exports.getAllReports = async (req, res) => {
  try {
    const { status, platform } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const reports = await ReportSchema.find(filter)
      .populate("submittedBy", "name email")
      .populate("assignedOfficer", "name email")
      .sort({ createdAt: -1 });    // ← newest first

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE REPORT (agency) ─────────────────────────────────────────
exports.getReportById = async (req, res) => {         // ✅ exported
  try {
    const report = await ReportSchema.findById(req.params.id)
      .populate('submittedBy', 'name email')           // ✅ populated
      .populate('assignedOfficer', 'name email');      // ✅ populated

    if (!report) {                                     // ✅ 404 check
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({ success: true, data: report });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE REPORT STATUS (agency) ──────────────────────────────────────
exports.updateReportStatus = async (req, res) => {    // ✅ exported
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'under_review', 'escalated', 'resolved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const report = await ReportSchema.findById(id);   // ✅ consistent name

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.assignedOfficer = req.user._id;
    report.updatedAt = Date.now();

    if (status === 'escalated' || status === 'resolved') {
      try {
        const txHash = await logReport(report);
        report.blockchainTxHash = txHash;
      } catch (blockchainError) {
        console.error('Blockchain logging failed:', blockchainError.message);
      }
    }

    const updatedReport = await report.save();

    await AuditLogSchema.create({
      reportId: report._id,
      action: `Status updated to '${status}'`,
      performedBy: req.user._id,
      blockchainTxHash: report.blockchainTxHash || null,
    });

    const populatedReport = await ReportSchema.findById(updatedReport._id)  // ✅ consistent name
      .populate('submittedBy', 'name email')
      .populate('assignedOfficer', 'name email');

    res.status(200).json({ success: true, data: populatedReport });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLogSchema.find()
      .populate('reportId', 'profileURL platform aiVerdict')  // show report details
      .populate('performedBy', 'name email')                  // show officer details
      .sort({ timestamp: -1 });                               // newest first

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};