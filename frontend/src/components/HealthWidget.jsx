import React, { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/api';
import { 
  Server, 
  Database, 
  Activity, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Cpu
} from 'lucide-react';

const HealthWidget = () => {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    const result = await checkBackendHealth();
    setHealth(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Optional auto-refresh every 15s when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const isServerOk = health?.success;
  const dbStatus = health?.data?.database?.status || 'disconnected';
  const isDbConnected = dbStatus === 'connected';

  // Overall status evaluation
  let overallState = 'error';
  if (isServerOk && isDbConnected) {
    overallState = 'success';
  } else if (isServerOk && !isDbConnected) {
    overallState = 'warning';
  }

  return (
    <section id="health-status" className="health-section">
      <div className="container">
        <div className="glass-card health-card">
          {/* Header */}
          <div className="health-header">
            <div className="health-header-left">
              <span className={`pulse-dot ${overallState}`}></span>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Live System Health & Connectivity</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Real-time Phase 1 API and Database Diagnostics
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
                title="Toggle 15s auto-refresh"
              >
                <Radio size={14} className={autoRefresh ? 'spin' : ''} />
                {autoRefresh ? 'Auto (15s)' : 'Manual'}
              </button>
              
              <button 
                onClick={fetchHealth} 
                disabled={loading}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="health-grid">
            {/* Express Server Metric */}
            <div className="metric-box">
              <div className="metric-label">
                <Server size={14} /> Express API Server
              </div>
              <div className="metric-value">
                {loading && !health ? (
                  <span style={{ color: 'var(--text-muted)' }}>Probing...</span>
                ) : isServerOk ? (
                  <>
                    <CheckCircle2 size={18} color="var(--status-success)" />
                    <span>Operational</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} color="var(--status-error)" />
                    <span>Unreachable</span>
                  </>
                )}
              </div>
              <div className="metric-sub">
                {isServerOk 
                  ? `Environment: ${health.data?.environment || 'development'}` 
                  : 'Check backend server on port 5000'}
              </div>
            </div>

            {/* MongoDB Database Metric */}
            <div className="metric-box">
              <div className="metric-label">
                <Database size={14} /> MongoDB Connection
              </div>
              <div className="metric-value">
                {loading && !health ? (
                  <span style={{ color: 'var(--text-muted)' }}>Probing...</span>
                ) : isDbConnected ? (
                  <span className="status-badge success">
                    <CheckCircle2 size={13} /> Connected
                  </span>
                ) : dbStatus === 'connecting' ? (
                  <span className="status-badge warning">
                    <RefreshCw size={13} className="spin" /> Connecting
                  </span>
                ) : (
                  <span className="status-badge warning">
                    <AlertTriangle size={13} /> Not Configured
                  </span>
                )}
              </div>
              <div className="metric-sub">
                {isDbConnected 
                  ? `Host: ${health.data?.database?.host || 'MongoDB Atlas'}`
                  : 'Set MONGODB_URI in backend/.env'}
              </div>
            </div>

            {/* API Latency */}
            <div className="metric-box">
              <div className="metric-label">
                <Activity size={14} /> Network Latency
              </div>
              <div className="metric-value">
                {health?.latency !== undefined ? (
                  <span style={{ color: health.latency < 200 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {health.latency} ms
                  </span>
                ) : (
                  '-- ms'
                )}
              </div>
              <div className="metric-sub">
                HTTP Roundtrip to backend
              </div>
            </div>

            {/* Server Uptime */}
            <div className="metric-box">
              <div className="metric-label">
                <Clock size={14} /> Server Uptime
              </div>
              <div className="metric-value">
                {health?.data?.uptime?.formatted ? (
                  <span>{health.data.uptime.formatted}</span>
                ) : (
                  '--'
                )}
              </div>
              <div className="metric-sub">
                Last checked: {health?.timestamp || 'Never'}
              </div>
            </div>
          </div>

          {/* Database guidance notice if not connected */}
          {isServerOk && !isDbConnected && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '10px',
              padding: '14px 18px',
              marginTop: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              fontSize: '0.85rem'
            }}>
              <AlertTriangle size={20} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--status-warning)' }}>MongoDB Atlas Configuration Notice:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                  The backend server is running smoothly! To connect your database for upcoming phases, set your connection string in <code style={{ color: '#a5b4fc', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>backend/.env</code>:
                  <br />
                  <code style={{ color: '#67e8f9', display: 'block', marginTop: '6px', wordBreak: 'break-all' }}>
                    MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/spotly?retryWrites=true&w=majority
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Backend Error Alert if Unreachable */}
          {!isServerOk && !loading && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '14px 18px',
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} color="var(--status-error)" />
                <span>
                  <strong style={{ color: 'var(--status-error)' }}>Backend Offline:</strong> {health?.error || 'Could not connect to http://localhost:5000'}
                </span>
              </div>
              <button onClick={fetchHealth} className="btn btn-secondary btn-sm">
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HealthWidget;
