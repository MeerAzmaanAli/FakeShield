import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

export default function AllReportsPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

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

  const applyFilters = () => {
    let filtered = [...reports];

    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }
    if (filters.platform) {
      filtered = filtered.filter(report => report.platform === filters.platform);
    }
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(report => new Date(report.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(report => new Date(report.createdAt) <= toDate);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(report =>
        report.profileURL.toLowerCase().includes(searchLower) ||
        (report.submittedBy?.name || '').toLowerCase().includes(searchLower) ||
        (report.submittedBy?.email || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredReports(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', platform: '', dateFrom: '', dateTo: '', search: '' });
  };

  const getPlatformIcon = (platform) => {
    const icons = { facebook: '𝑓', instagram: '📷', twitter: '𝕏', other: '🌐' };
    return icons[platform] || '🌐';
  };

  const getPlatformClass = (platform) => {
    const classes = { facebook: 'fb', instagram: 'ig', twitter: 'tw' };
    return classes[platform] || '';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-new', text: 'New' },
      under_review: { class: 'badge-review', text: 'Review' },
      escalated: { class: 'badge-escalated', text: 'Escalated' },
      resolved: { class: 'badge-closed', text: 'Resolved' },
      rejected: { class: 'badge-escalated', text: 'Rejected' }
    };
    return badges[status] || { class: 'badge-new', text: status };
  };

  const handleViewDetails = (reportId) => {
    navigate(`/agency/reports/${reportId}`);
  };

  if (loading) {
    return (
      <Layout title="All Reports">
        <div className="loading">Loading all reports...</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="All Reports"
      subtitle={`Showing ${filteredReports.length} of ${reports.length} reports`}
      actions={
        <button className="btn btn-primary" onClick={fetchReports}>
          🔄 Refresh
        </button>
      }
    >
      {error && (
        <div className="alert-banner">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Search by URL, name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Platform</label>
          <select
            className="filter-select"
            value={filters.platform}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
          >
            <option value="">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">From</label>
          <input
            type="date"
            className="filter-input"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">To</label>
          <input
            type="date"
            className="filter-input"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
        <button className="btn btn-ghost clear-filters" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {/* Reports List */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">📋 All Submissions</div>
          <div className="panel-count">{filteredReports.length} reports</div>
        </div>
        <div className="panel-body">
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <div className="empty-text">No reports found</div>
              <div className="empty-subtext">
                {reports.length === 0 ? 'No reports have been submitted yet' : 'Try adjusting your filters'}
              </div>
            </div>
          ) : (
            filteredReports.map((report, index) => (
              <div
                key={report._id}
                className="account-row"
                style={{ animationDelay: `${index * 0.03}s` }}
                onClick={() => handleViewDetails(report._id)}
              >
                <div className={`platform-icon ${getPlatformClass(report.platform)}`}>
                  {getPlatformIcon(report.platform)}
                </div>
                <div className="account-info">
                  <div className="account-name">{report.profileURL}</div>
                  <div className="account-meta">
                    {report.submittedBy?.name || 'Anonymous'} • {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className={`score-pill ${
                  report.aiScore > 70 ? 'score-high' :
                  report.aiScore > 40 ? 'score-med' : 'score-low'
                }`}>
                  {report.aiScore > 70 ? '⚠' : report.aiScore > 40 ? '~' : '✓'} {report.aiScore}
                </div>
                <div className={`case-badge ${getStatusBadge(report.status).class}`}>
                  {getStatusBadge(report.status).text}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={(e) => { e.stopPropagation(); handleViewDetails(report._id); }}
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
