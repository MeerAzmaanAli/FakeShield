# ai-service/model/train_twitter_model.py
# Training script for Twitter fake account detection model
# Uses synthetic data based on typical Twitter fake account patterns

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib

np.random.seed(42)

def generate_twitter_dataset(n_samples=1000):
    """
    Generate synthetic Twitter dataset based on known fake account patterns.

    Twitter fake accounts typically have:
    - High following/follower ratio (following many, few followers)
    - Generic or no profile picture
    - Short or no bio
    - Account created recently
    - Low tweet count or mostly retweets
    - Unusual posting patterns
    - Default profile settings
    """

    data = []

    # Generate fake accounts (Label = 1)
    n_fake = n_samples // 2
    for _ in range(n_fake):
        data.append({
            'has_profile_pic': np.random.choice([0, 1], p=[0.4, 0.6]),  # 40% no pic
            'has_header_pic': np.random.choice([0, 1], p=[0.6, 0.4]),   # 60% no header
            'bio_length': np.random.choice([0] + list(range(1, 50)), p=[0.3] + [0.7/49]*49),
            'account_age_days': np.random.randint(1, 365),  # Usually new
            'follower_count': np.random.randint(0, 100),    # Low followers
            'following_count': np.random.randint(500, 5000), # Following many
            'tweet_count': np.random.randint(0, 50),         # Low tweets
            'retweet_ratio': np.random.uniform(0.7, 1.0),    # High retweet ratio
            'likes_count': np.random.randint(0, 20),
            'lists_count': np.random.randint(0, 2),
            'is_verified': 0,
            'is_default_profile': np.random.choice([0, 1], p=[0.3, 0.7]),
            'has_url': np.random.choice([0, 1], p=[0.7, 0.3]),
            'avg_tweets_per_day': np.random.uniform(0, 2),
            'Label': 1  # Fake
        })

    # Generate real accounts (Label = 0)
    n_real = n_samples - n_fake
    for _ in range(n_real):
        follower_count = np.random.randint(50, 10000)
        data.append({
            'has_profile_pic': np.random.choice([0, 1], p=[0.05, 0.95]),  # 95% have pic
            'has_header_pic': np.random.choice([0, 1], p=[0.2, 0.8]),     # 80% have header
            'bio_length': np.random.randint(20, 160),  # Usually have bio
            'account_age_days': np.random.randint(365, 3650),  # Older accounts
            'follower_count': follower_count,
            'following_count': np.random.randint(100, follower_count * 2),  # Reasonable ratio
            'tweet_count': np.random.randint(100, 10000),
            'retweet_ratio': np.random.uniform(0.1, 0.5),  # Lower retweet ratio
            'likes_count': np.random.randint(50, 5000),
            'lists_count': np.random.randint(0, 20),
            'is_verified': np.random.choice([0, 1], p=[0.95, 0.05]),
            'is_default_profile': np.random.choice([0, 1], p=[0.9, 0.1]),
            'has_url': np.random.choice([0, 1], p=[0.4, 0.6]),
            'avg_tweets_per_day': np.random.uniform(0.5, 20),
            'Label': 0  # Real
        })

    return pd.DataFrame(data)

# Generate dataset
print("Generating Twitter synthetic dataset...")
df = generate_twitter_dataset(1000)

# Shuffle
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print("Twitter Dataset Shape:", df.shape)
print("\nLabel distribution:")
print(df['Label'].value_counts())

# Save synthetic dataset
df.to_csv('../data/twitter_synthetic.csv', index=False)
print("\nSynthetic dataset saved to: ../data/twitter_synthetic.csv")

# Prepare features and target
y = df['Label']
X = df.drop(columns=['Label'])

print("\nFeatures used:", X.columns.tolist())

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print(f"\nTraining set size: {len(X_train)}")
print(f"Test set size: {len(X_test)}")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    min_samples_split=5,
    random_state=42
)
model.fit(X_train_scaled, y_train)

# Evaluate
predictions = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, predictions)

print(f"\n{'='*50}")
print(f"Twitter Model Results")
print(f"{'='*50}")
print(f"Accuracy: {accuracy:.4f}")
print(f"\nClassification Report:")
print(classification_report(y_test, predictions, target_names=['Real', 'Fake']))

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nFeature Importance:")
print(feature_importance.to_string(index=False))

# Save model and scaler
joblib.dump(model, 'twitter_detector.pkl')
joblib.dump(scaler, 'twitter_scaler.pkl')
joblib.dump(X.columns.tolist(), 'twitter_features.pkl')

print(f"\n{'='*50}")
print("Twitter model and scaler saved successfully!")
print("Files created:")
print("  - twitter_detector.pkl")
print("  - twitter_scaler.pkl")
print("  - twitter_features.pkl")
