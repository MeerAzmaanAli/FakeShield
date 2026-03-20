## Development TODO List

---

### PHASE 1 — Project Setup

---

**Task 1.1 — Initialize Backend**
- Instructions:
  - Run `mkdir fake-account-detection && cd fake-account-detection`
  - Run `mkdir server && cd server && npm init -y`
  - Install dependencies: `npm install express mongoose dotenv bcryptjs jsonwebtoken cors axios`
  - Install dev dependencies: `npm install -D nodemon`
  - In `package.json` add script: `"dev": "nodemon server.js"`
  - Create folder structure: `mkdir config controllers middleware models routes services utils`
  - Create `server.js` in root of `/server`

---

**Task 1.2 — Initialize Frontend**
- Instructions:
  - From root run: `npm create vite@latest client -- --template react`
  - `cd client && npm install`
  - Install dependencies: `npm install axios react-router-dom react-hook-form recharts lucide-react`
  - Delete boilerplate: clear `App.jsx`, delete `App.css` contents
  - Create folder structure inside `/src`: `mkdir components pages context hooks services utils`
  - Inside `components` create: `mkdir common user agency`
  - Inside `pages` create: `mkdir user agency`

---

**Task 1.3 — Initialize AI Service**
- Instructions:
  - From root: `mkdir ai-service && cd ai-service`
  - Create virtual environment: `python -m venv venv`
  - Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
  - Install: `pip install flask scikit-learn pandas numpy joblib flask-cors`
  - Create files: `touch app.py predictor.py feature_extractor.py requirements.txt`
  - Create folders: `mkdir model data`
  - Run `pip freeze > requirements.txt`

---

**Task 1.4 — Initialize Blockchain**
- Instructions:
  - From root: `mkdir blockchain && cd blockchain && npm init -y`
  - Install: `npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox`
  - Run: `npx hardhat init` → select "Create a JavaScript project"
  - Delete sample files in `/contracts` and `/test`
  - Create: `contracts/FakeAccountRegistry.sol`
  - Create: `scripts/deploy.js`
  - In `hardhat.config.js` keep only localhost network for now

---

**Task 1.5 — Setup Environment Files**
- Instructions:
  - In `/server` create `.env`:
    ```
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/fakeaccountdb
    JWT_SECRET=your_secret_key_here
    AI_SERVICE_URL=http://localhost:5001
    CONTRACT_ADDRESS=
    PRIVATE_KEY=
    ```
  - In `/client` create `.env`:
    ```
    VITE_API_BASE_URL=http://localhost:5000/api
    VITE_CONTRACT_ADDRESS=
    ```
  - In `/ai-service` create `.env`:
    ```
    PORT=5001
    MODEL_PATH=model/fake_detector.pkl
    SCALER_PATH=model/scaler.pkl
    ```

---

### PHASE 2 — Backend: Auth System

---

**Task 2.1 — Connect MongoDB**
- Instructions:
  - In `server/config/db.js` write a function using `mongoose.connect(process.env.MONGO_URI)`
  - Export the function as `connectDB`
  - In `server.js` import and call `connectDB()` before starting the server
  - Add `app.use(express.json())` and `app.use(cors())` middleware in `server.js`
  - Test by running `npm run dev` — you should see "MongoDB Connected" in console

---

**Task 2.2 — Create User Model**
- Instructions:
  - In `server/models/User.js` create a mongoose schema with fields:
    - `name`: String, required
    - `email`: String, required, unique
    - `password`: String, required
    - `role`: String, enum `['user', 'agency']`, default `'user'`
    - `createdAt`: Date, default `Date.now`
  - Before saving, hash password using `bcryptjs` in a `pre('save')` hook
  - Add a method `matchPassword(enteredPassword)` that uses `bcrypt.compare()`
  - Export as `module.exports = mongoose.model('User', userSchema)`

---

**Task 2.3 — Create Auth Controller**
- Instructions:
  - In `server/controllers/authController.js` create 3 functions:
  - `registerUser`: check if email exists → create user → return JWT token
  - `loginUser`: find user by email → call `matchPassword()` → return JWT token
  - `getProfile`: return logged-in user's data (no password)
  - In `server/utils/generateToken.js` write a function that takes `userId` and returns `jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: '30d'})`
  - Import and use `generateToken` in register and login functions

