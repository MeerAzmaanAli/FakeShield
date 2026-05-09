# ai-service/app.py
# Multi-platform fake account detection API

from flask import Flask, request, jsonify
from flask_cors import CORS
from feature_extractor import extract_features
from predictor import predict, get_available_models
import os

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def index():
    """Index endpoint."""
    return jsonify({
        "status": "AI service is running",
        "endpoints": ["/health", "/predict", "/models"]
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "available_models": get_available_models()
    })

@app.route('/predict', methods=['POST'])
def predict_route():
    """
    Predict if a social media account is fake.

    Expected JSON body:
    {
        "platform": "instagram" | "facebook" | "twitter" | "other",
        "has_profile_pic": 0 | 1,
        "follower_count": number,
        "following_count": number,
        "post_count": number,
        "bio_length": number,
        ... (platform-specific fields)
    }

    Returns:
    {
        "score": 0-100,
        "verdict": "fake" | "probably fake" | "suspicious" | "probably real" | "real",
        "confidence": 0.0-1.0,
        "platform": "platform_used"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Get platform (default to instagram)
        platform = data.get('platform', 'instagram')
        if platform:
            platform = platform.lower()

        # Extract features based on platform
        features = extract_features(data, platform)

        # Get prediction using platform-specific model
        result = predict(features, platform)

        return jsonify(result), 200

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/models', methods=['GET'])
def list_models():
    """List available models and their status."""
    return jsonify({
        "available_models": get_available_models(),
        "supported_platforms": ["instagram", "facebook", "twitter", "other"]
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"Starting AI service on port {port}")
    print(f"Available models: {get_available_models()}")
    app.run(host='0.0.0.0', port=port, debug=True)
