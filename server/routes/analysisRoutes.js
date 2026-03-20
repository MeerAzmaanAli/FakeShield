const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { analyzeProfile, scrapeProfileData } = require('../controllers/analysisController')

const analysisRoutes = express.Router()

//POST /predict → protect → analyzeProfile
analysisRoutes.post('/predict',protect, analyzeProfile)
analysisRoutes.post('/scrape',   protect, scrapeProfileData);

module.exports = analysisRoutes