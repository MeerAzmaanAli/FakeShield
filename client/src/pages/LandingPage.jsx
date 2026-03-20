import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="landing-logo">Fake<span>Shield</span></div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost">Login</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="hero-badge">AI-Powered Detection System</div>
        <h1 className="hero-title">
          Detect <span>Fake</span> Social Media Accounts
        </h1>
        <p className="hero-subtitle">
          Advanced machine learning algorithms to identify fraudulent profiles,
          impersonators, and bot networks across social platforms.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Analyzing
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            Agency Login
          </Link>
        </div>
      </div>

      <div className="landing-features">
        <div className="features-title">How It Works</div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <div className="feature-title">Analyze Profiles</div>
            <div className="feature-desc">
              Submit social media profile data for instant AI-powered authenticity analysis
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <div className="feature-title">AI Verdict</div>
            <div className="feature-desc">
              Get a comprehensive fake score based on metadata, behavior patterns, and network analysis
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <div className="feature-title">Submit Reports</div>
            <div className="feature-desc">
              Create formal reports for suspicious accounts to be reviewed by authorized agencies
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏛️</div>
            <div className="feature-title">Agency Review</div>
            <div className="feature-desc">
              Trained investigators analyze reports and take appropriate action on verified fakes
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⛓</div>
            <div className="feature-title">Blockchain Verified</div>
            <div className="feature-desc">
              All escalated actions are immutably logged on blockchain for transparency and audit
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">Account Takedown</div>
            <div className="feature-desc">
              Verified fake accounts are reported to platforms for permanent suspension
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
