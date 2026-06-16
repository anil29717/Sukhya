import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './admin/layouts/AdminLayout';
import { DashboardView } from './admin/dashboard/DashboardView';
import { UsersView } from './admin/users/UsersView';
import { 
  PatientsView, DoctorsView, ApprovalsView, AppointmentsView, 
  RecordsView, PrescriptionsView, FamilyView, MedicationsView, 
  FollowupsView, VideoView, NotificationsView, HealthMetricsView, 
  AnalyticsReportsView, AuditLogsView, RolesPermissionsView, SettingsView 
} from './admin/components/DynamicViews';
import { OpsConsoleView } from './admin/components/OpsConsoleView';
import { api, getApiUrl, getAuthToken, setAuthToken, getAdminUser, setAdminUser } from './admin/services/api';
import { AlertCircle } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [adminUser, setAdminUserLocal] = useState<any>(getAdminUser());
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  
  const [apiStatus, setApiStatus] = useState<{ text: string; state: 'healthy' | 'loading' | 'offline' }>({
    text: 'Checking...',
    state: 'loading'
  });

  // Health check — backend /health is at root (not /api/v1/health)
  const checkApi = async () => {
    try {
      setApiStatus({ text: 'Syncing...', state: 'loading' });
      const baseUrl = getApiUrl().replace('/api/v1', '');
      await fetch(`${baseUrl}/health`);
      const port = new URL(getApiUrl().replace('/api/v1', '')).port || '8000';
      setApiStatus({ text: `Online (${port})`, state: 'healthy' });
    } catch {
      setApiStatus({ text: 'Offline / Gateway error', state: 'offline' });
    }
  };

  useEffect(() => {
    checkApi();
    const handleExpiry = () => {
      setIsAuthenticated(false);
      setAdminUserLocal(null);
    };
    window.addEventListener('auth-session-expired', handleExpiry);
    return () => window.removeEventListener('auth-session-expired', handleExpiry);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      // Step 1: Get tokens
      const res = await api.post('/auth/login', { email, password });
      const { access_token } = res.data;

      // Step 2: Store token temporarily so next request is authenticated
      setAuthToken(access_token);

      // Step 3: Fetch user profile using the token
      const profileRes = await api.get('/users/me');
      const user = profileRes.data;

      // Step 4: role is a nested object: { id, name }
      const roleName = user.role?.name || user.role;
      if (roleName !== 'admin') {
        setAuthToken(null); // revoke — not admin
        throw new Error('Access Denied: This account does not have administrator privileges.');
      }

      // Step 5: Persist and authenticate
      setAdminUser(user);
      setAdminUserLocal(user);
      setIsAuthenticated(true);
      setLoginError('');
      checkApi();

    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message;
      setLoginError(typeof detail === 'string' ? detail : 'Login failed. Check credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAdminUser(null);
    setAdminUserLocal(null);
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  // ── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    const inp: React.CSSProperties = {
      width: '100%', boxSizing: 'border-box',
      background: 'rgba(11,15,25,0.9)',
      border: '1px solid #1e293b', borderRadius: 10,
      padding: '12px 16px', color: '#f8fafc', fontSize: 14,
      outline: 'none', fontFamily: "'Outfit','Inter',sans-serif",
      transition: 'border-color 0.2s',
    };

    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#0b0f19', overflow: 'hidden',
        fontFamily: "'Outfit','Inter',sans-serif",
      }}>
        {/* Ambient glow orbs */}
        <div style={{ position:'absolute', top:'8%', left:'5%', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'8%', right:'5%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'45%', right:'20%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

        {/* Card */}
        <div style={{
          position:'relative', zIndex:10, width:'100%', maxWidth:460, margin:'0 20px',
          background:'rgba(17,24,39,0.85)', backdropFilter:'blur(24px)',
          border:'1px solid rgba(30,41,59,0.9)', borderRadius:24,
          padding:'48px 44px',
          boxShadow:'0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>

          {/* Brand */}
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{
              width:60, height:60, borderRadius:18, margin:'0 auto 18px',
              background:'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(20,184,166,0.18))',
              border:'1px solid rgba(59,130,246,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 8px 28px rgba(59,130,246,0.18)',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="url(#g1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5" stroke="url(#g2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke="url(#g3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="g1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#34d399"/></linearGradient>
                  <linearGradient id="g2" x1="2" y1="17" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#34d399"/></linearGradient>
                  <linearGradient id="g3" x1="2" y1="12" x2="22" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#34d399"/></linearGradient>
                </defs>
              </svg>
            </div>
            <h1 style={{
              fontSize:28, fontWeight:800, margin:'0 0 8px', letterSpacing:'-0.02em',
              background:'linear-gradient(135deg,#60a5fa 0%,#34d399 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>Lumina Health</h1>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <div style={{ height:1, width:36, background:'linear-gradient(to right,transparent,#1e293b)' }} />
              <p style={{ color:'#475569', fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', margin:0 }}>
                Enterprise Control Center
              </p>
              <div style={{ height:1, width:36, background:'linear-gradient(to left,transparent,#1e293b)' }} />
            </div>
          </div>

          {/* Error */}
          {loginError && (
            <div style={{
              marginBottom:20, padding:'12px 16px', borderRadius:10,
              background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
              color:'#f87171', fontSize:12, fontWeight:600,
              display:'flex', alignItems:'flex-start', gap:10,
            }}>
              <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                Email Address
              </label>
              <input
                type="email" required autoComplete="email"
                placeholder="admin@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1e293b')}
              />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                Password
              </label>
              <input
                type="password" required autoComplete="current-password"
                placeholder="••••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1e293b')}
              />
            </div>

            <button
              type="submit" disabled={loggingIn}
              style={{
                marginTop:6, padding:'14px 0',
                background: loggingIn ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg,#2563eb 0%,#0d9488 100%)',
                border:'none', borderRadius:12, color:'#fff',
                fontSize:15, fontWeight:700,
                cursor: loggingIn ? 'not-allowed' : 'pointer',
                boxShadow: loggingIn ? 'none' : '0 4px 24px rgba(59,130,246,0.3)',
                transition:'all 0.2s', letterSpacing:'0.01em',
                fontFamily:"'Outfit','Inter',sans-serif",
                display:'flex', alignItems:'center', justifyContent:'center', gap:9,
              }}
            >
              {loggingIn ? (
                <>
                  <span style={{
                    width:14, height:14,
                    border:'2px solid rgba(255,255,255,0.25)', borderTopColor:'#fff',
                    borderRadius:'50%', animation:'lspin 0.75s linear infinite', display:'inline-block',
                  }} />
                  Authenticating...
                </>
              ) : 'Sign In to Dashboard →'}
            </button>
          </form>

          {/* Demo creds */}
          <div style={{ marginTop:28, paddingTop:22, borderTop:'1px solid rgba(30,41,59,0.8)', textAlign:'center' }}>
            <p style={{ fontSize:10, color:'#334155', margin:'0 0 10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>
              Demo Access
            </p>
            <div style={{ background:'rgba(11,15,25,0.7)', border:'1px solid #1e293b', borderRadius:8, padding:'9px 18px', display:'inline-block' }}>
              <code style={{ fontSize:11, color:'#64748b', fontFamily:"'JetBrains Mono','Courier New',monospace" }}>
                admin@example.com &nbsp;/&nbsp; Admin@123456
              </code>
            </div>
          </div>

        </div>
        <style>{`@keyframes lspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── ADMIN APP ───────────────────────────────────────────────────────────────
  return (
    <BrowserRouter>
      <Routes>
        <Route element={
          <AdminLayout
            apiStatus={apiStatus}
            onLogout={handleLogout}
            adminName={adminUser?.full_name || 'Admin'}
          />
        }>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/users" element={<UsersView />} />
          <Route path="/patients" element={<PatientsView />} />
          <Route path="/doctors" element={<DoctorsView />} />
          <Route path="/approvals" element={<ApprovalsView />} />
          <Route path="/appointments" element={<AppointmentsView />} />
          <Route path="/records" element={<RecordsView />} />
          <Route path="/prescriptions" element={<PrescriptionsView />} />
          <Route path="/family" element={<FamilyView />} />
          <Route path="/medications" element={<MedicationsView />} />
          <Route path="/followups" element={<FollowupsView />} />
          <Route path="/video" element={<VideoView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/metrics" element={<HealthMetricsView />} />
          <Route path="/analytics" element={<AnalyticsReportsView />} />
          <Route path="/audit" element={<AuditLogsView />} />
          <Route path="/ops" element={<OpsConsoleView />} />
          <Route path="/permissions" element={<RolesPermissionsView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
