exports.agencyOnly = (req, res, next) => {
    if (req.user.role !== 'agency') {
        return res.status(403).json({ message: 'Access denied: Agencies only' });
    }
    next();
}