import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

export default function ReportHistoryPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/my');
      // Backend returns { success: true, data: [...] }
      const reportsData = response.data?.data || response.data || [];
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (err) {
      setError('Failed to load your reports');
      console.error('Error fetching reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const safeReports = Array.isArray(reports) ? reports : [];

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
    const classes = { facebook: 'fb', instagram: 'ig', twitter: 'tw' };
    return classes[platform] || '';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-pending', text: 'Pending' },
      under_review: { class: 'badge-review', text: 'Under Review' },
      escalated: { class: 'badge-escalated', text: 'Escalated' },
      resolved: { class: 'badge-resolved', text: 'Resolved' },
      rejected: { class: 'badge-rejected', text: 'Rejected' }
    };
    return badges[status] || { class: 'badge-pending', text: status };
  };

  const getScoreColor = (score) => {
    if (score > 70) return 'score-high';
    if (score > 40) return 'score-med';
    return 'score-low';
  };

  if (loading) {
    return (
      <Layout title="My Reports">
        <div className="loading">Loading your reports...</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="My Reports"
      subtitle={`${safeReports.length} report${safeReports.length !== 1 ? 's' : ''} submitted`}
      actions={
        <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
          📝 New Report
        </button>
      }
    >
      {error && (
        <div className="alert-banner">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
        </div>
      )}

      {/* Summary Stats */}
      {safeReports.length > 0 && (
        <div className="kpi-grid">
          <div className="kpi-card yellow">
            <div className="kpi-label">Pending</div>
            <div className="kpi-value">{safeReports.filter(r => r.status === 'pending').length}</div>
            <div className="kpi-delta">Awaiting review</div>
            <div className="kpi-icon">⏱</div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-label">Under Review</div>
            <div className="kpi-value">{safeReports.filter(r => r.status === 'under_review').length}</div>
            <div className="kpi-delta">Being investigated</div>
            <div className="kpi-icon">🔍</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-label">Resolved</div>
            <div className="kpi-value">{safeReports.filter(r => r.status === 'resolved').length}</div>
            <div className="kpi-delta">Cases completed</div>
            <div className="kpi-icon">✅</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-label">Avg Score</div>
            <div className="kpi-value">
              {safeReports.length > 0 ? Math.round(safeReports.reduce((sum, r) => sum + r.aiScore, 0) / safeReports.length) : 0}
            </div>
            <div className="kpi-delta">Fake probability</div>
            <div className="kpi-icon">📊</div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">📋 Report History</div>
          <div className="panel-count">{safeReports.length} total</div>
        </div>
        <div className="panel-body">
          {safeReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <div className="empty-text">No reports submitted yet</div>
              <div className="empty-subtext">Start by analyzing your first profile</div>
              <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
                Analyze Profile
              </button>
            </div>
          ) : (
            safeReports
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((report, index) => (
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
                      {report.platform} • {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`score-pill ${getScoreColor(report.aiScore)}`}>
                    {report.aiScore > 70 ? '⚠' : report.aiScore > 40 ? '~' : '✓'} {report.aiScore}
                  </div>
                  <div className={`case-badge ${getStatusBadge(report.status).class}`}>
                    {getStatusBadge(report.status).text}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </Layout>
  );
}
