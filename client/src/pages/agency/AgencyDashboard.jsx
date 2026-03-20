import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

export default function AgencyDashboard() {
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
      const response = await api.get('/reports');
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
    underReview: safeReports.filter(report => report.status === 'under_review').length,
    resolved: safeReports.filter(report => report.status === 'resolved').length
  };

  const platformStats = safeReports.reduce((acc, report) => {
    acc[report.platform] = (acc[report.platform] || 0) + 1;
    return acc;
  }, {});

  const statusStats = safeReports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {});

  const recentPendingReports = safeReports
    .filter(report => report.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    const classes = { facebook: 'fb', instagram: 'ig', twitter: 'tw' };
    return classes[platform] || '';
  };

  const handleReviewReport = (reportId) => {
    navigate(`/agency/reports/${reportId}`);
  };

  if (loading) {
    return (
      <Layout title="Agency Dashboard">
        <div className="loading">Loading agency dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Central Agency Dashboard"
      actions={
        <>
          <button className="btn btn-ghost" onClick={() => navigate('/agency/audit')}>
            ⛓ Blockchain Audit
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/agency/reports')}>
            📋 All Reports
          </button>
        </>
      }
    >
      {error && (
        <div className="alert-banner">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
        </div>
      )}

      {stats.pending > 0 && (
        <div className="alert-banner">
          <div className="alert-icon">🚨</div>
          <div className="alert-text">
            <strong>{stats.pending} pending cases</strong> require immediate attention. Average response time target: 72h SLA.
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-label">Total Reports</div>
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-delta">All submissions</div>
          <div className="kpi-icon">📊</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value">{stats.pending}</div>
          <div className="kpi-delta">Awaiting review</div>
          <div className="kpi-icon">⏱</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Under Review</div>
          <div className="kpi-value">{stats.underReview}</div>
          <div className="kpi-delta">Active investigations</div>
          <div className="kpi-icon">🔍</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Resolved</div>
          <div className="kpi-value">{stats.resolved}</div>
          <div className="kpi-delta">Cases completed</div>
          <div className="kpi-icon">✅</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="two-col">
        {/* Platform Chart */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">📊 Reports by Platform</div>
            <div className="panel-count">Distribution</div>
          </div>
          <div className="chart-area">
            {Object.keys(platformStats).length === 0 ? (
              <div className="empty-state">
                <div className="empty-text">No data yet</div>
              </div>
            ) : (
              Object.entries(platformStats).map(([platform, count], index) => {
                const maxCount = Math.max(...Object.values(platformStats));
                const height = (count / maxCount) * 100;
                return (
                  <div key={platform} className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${height}px`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    ></div>
                    <div className="chart-count">{count}</div>
                    <div className="chart-label">{platform}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">📈 Case Status Summary</div>
            <div className="panel-count">{safeReports.length} total</div>
          </div>
          <div className="panel-body padded">
            <div className="score-breakdown">
              {Object.entries(statusStats).map(([status, count]) => {
                const percentage = safeReports.length > 0 ? ((count / safeReports.length) * 100).toFixed(0) : 0;
                const barColors = {
                  pending: 'yellow',
                  under_review: 'blue',
                  escalated: 'red',
                  resolved: 'green',
                  rejected: 'red'
                };
                return (
                  <div key={status} className="breakdown-item">
                    <div className="breakdown-label">
                      <span className="breakdown-name">{status.replace('_', ' ')}</span>
                      <span className="breakdown-val">{count} ({percentage}%)</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${barColors[status] || 'blue'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Pending Reports */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">🚨 Recent Pending Reports</div>
          <div className="panel-count">{recentPendingReports.length} requiring attention</div>
        </div>
        <div className="panel-body">
          {recentPendingReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-text">No pending reports</div>
              <div className="empty-subtext">All reports have been reviewed</div>
            </div>
          ) : (
            recentPendingReports.map((report, index) => (
              <div
                key={report._id}
                className="account-row"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleReviewReport(report._id)}
              >
                <div className={`platform-icon ${getPlatformClass(report.platform)}`}>
                  {getPlatformIcon(report.platform)}
                </div>
                <div className="account-info">
                  <div className="account-name">{report.profileURL}</div>
                  <div className="account-meta">
                    {report.submittedBy?.name || 'Anonymous'} • {formatDate(report.createdAt)}
                  </div>
                </div>
                <div className={`score-pill ${
                  report.aiScore > 70 ? 'score-high' :
                  report.aiScore > 40 ? 'score-med' : 'score-low'
                }`}>
                  {report.aiScore > 70 ? '⚠' : report.aiScore > 40 ? '~' : '✓'} {report.aiScore}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={(e) => { e.stopPropagation(); handleReviewReport(report._id); }}
                >
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
