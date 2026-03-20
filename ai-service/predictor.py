"""
Multi-platform predictor for fake account detection.
Loads and uses platform-specific models for prediction.
"""

import joblib
import numpy as np
import os

# Model directory
MODEL_DIR = './model'

# Load models and scalers for each platform
models = {}
scalers = {}

def load_model(platform: str):
    """Load model and scaler for a specific platform."""
    if platform in models:
        return  # Already loaded

    if platform == 'instagram':
        model_file = os.path.join(MODEL_DIR, 'fake_detector.pkl')
        scaler_file = os.path.join(MODEL_DIR, 'scaler.pkl')
    elif platform == 'facebook':
        model_file = os.path.join(MODEL_DIR, 'facebook_detector.pkl')
        scaler_file = os.path.join(MODEL_DIR, 'facebook_scaler.pkl')
    elif platform == 'twitter':
        model_file = os.path.join(MODEL_DIR, 'twitter_detector.pkl')
        scaler_file = os.path.join(MODEL_DIR, 'twitter_scaler.pkl')
    else:
        # Default to Instagram for unknown platforms
        model_file = os.path.join(MODEL_DIR, 'fake_detector.pkl')
        scaler_file = os.path.join(MODEL_DIR, 'scaler.pkl')
        platform = 'instagram'

    try:
        models[platform] = joblib.load(model_file)
        scalers[platform] = joblib.load(scaler_file)
        print(f"Loaded {platform} model successfully")
    except FileNotFoundError as e:
        print(f"Warning: {platform} model not found ({e}). Falling back to Instagram model.")
        # Fall back to Instagram model
        if 'instagram' not in models:
            models['instagram'] = joblib.load(os.path.join(MODEL_DIR, 'fake_detector.pkl'))
            scalers['instagram'] = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
        models[platform] = models['instagram']
        scalers[platform] = scalers['instagram']

# Pre-load Instagram model (always available)
try:
    load_model('instagram')
except Exception as e:
    print(f"Error loading Instagram model: {e}")


def predict(features: list, platform: str = 'instagram') -> dict:
    """
    Predict if an account is fake using platform-specific model.

    Args:
        features: List of extracted features
        platform: Platform type ('instagram', 'facebook', 'twitter', 'other')

    Returns:
        Dictionary with score, verdict, and confidence
    """
    platform = platform.lower() if platform else 'instagram'

    # Load model if not already loaded
    if platform not in models:
        load_model(platform)

    # Get the appropriate model and scaler
    model = models.get(platform, models.get('instagram'))
    scaler = scalers.get(platform, scalers.get('instagram'))

    if model is None or scaler is None:
        raise ValueError(f"No model available for platform: {platform}")

    # Prepare features
    features_array = np.array(features).reshape(1, -1)

    # Handle feature dimension mismatch
    expected_features = model.n_features_in_
    actual_features = features_array.shape[1]

    if actual_features != expected_features:
        print(f"Warning: Feature count mismatch for {platform}. "
              f"Expected {expected_features}, got {actual_features}. "
              f"Falling back to Instagram model.")
        # Fall back to Instagram model
        model = models.get('instagram')
        scaler = scalers.get('instagram')
        # Re-extract features for Instagram
        from feature_extractor import extract_instagram_features
        # This is a fallback - the caller should handle this properly

    # Scale features
    scaled = scaler.transform(features_array)

    # Get prediction probability
    proba = model.predict_proba(scaled)[0]
    classes = model.classes_  # e.g. [0, 1] or [1, 0]

    # Find which index corresponds to class 1 (fake)
    fake_index = list(classes).index(1)
    probability = proba[fake_index]

    score = round(probability * 100)

    # Determine verdict based on score
    if score > 90:
        verdict = "fake"
    elif score > 85:
        verdict = "probably fake"
    elif score > 60:
        verdict = "suspicious"
    elif score > 50:
        verdict = "probably real"
    else:
        verdict = "real"

    return {
        "score": score,
        "verdict": verdict,
        "confidence": round(probability, 2),
        "platform": platform
    }


def get_available_models() -> list:
    """Return list of platforms with loaded models."""
    return list(models.keys())
