const axios =require('axios');
const dotenv = require( 'dotenv');
dotenv.config();

exports.getAIPrediction = (profileData)=>{
    try {
        return axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:5001'}/predict`, profileData);
    } catch (error) {
        console.error('Error fetching AI prediction:', error);
        throw error;
    }
}

