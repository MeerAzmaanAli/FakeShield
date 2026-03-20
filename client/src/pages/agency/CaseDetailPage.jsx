import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

export default function CaseDetailPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/${id}`);
      // Backend returns { success: true, data: report }
      const reportData = response.data?.data || response.data;
      setReport(reportData);
      setSelectedStatus(reportData?.status || '');
    } catch (err) {
      setError('Failed to load report details');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === report.status) return;

    try {
      setUpdating(true);
      setError('');
      const response = await api.put(`/reports/${id}/status`, {
        status: selectedStatus,
        assignedOfficer: user._id
      });
      // Backend returns { success: true, data: updatedReport }
      const updatedReport = response.data?.data || response.data;
      setReport(updatedReport);
      setSuccess('Status updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getPlatformIcon = (platform) => {
    const icons = { facebook: '𝑓', instagram: '📷', twitter: '𝕏', other: '🌐' };
    return icons[platform] || '🌐';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-new', text: 'Pending' },
      under_review: { class: 'badge-review', text: 'Under Review' },
      escalated: { class: 'badge-escalated', text: 'Escalated' },
      resolved: { class: 'badge-closed', text: 'Resolved' },
      rejected: { class: 'badge-escalated', text: 'Rejected' }
    };
    return badges[status] || { class: 'badge-new', text: status };
  };

  const getScoreColor = (score) => {
    if (score > 70) return 'score-high';
    if (score > 40) return 'score-med';
    return 'score-low';
  };

  const getVerdictClass = (verdict) => {
    if (verdict === 'fake') return 'fake';
    if (verdict === 'suspicious') return 'suspicious';
    return 'safe';
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Layout title="Case Details">
        <div className="loading">Loading case details...</div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title="Case Details">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <div className="empty-text">Report not found</div>
          <button className="btn btn-primary" onClick={() => navigate('/agency/reports')}>
            Back to Reports
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Case #${report._id.slice(-8).toUpperCase()}`}
      subtitle="Detailed investigation and analysis"
      actions={
        <div className={`status-badge ${getStatusBadge(report.status).class}`}>
          {getStatusBadge(report.status).text}
        </div>
      }
    >
      {error && (
        <div className="alert-banner">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
        </div>
      )}

      {success && (
        <div className="alert-banner success">
          <div className="alert-icon">✅</div>
          <div className="alert-text">{success}</div>
        </div>
      )}

      {report.blockchainTxHash && (
        <div className="alert-banner info">
          <div className="alert-icon">⛓</div>
          <div className="alert-text">
            <strong>Blockchain Verified:</strong> {truncateHash(report.blockchainTxHash)}
            <button className="btn btn-ghost" style={{ marginLeft: '10px', padding: '2px 8px' }} onClick={() => copyToClipboard(report.blockchainTxHash)}>
              📋 Copy
            </button>
          </div>
        </div>
      )}

      <div className="two-col">
        {/* Left Column - Case Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Reporter Information */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">👤 Reporter Information</div>
            </div>
            <div className="panel-body padded">
              <div className="score-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Name</span>
                    <span className="breakdown-val">{report.submittedBy?.name || 'Anonymous'}</span>
                  </div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Email</span>
                    <span className="breakdown-val">{report.submittedBy?.email || 'N/A'}</span>
                  </div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Submitted</span>
                    <span className="breakdown-val">{formatDate(report.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">🔍 Profile Under Investigation</div>
            </div>
            <div className="panel-body padded">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className={`platform-icon ${report.platform === 'facebook' ? 'fb' : report.platform === 'instagram' ? 'ig' : 'tw'}`}>
                  {getPlatformIcon(report.platform)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{report.platform}</div>
                  <a href={report.profileURL} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
                    {report.profileURL}
                  </a>
                </div>
              </div>
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="kpi-card blue" style={{ padding: '12px' }}>
                  <div className="kpi-label">Followers</div>
                  <div className="kpi-value" style={{ fontSize: '24px' }}>{report.profileData?.followerCount || 0}</div>
                </div>
                <div className="kpi-card blue" style={{ padding: '12px' }}>
                  <div className="kpi-label">Following</div>
                  <div className="kpi-value" style={{ fontSize: '24px' }}>{report.profileData?.followingCount || 0}</div>
                </div>
                <div className="kpi-card blue" style={{ padding: '12px' }}>
                  <div className="kpi-label">Posts</div>
                  <div className="kpi-value" style={{ fontSize: '24px' }}>{report.profileData?.postCount || 0}</div>
                </div>
                <div className="kpi-card blue" style={{ padding: '12px' }}>
                  <div className="kpi-label">Account Age</div>
                  <div className="kpi-value" style={{ fontSize: '24px' }}>{report.profileData?.accountAgeDays || 0}d</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - AI Analysis & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* AI Analysis Results */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">🧠 AI Analysis Results</div>
            </div>
            <div className="gauge-container">
              <div className="gauge-wrap">
                <svg className="gauge-svg" viewBox="0 0 180 110">
                  <path d="M 20 100 A 70 70 0 0 1 160 100" stroke="#1a2a3a" strokeWidth="12" fill="none" strokeLinecap="round"/>
                  <path
                    d="M 20 100 A 70 70 0 0 1 160 100"
                    stroke={report.aiScore > 70 ? '#ff4d6d' : report.aiScore > 40 ? '#ffd166' : '#00ff9d'}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="220"
                    strokeDashoffset={220 - (report.aiScore / 100) * 220}
                  />
                </svg>
                <div className="gauge-number">
                  <div className={`gauge-val ${getVerdictClass(report.aiVerdict)}`}>{report.aiScore}</div>
                  <div className="gauge-label">FAKE SCORE</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className={`verdict-badge verdict-${report.aiVerdict}`}>
                  {report.aiVerdict?.toUpperCase()}
                </div>
              </div>
              <div className="score-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Profile Complete</span>
                    <span className="breakdown-val">{report.profileData?.hasProfilePic ? '100%' : '50%'}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill blue" style={{ width: report.profileData?.hasProfilePic ? '100%' : '50%' }}></div>
                  </div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Risk Score</span>
                    <span className="breakdown-val">{report.aiScore}%</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${report.aiScore > 70 ? 'red' : report.aiScore > 40 ? 'yellow' : 'green'}`} style={{ width: `${report.aiScore}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Management */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">⚙️ Case Management</div>
            </div>
            <div className="panel-body padded">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Update Status</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleStatusUpdate}
                    disabled={updating || selectedStatus === report.status}
                  >
                    {updating ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
              <div className="score-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Assigned Officer</span>
                    <span className="breakdown-val">{report.assignedOfficer?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="breakdown-name">Last Updated</span>
                    <span className="breakdown-val">{formatDate(report.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
