import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

export default function BlockchainAuditPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/audit');
      // Backend returns { success: true, data: [...] }
      const logsData = response.data?.data || response.data || [];
      setAuditLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const safeLogs = Array.isArray(auditLogs) ? auditLogs : [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    if (hash.length < 16) return hash;
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
  };

  const copyToClipboard = (text, e) => {
    navigator.clipboard.writeText(text);
    const btn = e.target;
    const original = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = original; }, 1500);
  };

  const getActionIcon = (action) => {
    const icons = {
      'REPORT_CREATED': '📝',
      'STATUS_UPDATED': '🔄',
      'ESCALATED': '🚨',
      'RESOLVED': '✅',
      'TAKEDOWN_CONFIRMED': '🔒'
    };
    return icons[action] || '📋';
  };

  if (loading) {
    return (
      <Layout title="Blockchain Audit">
        <div className="loading">Loading blockchain audit trail...</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Blockchain Audit Trail"
      subtitle="Immutable record of all case actions"
      actions={
        <button className="btn btn-primary" onClick={fetchAuditLogs}>
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

      {/* Blockchain Info Banner */}
      <div className="alert-banner info">
        <div className="alert-icon">⛓</div>
        <div className="alert-text">
          <strong>Immutable Records:</strong> All records are cryptographically secured on the blockchain and cannot be modified.
        </div>
      </div>

      {/* Audit Statistics */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-label">Total Records</div>
          <div className="kpi-value">{safeLogs.length}</div>
          <div className="kpi-delta">On blockchain</div>
          <div className="kpi-icon">⛓</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Resolved</div>
          <div className="kpi-value">{safeLogs.filter(log => log.action === 'RESOLVED').length}</div>
          <div className="kpi-delta">Cases completed</div>
          <div className="kpi-icon">✅</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Escalated</div>
          <div className="kpi-value">{safeLogs.filter(log => log.action === 'ESCALATED').length}</div>
          <div className="kpi-delta">High priority</div>
          <div className="kpi-icon">🚨</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label">Officers</div>
          <div className="kpi-value">{new Set(safeLogs.map(log => log.performedBy?._id).filter(Boolean)).size}</div>
          <div className="kpi-delta">Active agents</div>
          <div className="kpi-icon">👤</div>
        </div>
      </div>

      {/* Audit Log List */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">📜 Transaction History</div>
          <div className="panel-count">{safeLogs.length} records</div>
        </div>
        <div className="panel-body">
          {safeLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">No audit records found</div>
              <div className="empty-subtext">Blockchain transactions will appear here as they occur</div>
            </div>
          ) : (
            safeLogs.map((log, index) => {
              const formattedDate = formatDate(log.timestamp || log.createdAt);
              // reportId can be populated object or string ID
              const reportIdStr = typeof log.reportId === 'object'
                ? (log.reportId?._id || '')
                : (log.reportId || '');
              return (
                <div key={log._id} className="tx-item" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="tx-dot"></div>
                  <div style={{ flex: 1 }}>
                    <div className="tx-hash">
                      {getActionIcon(log.action)} {log.action?.replace(/_/g, ' ')}
                    </div>
                    <div className="tx-desc">
                      Report #{reportIdStr.slice?.(-8)?.toUpperCase() || 'N/A'} •
                      {log.performedBy?.name || 'System'}
                    </div>
                    {log.blockchainTxHash && (
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                          {truncateHash(log.blockchainTxHash)}
                        </span>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                          onClick={(e) => copyToClipboard(log.blockchainTxHash, e)}
                        >
                          📋
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="tx-time">
                    <div>{formattedDate.date}</div>
                    <div>{formattedDate.time}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="three-col">
        <div className="panel">
          <div className="panel-body padded" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔐</div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Cryptographic Security</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              SHA-256 hash verification
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body padded" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Compliance Ready</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Full audit trail
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body padded" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌐</div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Decentralized</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No single point of failure
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