---

**Task 2.4 — Create Auth Middleware**
- Instructions:
  - In `server/middleware/authMiddleware.js` create `protect` function:
    - Extract token from `req.headers.authorization` (Bearer token)
    - Verify using `jwt.verify(token, process.env.JWT_SECRET)`
    - Fetch user from DB using decoded id, attach to `req.user`
    - Call `next()` if valid, else return 401
  - In `server/middleware/roleMiddleware.js` create `agencyOnly` function:
    - Check `req.user.role === 'agency'`
    - Call `next()` if true, else return 403 with "Agency access only"

---

**Task 2.5 — Create Auth Routes**
- Instructions:
  - In `server/routes/authRoutes.js` create express Router
  - `POST /register` → `registerUser` (public)
  - `POST /login` → `loginUser` (public)
  - `GET /profile` → `protect` middleware → `getProfile`
  - In `server.js` mount: `app.use('/api/auth', authRoutes)`
  - Test all 3 endpoints using Postman or Thunder Client

---

### PHASE 3 — AI Service

---

**Task 3.1 — Download and Prepare Dataset**
- Instructions:
  - Download "Instagram Fake Spammer Genuine Accounts" dataset from Kaggle
  - Place `train.csv` and `test.csv` inside `ai-service/data/`
  - Open dataset and note the feature columns: `profile pic`, `nums/length username`, `fullname words`, `nums/length fullname`, `name==username`, `description length`, `external URL`, `private`, `#posts`, `#followers`, `#follows`, `fake`
  - The `fake` column is your target label (1 = fake, 0 = real)

---

**Task 3.2 — Train the ML Model**
- Instructions:
  - In `ai-service/model/train_model.py`:
    - Load dataset using `pandas.read_csv()`
    - Separate features `X` (all columns except `fake`) and target `y` (`fake` column)
    - Split into train/test using `train_test_split(test_size=0.2)`
    - Scale features using `StandardScaler()`
    - Train a `RandomForestClassifier(n_estimators=100)`
    - Print accuracy score — aim for 85%+
    - Save model using `joblib.dump(model, 'fake_detector.pkl')`
    - Save scaler using `joblib.dump(scaler, 'scaler.pkl')`
  - Run the script: `python model/train_model.py`
  - Confirm both `.pkl` files appear in `/model` folder

---

**Task 3.3 — Create Feature Extractor**
- Instructions:
  - In `ai-service/feature_extractor.py` create function `extract_features(data: dict) -> list`:
    - Accept a dictionary of raw profile inputs from the API request
    - Map each key to the exact feature order your model was trained on
    - Return a list in that exact order (e.g. `[has_profile_pic, follower_count, ...]`)
    - This order must match the column order in your training CSV exactly

---

**Task 3.4 — Create Predictor**
- Instructions:
  - In `ai-service/predictor.py`:
    - Load model: `joblib.load('model/fake_detector.pkl')`
    - Load scaler: `joblib.load('model/scaler.pkl')`
    - Create function `predict(features: list) -> dict`:
      - Scale features using loaded scaler
      - Call `model.predict_proba()` to get probability
      - Convert probability to score (0–100)
      - Return `{ "score": 78, "verdict": "fake", "confidence": 0.78 }`
      - Verdict logic: score > 70 → "fake", 40–70 → "suspicious", < 40 → "real"

---

**Task 3.5 — Create Flask API**
- Instructions:
  - In `ai-service/app.py`:
    - Initialize Flask app with `flask_cors` enabled
    - Create `POST /predict` route:
      - Parse JSON body from request
      - Pass to `extract_features()` → then to `predict()`
      - Return result as JSON
    - Create `GET /health` route that returns `{"status": "ok"}`
    - Run on port from `.env` using `app.run(port=os.getenv('PORT', 5001))`
  - Test using Postman: POST to `http://localhost:5001/predict` with sample profile JSON

---

### PHASE 4 — Backend: Reports & Analysis

---

