const ReportSchema = require( '../models/report.js');
exports.createReport = async (req, res) => {
    const {  profileURL, platform, profileData, aiScore, aiVerdict } = req.body;
    // Here you would typically save the report to the database
    const newReport = new ReportSchema({
        submittedBy: req.user._id, // Assuming user is authenticated and user info is in req.user
        platform,
        profileURL,
        profileData,
        aiScore,
        aiVerdict
    });

    try {
        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
}

exports.getMyReports = async (req, res) => {
    try {

        const report = await ReportSchema.find({submittedBy: req.user._id})
              .populate('submittedBy', 'name email').sort({ createdAt: -1 });
        
            if (!report) {                                     // ✅ 404 check
              return res.status(404).json({ success: false, message: 'Report not found' });
            }
        
            res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
}
