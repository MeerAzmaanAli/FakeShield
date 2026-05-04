# FakeCheck
## Project Structure, Metadata & Functional Requirements


### System Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Dashboard │     │ Agency Dashboard │     │   AI Service    │
│   (React)        │     │ (React)          │     │   (Python/Flask)│
└────────┬─────────┘     └────────┬─────────┘     └────────┬────────┘
         │                        │                        │
         └──────────┬─────────────┘                        │
                    │                                      │
         ┌──────────▼─────────────┐                        │
         │   Express.js Backend   │◄───────────────────────┘
         │   (Node.js REST API)   │
         └──────────┬─────────────┘
                    │
         ┌──────────▼─────────────┐
         │      MongoDB           │
         └──────────┬─────────────┘
                    │
         ┌──────────▼─────────────┐
         │  Blockchain Layer      │
         │  (Ethereum/Hardhat)    │
         └────────────────────────┘
```

---

### Complete Project Structure

```
fake-account-detection/
│
├── client/                          # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Loader.jsx
│   │   │   │   ├── FakeScoreBadge.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── user/
│   │   │   │   ├── ProfileAnalyzer.jsx
│   │   │   │   ├── ResultCard.jsx
│   │   │   │   ├── ReportForm.jsx
│   │   │   │   └── MyReports.jsx
│   │   │   └── agency/
│   │   │       ├── ReportTable.jsx
│   │   │       ├── CaseDetail.jsx
│   │   │       ├── StatusUpdater.jsx
│   │   │       └── BlockchainLog.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── user/
│   │   │   │   ├── UserDashboard.jsx
│   │   │   │   ├── AnalyzePage.jsx
│   │   │   │   └── ReportHistoryPage.jsx
│   │   │   └── agency/
│   │   │       ├── AgencyDashboard.jsx
│   │   │       ├── AllReportsPage.jsx
│   │   │       ├── CaseDetailPage.jsx
│   │   │       └── BlockchainAuditPage.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ReportContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useBlockchain.js
│   │   ├── services/
│   │   │   ├── api.js                # Axios base config
│   │   │   ├── authService.js
│   │   │   ├── reportService.js
│   │   │   └── blockchainService.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
├── server/                          # Node.js + Express Backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── blockchain.js            # Web3/ethers.js config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── reportController.js
│   │   ├── analysisController.js
│   │   └── agencyController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verify
│   │   ├── roleMiddleware.js        # user vs agency
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Report.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── analysisRoutes.js
│   │   └── agencyRoutes.js
│   ├── services/
│   │   ├── aiService.js             # Calls Python AI API
│   │   └── blockchainService.js     # Writes to smart contract
│   ├── utils/
│   │   └── generateToken.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── ai-service/                      # Python Flask AI Microservice
│   ├── model/
│   │   ├── train_model.py           # Training script
│   │   ├── fake_detector.pkl        # Saved trained model
│   │   └── scaler.pkl               # Feature scaler
│   ├── data/
│   │   └── dataset.csv              # Kaggle dataset
│   ├── app.py                       # Flask API entry point
│   ├── predictor.py                 # Prediction logic
│   ├── feature_extractor.py         # Feature engineering
│   ├── requirements.txt
│   └── .env
│
└── blockchain/                      # Smart Contract (Hardhat)
    ├── contracts/
    │   └── FakeAccountRegistry.sol  # Main smart contract
    ├── scripts/
    │   ├── deploy.js
    │   └── interact.js
    ├── test/
    │   └── registry.test.js
    ├── hardhat.config.js
    └── package.json
