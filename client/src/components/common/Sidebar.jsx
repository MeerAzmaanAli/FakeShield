import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout, isAgency } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">Fake<span>Shield</span></div>
        <div className="logo-sub">Social Account Verification</div>
      </div>

      <nav className="nav">
        {isAgency ? (
          <>
            <div className="nav-section">Monitor</div>
            <NavLink to="/agency/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">⊞</span> Dashboard
            </NavLink>

            <div className="nav-section">Investigation</div>
            <NavLink to="/agency/analyze" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">🔍</span> Analyze Profile
            </NavLink>

            <div className="nav-section">Cases</div>
            <NavLink to="/agency/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">📋</span> All Reports
            </NavLink>

            <div className="nav-section">Intelligence</div>
            <NavLink to="/agency/audit" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">⛓</span> Blockchain Audit
            </NavLink>
          </>
        ) : (
          <>
            <div className="nav-section">Monitor</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">⊞</span> Dashboard
            </NavLink>

            <div className="nav-section">Actions</div>
            <NavLink to="/analyze" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">🔍</span> Analyze Profile
            </NavLink>
            <NavLink to="/my-reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">📋</span> My Reports
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">{getInitials(user?.name)}</div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role">{user?.role || 'user'}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          ⏻
        </button>
      </div>
    </aside>
  );
}
