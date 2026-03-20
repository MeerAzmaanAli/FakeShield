import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split    
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib

df = pd.read_csv('../data/train.csv')
y = df['fake']
X = df.drop(columns=['fake'])

print(X.columns.tolist())

X_train, X_test, y_train, y_test = train_test_split(
    X,y,
    test_size =0.2,
    random_state=42
)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

model = RandomForestClassifier(n_estimators = 100, random_state = 42)
model.fit(X_train,y_train)

predictions = model.predict(X_test)
print("Accuracy: ",accuracy_score(y_test,predictions))

joblib.dump(model, 'fake_detector.pkl')
joblib.dump(scaler,'scaler.pkl')
print('model and scaler saved.')