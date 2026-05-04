# ai-service/model/train_facebook_model.py
# Training script for Facebook fake account detection model

import pandas as pd
from sklearn.ensemble import RandomForestClassifier

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Load Facebook dataset
df = pd.read_csv('../data/Facebook Spam Dataset.csv')

# Display dataset info
print("Facebook Dataset Shape:", df.shape)
print("\nColumns:", df.columns.tolist())
print("\nLabel distribution:")
print(df['Label'].value_counts())

# Features for Facebook fake detection:
# - #friends: Number of friends
# - #following: Number of accounts following
# - #community: Community involvement
# - age: Account age in days
# - #postshared: Number of posts shared
# - #urlshared: Number of URLs shared
# - #photos/videos: Number of photos/videos
# - fpurls: Fraction of posts with URLs
# - fpphotos/videos: Fraction of posts with photos/videos
# - avgcomment/post: Average comments per post
# - likes/post: Likes per post
# - tags/post: Tags per post
# - #tags/post: Number of tags per post
# - Label: 0 = real, 1 = fake

# Prepare features and target
y = df['Label']
X = df.drop(columns=['profile id', 'Label'])

# Rename columns to match our naming convention
X.columns = [
    'friends_count',
    'following_count',
    'community_count',
    'account_age',
    'posts_shared',
    'urls_shared',
    'photos_videos',
    'url_post_ratio',
    'media_post_ratio',
    'avg_comments',
    'likes_per_post',
    'tags_per_post',
    'num_tags_per_post'
]

print("\nFeatures used:", X.columns.tolist())

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y  # Ensure balanced split
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
    max_depth=10,
    min_samples_split=5,
    random_state=42
)
model.fit(X_train_scaled, y_train)

# Evaluate
predictions = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, predictions)

print(f"\n{'='*50}")
print(f"Facebook Model Results")
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
joblib.dump(model, 'facebook_detector.pkl')
joblib.dump(scaler, 'facebook_scaler.pkl')

# Also save the feature names for reference
joblib.dump(X.columns.tolist(), 'facebook_features.pkl')

print(f"\n{'='*50}")
print("Facebook model and scaler saved successfully!")
print("Files created:")
print("  - facebook_detector.pkl")
print("  - facebook_scaler.pkl")
print("  - facebook_features.pkl")
