import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

export default function UserDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/my');
      // Backend returns { success: true, data: [...] }
      const reportsData = response.data?.data || response.data || [];
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error fetching reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const safeReports = Array.isArray(reports) ? reports : [];
  const stats = {
    total: safeReports.length,
    pending: safeReports.filter(report => report.status === 'pending').length,
    resolved: safeReports.filter(report => report.status === 'resolved').length
  };

  const recentReports = safeReports
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      pending: 'badge-new',
      under_review: 'badge-review',
      escalated: 'badge-escalated',
      resolved: 'badge-closed',
      rejected: 'badge-escalated'
    };
    return badgeClasses[status] || 'badge-new';
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '𝑓',
      instagram: '📷',
      twitter: '𝕏',
      other: '🌐'
    };
    return icons[platform] || '🌐';
  };

  const getPlatformClass = (platform) => {
    const classes = {
      facebook: 'fb',
      instagram: 'ig',
      twitter: 'tw'
    };
    return classes[platform] || '';
  };

  if (loading) {
    return (
      <Layout title={`Welcome back, ${user?.name || 'User'}`}>
        <div className="loading">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Welcome back, ${user?.name || 'User'}`}
      actions={
        <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
          🔍 Analyze Profile
        </button>
      }
    >
      {error && (
        <div className="alert-banner">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="kpi-grid three-col">
        <div className="kpi-card blue">
          <div className="kpi-label">Total Reports</div>
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-delta">All time submissions</div>
          <div className="kpi-icon">📋</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value">{stats.pending}</div>
          <div className="kpi-delta">Awaiting review</div>
          <div className="kpi-icon">⏱</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Resolved</div>
          <div className="kpi-value">{stats.resolved}</div>
          <div className="kpi-delta">Cases completed</div>
          <div className="kpi-icon">✅</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">📡 Recent Activity</div>
          <div className="panel-count">{recentReports.length} recent reports</div>
        </div>
        <div className="panel-body">
          {recentReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <div className="empty-text">No reports yet</div>
              <div className="empty-subtext">Start by analyzing your first profile</div>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/analyze')}
              >
                Analyze Profile
              </button>
            </div>
          ) : (
            recentReports.map((report, index) => (
              <div
                key={report._id}
                className="account-row"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`platform-icon ${getPlatformClass(report.platform)}`}>
                  {getPlatformIcon(report.platform)}
                </div>
                <div className="account-info">
                  <div className="account-name">{report.profileURL}</div>
                  <div className="account-meta">
                    {report.platform} • AI Score: {report.aiScore} • {formatDate(report.createdAt)}
                  </div>
                </div>
                <div className={`score-pill ${
                  report.aiScore > 70 ? 'score-high' :
                  report.aiScore > 40 ? 'score-med' : 'score-low'
                }`}>
                  {report.aiScore > 70 ? '⚠' : report.aiScore > 40 ? '~' : '✓'} {report.aiScore}
                </div>
                <div className={`case-badge ${getStatusBadge(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">🚀 Quick Actions</div>
        </div>
        <div className="panel-body">
          <div className="action-grid">
            <button className="action-item" onClick={() => navigate('/analyze')}>
              <div className="action-icon">🔍</div>
              <div className="action-title">Analyze Profile</div>
              <div className="action-desc">Check a social media account for authenticity</div>
            </button>
            <button className="action-item" onClick={() => navigate('/my-reports')}>
              <div className="action-icon">📊</div>
              <div className="action-title">View All Reports</div>
              <div className="action-desc">See complete history of your submissions</div>
            </button>
            <button className="action-item" onClick={() => navigate('/analyze')}>
              <div className="action-icon">🎓</div>
              <div className="action-title">New Analysis</div>
              <div className="action-desc">Start checking another profile</div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