```

---

### File Metadata

#### Frontend Files

| File | Purpose | Key Dependencies |
|---|---|---|
| `UserDashboard.jsx` | Main landing after user login, shows stats + quick analyze | React, Chart.js |
| `AnalyzePage.jsx` | Form to input profile data → calls AI → shows result | Axios, FakeScoreBadge |
| `ProfileAnalyzer.jsx` | Reusable component, renders input fields for profile features | React Hook Form |
| `ResultCard.jsx` | Shows AI result: score, verdict, feature breakdown | recharts |
| `ReportForm.jsx` | After detection, user fills this to officially report | Axios |
| `AgencyDashboard.jsx` | Agency overview: pending, resolved, escalated reports | Chart.js |
| `AllReportsPage.jsx` | Table of all submitted reports with filters/search | React Table |
| `CaseDetailPage.jsx` | Deep view of one report + status update + blockchain log | ethers.js |
| `BlockchainAuditPage.jsx` | Read-only view of all blockchain-logged actions | ethers.js |
| `blockchainService.js` | Frontend interface to read from smart contract | ethers.js |
| `api.js` | Axios instance with base URL + auth token interceptor | Axios |

#### Backend Files

| File | Purpose | Key Dependencies |
|---|---|---|
| `server.js` | Express app init, middleware, route mounting | express, cors, dotenv |
| `authController.js` | Register, login, get profile | bcryptjs, jsonwebtoken |
| `reportController.js` | Create, get, update reports | mongoose |
| `analysisController.js` | Receives profile data → forwards to Python → returns result | axios |
| `agencyController.js` | Agency-only: update status, escalate, close cases | mongoose |
| `authMiddleware.js` | Verifies JWT token on protected routes | jsonwebtoken |
| `roleMiddleware.js` | Checks if user role is `agency` for agency routes | — |
| `User.js` | Mongoose schema: name, email, password, role | mongoose |
| `Report.js` | Mongoose schema: profileData, aiScore, status, blockchain hash | mongoose |
| `blockchainService.js` | Calls smart contract to log report after agency action | ethers.js |
| `aiService.js` | HTTP call to Python Flask `/predict` endpoint | axios |

#### AI Service Files

| File | Purpose |
|---|---|
| `app.py` | Flask server, exposes `/predict` POST endpoint |
| `feature_extractor.py` | Converts raw profile input into ML features |
| `predictor.py` | Loads model, runs prediction, returns score + label |
| `train_model.py` | One-time script to train Random Forest on dataset |
| `fake_detector.pkl` | Saved trained model (sklearn) |

#### Blockchain Files

| File | Purpose |
|---|---|
| `FakeAccountRegistry.sol` | Stores: reportId, profileURL, verdict, timestamp, agencyOfficerId |
| `deploy.js` | Deploys contract to local Hardhat / testnet |
| `hardhat.config.js` | Network config (localhost or Sepolia testnet) |

---

### MongoDB Schemas

**User**
```
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: enum['user', 'agency'],  ← THIS controls which dashboard
  createdAt: Date
}
```

**Report**
```
{
  submittedBy: ObjectId → User,
  platform: enum['instagram', 'facebook', 'twitter', 'other'],
  profileURL: String,
  profileData: {
    followerCount: Number,
    followingCount: Number,
    postCount: Number,
    accountAgeDays: Number,
    hasProfilePic: Boolean,
    bioLength: Number,
    isVerified: Boolean
  },
  aiScore: Number,              ← 0 to 100 (fake probability)
  aiVerdict: enum['real','suspicious','fake'],
  status: enum['pending', 'under_review', 'escalated', 'resolved', 'rejected'],
  assignedOfficer: ObjectId → User,
  blockchainTxHash: String,     ← filled after agency action
  createdAt: Date,
  updatedAt: Date
}
```

**AuditLog**
```
{
  reportId: ObjectId → Report,
  action: String,
  performedBy: ObjectId → User,
  blockchainTxHash: String,
  timestamp: Date
}
```

---

### Smart Contract — What Gets Logged

```solidity
// FakeAccountRegistry.sol (simplified)

struct FakeAccountReport {
    uint256 reportId;
    string profileURL;
    string platform;
    string verdict;        // "fake", "suspicious"
    address officerWallet; // agency officer who actioned it
    uint256 timestamp;
}

// Every agency action (escalate/resolve) triggers logReport()
// This creates an IMMUTABLE on-chain record
```

---

### Functional Requirements

#### User Dashboard — FR List

| FR ID | Requirement |
|---|---|
| FR-U01 | User can register and login with email/password |
| FR-U02 | User can input public profile data manually (URL + features) |
| FR-U03 | System calls AI and returns fake score (0–100) + verdict |
| FR-U04 | User can submit a formal report for a flagged profile |
| FR-U05 | User can view history of all their submitted reports |
| FR-U06 | User can see current status of each report (pending/resolved etc.) |
| FR-U07 | User cannot access agency routes or data |

#### Agency Dashboard — FR List

| FR ID | Requirement |
|---|---|
| FR-A01 | Agency officer logs in with agency-role credentials |
| FR-A02 | Officer sees all submitted reports with filters (platform, status, date) |
| FR-A03 | Officer can open a report and view full profile data + AI result |
| FR-A04 | Officer can update status: pending → under review → escalated → resolved |
| FR-A05 | On escalation or resolution, system **auto-logs the action to blockchain** |
| FR-A06 | Officer can view the blockchain transaction hash for any actioned report |
| FR-A07 | Blockchain Audit Page shows all on-chain logs (read-only, tamper-proof) |
| FR-A08 | Officer cannot modify blockchain entries — only append |

#### AI Service — FR List

| FR ID | Requirement |
|---|---|
| FR-AI01 | Accept profile features via POST `/predict` |
| FR-AI02 | Return fake probability score (0.0–1.0) + label |
| FR-AI03 | Model trained on real Kaggle fake account dataset |
| FR-AI04 | Minimum model accuracy: 85% |
| FR-AI05 | Feature importance breakdown returned with result |

---

### API Endpoints (Express)

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile        (protected)

ANALYSIS
POST   /api/analysis/predict    (user) → calls Python

REPORTS
POST   /api/reports             (user) → create report
GET    /api/reports/my          (user) → own reports
GET    /api/reports             (agency) → all reports
GET    /api/reports/:id         (agency) → single report
PUT    /api/reports/:id/status  (agency) → update + trigger blockchain

AUDIT
GET    /api/audit               (agency) → all audit logs
```

---

### Suggested Kaggle Dataset

**"Instagram Fake Spammer Genuine Accounts"** — has real vs fake labeled profiles with follower/following/post counts. Perfect for training your Random Forest model.

---

Want me to now scaffold the actual code — starting with the backend models + routes, or the React dashboard UI?