**Task 4.1 — Create Report Model**
- Instructions:
  - In `server/models/Report.js` create mongoose schema with:
    - `submittedBy`: ObjectId, ref `'User'`, required
    - `platform`: String, enum `['instagram', 'facebook', 'twitter', 'other']`
    - `profileURL`: String, required
    - `profileData`: Object containing `{ followerCount, followingCount, postCount, accountAgeDays, hasProfilePic, bioLength, isVerified }`
    - `aiScore`: Number (0–100)
    - `aiVerdict`: String, enum `['real', 'suspicious', 'fake']`
    - `status`: String, enum `['pending', 'under_review', 'escalated', 'resolved', 'rejected']`, default `'pending'`
    - `assignedOfficer`: ObjectId, ref `'User'`, default null
    - `blockchainTxHash`: String, default null
    - `createdAt`, `updatedAt`: Date

---

**Task 4.2 — Create Analysis Controller**
- Instructions:
  - In `server/services/aiService.js`:
    - Create function `getAIPrediction(profileData)` that sends `axios.post()` to `process.env.AI_SERVICE_URL/predict`
    - Return the result or throw an error if AI service is down
  - In `server/controllers/analysisController.js`:
    - Create `analyzeProfile` function
    - Extract profile data from `req.body`
    - Call `getAIPrediction(profileData)` from aiService
    - Return the AI result directly to frontend (don't save to DB yet — saving happens when user submits a report)

---

**Task 4.3 — Create Report Controller (User Side)**
- Instructions:
  - In `server/controllers/reportController.js` create:
  - `createReport`: take `profileURL`, `platform`, `profileData`, `aiScore`, `aiVerdict` from `req.body` → save new Report with `submittedBy: req.user._id` → return saved report
  - `getMyReports`: find all reports where `submittedBy === req.user._id` → populate `submittedBy` name → return array sorted by newest first

---

**Task 4.4 — Create Agency Controller**
- Instructions:
  - In `server/controllers/agencyController.js` create:
  - `getAllReports`: fetch all reports, populate `submittedBy` and `assignedOfficer`, support query filters (`?status=pending&platform=instagram`)
  - `getReportById`: fetch single report by id with full population
  - `updateReportStatus`: find report by id → update `status` and `assignedOfficer` → if status is `'escalated'` or `'resolved'`, call `blockchainService.logReport(report)` → save `blockchainTxHash` back to report → return updated report

---

**Task 4.5 — Create All Routes**
- Instructions:
  - In `server/routes/analysisRoutes.js`:
    - `POST /predict` → `protect` → `analyzeProfile`
  - In `server/routes/reportRoutes.js`:
    - `POST /` → `protect` → `createReport`
    - `GET /my` → `protect` → `getMyReports`
    - `GET /` → `protect` + `agencyOnly` → `getAllReports`
    - `GET /:id` → `protect` + `agencyOnly` → `getReportById`
    - `PUT /:id/status` → `protect` + `agencyOnly` → `updateReportStatus`
  - Mount in `server.js`:
    - `app.use('/api/analysis', analysisRoutes)`
    - `app.use('/api/reports', reportRoutes)`

---

### PHASE 5 — Blockchain Integration

---

**Task 5.1 — Write Smart Contract**
- Instructions:
  - In `blockchain/contracts/FakeAccountRegistry.sol`:
    - Define pragma: `^0.8.0`
    - Create struct `FakeAccountReport { uint256 reportId, string profileURL, string platform, string verdict, address officerWallet, uint256 timestamp }`
    - Create mapping: `mapping(uint256 => FakeAccountReport) public reports`
    - Create `uint256 public reportCount`
    - Write function `logReport(string profileURL, string platform, string verdict)`:
      - Increment `reportCount`
      - Store new struct in mapping
      - Emit event `ReportLogged(reportId, profileURL, verdict, msg.sender, block.timestamp)`
    - Write view function `getReport(uint256 reportId)` that returns the struct

---

**Task 5.2 — Deploy Smart Contract**
- Instructions:
  - In `blockchain/scripts/deploy.js`:
    - Use hardhat ethers to get contract factory for `FakeAccountRegistry`
    - Deploy and wait for confirmation
    - `console.log("Contract deployed at:", contract.address)`
  - Start local hardhat node: `npx hardhat node`
  - In new terminal deploy: `npx hardhat run scripts/deploy.js --network localhost`
  - Copy the printed contract address into `/server/.env` as `CONTRACT_ADDRESS`
  - Copy one of the hardhat test private keys into `PRIVATE_KEY` in `/server/.env`

---

**Task 5.3 — Create Backend Blockchain Service**
- Instructions:
  - In `server/config/blockchain.js`:
    - Initialize `ethers.JsonRpcProvider` with localhost URL
    - Create wallet using `PRIVATE_KEY` from env
    - Load contract ABI (copy from `blockchain/artifacts/contracts/FakeAccountRegistry.sol/FakeAccountRegistry.json`)
    - Export contract instance
  - In `server/services/blockchainService.js`:
    - Import contract instance from config
    - Create function `logReport(report)`:
      - Call `contract.logReport(report.profileURL, report.platform, report.aiVerdict)`
      - Wait for transaction confirmation
      - Return `tx.hash`

---

**Task 5.4 — Create AuditLog Model and Route**
- Instructions:
  - In `server/models/AuditLog.js` create schema:
    - `reportId`: ObjectId ref `'Report'`
    - `action`: String
    - `performedBy`: ObjectId ref `'User'`
    - `blockchainTxHash`: String
    - `timestamp`: Date, default `Date.now`
  - In `agencyController.js` inside `updateReportStatus`, after getting txHash, create a new `AuditLog` entry and save it
  - In `server/routes/agencyRoutes.js` (or reportRoutes):
    - `GET /api/audit` → `protect` + `agencyOnly` → fetch all AuditLogs populated

---

### PHASE 6 — Frontend: Auth & Routing

---

**Task 6.1 — Create Auth Context**
- Instructions:
  - In `client/src/context/AuthContext.jsx`:
    - Create context with `createContext()`
    - Store `user` and `token` in state
    - On app load, check `localStorage` for saved token → fetch profile → set user
    - Export `login(token)`, `logout()`, `user`, `isAuthenticated`, `isAgency` functions
  - Wrap `<App />` in `main.jsx` with `<AuthProvider>`

---

**Task 6.2 — Create API Service**
- Instructions:
  - In `client/src/services/api.js`:
    - Create axios instance with `baseURL: import.meta.env.VITE_API_BASE_URL`
    - Add request interceptor: before every request, read token from localStorage and attach as `Authorization: Bearer <token>` header
  - In `client/src/services/authService.js`:
    - Export `loginUser(email, password)` → calls `api.post('/auth/login')`
    - Export `registerUser(name, email, password, role)` → calls `api.post('/auth/register')`
    - Export `getProfile()` → calls `api.get('/auth/profile')`

---

**Task 6.3 — Create Protected Routes & Navigation**
- Instructions:
  - In `client/src/components/common/ProtectedRoute.jsx`:
    - Read `isAuthenticated` from AuthContext
    - If not authenticated → redirect to `/login` using `<Navigate>`
    - Accept a `role` prop → if role is `'agency'` and user is not agency → redirect to `/dashboard`
  - In `client/src/App.jsx`:
    - Set up `react-router-dom` with `<BrowserRouter>` and `<Routes>`
    - Public routes: `/`, `/login`, `/register`
    - User routes (wrapped in `<ProtectedRoute>`): `/dashboard`, `/analyze`, `/my-reports`
    - Agency routes (wrapped in `<ProtectedRoute role="agency">`): `/agency/dashboard`, `/agency/reports`, `/agency/reports/:id`, `/agency/audit`

---

**Task 6.4 — Build Login and Register Pages**
- Instructions:
  - In `client/src/pages/Login.jsx`:
    - Form with email + password fields using `react-hook-form`
    - On submit → call `loginUser()` from authService → save token to localStorage → call `login()` from AuthContext → redirect based on role: agency → `/agency/dashboard`, user → `/dashboard`
  - In `client/src/pages/Register.jsx`:
    - Form with name, email, password, and role selector (dropdown: User / Agency Officer)
    - On submit → call `registerUser()` → auto-login → redirect

---

### PHASE 7 — Frontend: User Dashboard

---

**Task 7.1 — Build User Dashboard Page**
- Instructions:
  - In `client/src/pages/user/UserDashboard.jsx`:
    - On mount, call `GET /api/reports/my` and store in state
    - Show 3 stat cards: Total Reports, Pending, Resolved
    - Show a small recent activity list (last 5 reports with status badge)
    - Add a prominent "Analyze New Profile" button that navigates to `/analyze`

---

**Task 7.2 — Build Profile Analyzer Page**
- Instructions:
  - In `client/src/pages/user/AnalyzePage.jsx`:
    - Build a 2-step flow:
    - **Step 1 (Input Form)**: fields for `Platform` (dropdown), `Profile URL`, `Follower Count`, `Following Count`, `Post Count`, `Account Age (days)`, `Has Profile Picture` (checkbox), `Bio Length`, `Is Verified` (checkbox)
    - On submit → call `POST /api/analysis/predict` with form data → go to Step 2
    - **Step 2 (Result)**: show `ResultCard` component with the AI verdict
    - Show a "Submit Formal Report" button that pre-fills a `ReportForm`

---

**Task 7.3 — Build Result Card Component**
- Instructions:
  - In `client/src/components/user/ResultCard.jsx`:
    - Accept props: `score`, `verdict`, `confidence`
    - Show a large circular score gauge (use recharts `RadialBarChart`)
    - Color code: red for fake (>70), orange for suspicious (40–70), green for real (<40)
    - Show verdict label as a big badge
    - Show a short explanation text based on verdict

---

**Task 7.4 — Build Report Form and History Page**
- Instructions:
  - In `client/src/components/user/ReportForm.jsx`:
    - Pre-filled form showing profile URL, platform, AI score (read-only)
    - User adds optional `description` text
    - On submit → call `POST /api/reports` → show success message
  - In `client/src/pages/user/ReportHistoryPage.jsx`:
    - Fetch `GET /api/reports/my` on mount
    - Render a table/list with columns: Platform, Profile URL, AI Score, Status, Date
    - Status shown as colored badge (pending=yellow, resolved=green, rejected=red)

---

### PHASE 8 — Frontend: Agency Dashboard

---

**Task 8.1 — Build Agency Dashboard Page**
- Instructions:
  - In `client/src/pages/agency/AgencyDashboard.jsx`:
    - Fetch all reports on mount
    - Show 4 stat cards: Total, Pending, Under Review, Resolved
    - Show a `BarChart` (recharts) of reports by platform
    - Show a `PieChart` of report statuses
    - Show a table of the 5 most recent pending reports with a "Review" button

---

**Task 8.2 — Build All Reports Page**
- Instructions:
  - In `client/src/pages/agency/AllReportsPage.jsx`:
    - Fetch `GET /api/reports` with optional query params
    - Add filter bar at top: filter by `status`, `platform`, date range
    - Render a full table using columns: Reported By, Platform, Profile URL, AI Score, AI Verdict, Status, Date, Actions
    - Each row has a "View Details" button → navigate to `/agency/reports/:id`

---

**Task 8.3 — Build Case Detail Page**
- Instructions:
  - In `client/src/pages/agency/CaseDetailPage.jsx`:
    - Fetch `GET /api/reports/:id` on mount using URL param
    - Show full profile data submitted by user
    - Show AI score + verdict from the ResultCard component (reuse it)
    - Show a status dropdown + "Update Status" button → calls `PUT /api/reports/:id/status`
    - After updating to `escalated` or `resolved`, show the blockchain tx hash
    - If `blockchainTxHash` exists, show a link to view it on local hardhat explorer

---

**Task 8.4 — Build Blockchain Audit Page**
- Instructions:
  - In `client/src/pages/agency/BlockchainAuditPage.jsx`:
    - Fetch `GET /api/audit` on mount → get all AuditLogs
    - Render a read-only table: Report ID, Action, Officer, Blockchain Tx Hash, Timestamp
    - Tx Hash should be truncated (show first 10 + last 6 chars) with a copy button
    - Add a note at top: "All records below are immutably stored on-chain and cannot be modified"
    - This page is the proof of your blockchain integration for examiners

---

### PHASE 9 — Final Integration & Testing

---

**Task 9.1 — End to End Flow Test**
- Instructions:
  - Start all 4 services: Mon
