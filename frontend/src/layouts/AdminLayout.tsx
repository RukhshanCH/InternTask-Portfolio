// ============================================
// layouts/AdminLayout.tsx — Portfolio-scoped Admin Wrapper
// Reads portfolioId from URL, loads data, provides context
// Fixed for React Router v6 Outlet pattern
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { 
  fetchAllPortfolioData, 
  getPortfolioMembers,
  getPortfolioInvitations,
  inviteUser,
  removeMember,
  signOut,
  type Portfolio,
  type PortfolioData,
  type PortfolioMember,
  type Invitation,
  type Theme,
} from '../utils/supabase';

// ─── ADMIN CONTEXT ───

interface AdminContextType {
  portfolioId: string;
  portfolio: Portfolio | null;
  data: PortfolioData | null;
  theme: Theme | null;
  members: PortfolioMember[];
  invitations: Invitation[];
  loading: boolean;
  refreshData: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  handleInvite: (email: string) => Promise<void>;
  handleRemoveMember: (userId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminLayout');
  return ctx;
};

// ─── NAV ITEMS (paths are route segments, NOT full URLs) ───

const NAV_ITEMS = [
  { path: '', label: '🎨 Theme', id: 'theme' },
  { path: 'hero', label: '🏠 Hero', id: 'hero' },
  { path: 'about', label: '👤 About', id: 'about' },
  { path: 'skills', label: '⭐ Skills', id: 'skills' },
  { path: 'projects', label: '🚀 Projects', id: 'projects' },
  { path: 'contact', label: '📧 Contact', id: 'contact' },
  { path: 'settings', label: '⚙️ Settings', id: 'settings' },
  { path: 'members', label: '👥 Members', id: 'members' },
  { path: 'inbox', label: '📨 Inbox', id: 'inbox' },
];

// ─── ADMIN LAYOUT ───

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState<PortfolioData | null>(null);
  const [members, setMembers] = useState<PortfolioMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Determine active tab from current path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPath = pathParts[pathParts.length - 1] || '';
  const activeTab = NAV_ITEMS.find(item => item.path === currentPath)?.id || 'theme';

  // Build absolute nav path
  const navPath = (segment: string) => `/admin/${portfolioId}${segment ? `/${segment}` : ''}`;

  useEffect(() => {
    if (portfolioId) {
      loadData();
    }
  }, [portfolioId]);

  async function loadData() {
    if (!portfolioId) return;
    setLoading(true);

    const [portfolioData, membersData, invitesData] = await Promise.all([
      fetchAllPortfolioData(portfolioId),
      getPortfolioMembers(portfolioId),
      getPortfolioInvitations(portfolioId),
    ]);

    setData(portfolioData);
    setMembers(membersData);
    setInvitations(invitesData);
    setLoading(false);
  }

  async function refreshData() {
    if (!portfolioId) return;
    const portfolioData = await fetchAllPortfolioData(portfolioId);
    setData(portfolioData);
  }

  async function refreshMembers() {
    if (!portfolioId) return;
    const [membersData, invitesData] = await Promise.all([
      getPortfolioMembers(portfolioId),
      getPortfolioInvitations(portfolioId),
    ]);
    setMembers(membersData);
    setInvitations(invitesData);
  }

  async function handleInvite(email: string) {
    if (!portfolioId || !email) return;
    setInviting(true);
    await inviteUser(email, portfolioId);
    await refreshMembers();
    setInviteEmail('');
    setShowInviteModal(false);
    setInviting(false);
  }

  async function handleRemoveMember(userId: string) {
    if (!portfolioId) return;
    await removeMember(portfolioId, userId);
    await refreshMembers();
  }

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  if (loading) {
    return (
      <div style={styles.loader}>
        <div className="spinner" />
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (!data || !portfolioId) {
    return (
      <div style={styles.loader}>
        <p>Portfolio not found or you don't have access.</p>
        <button onClick={() => navigate('/dashboard')} style={styles.button}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const ctxValue: AdminContextType = {
    portfolioId,
    portfolio: data.portfolio,
    data,
    theme: data.theme,
    members,
    invitations,
    loading,
    refreshData,
    refreshMembers,
    handleInvite,
    handleRemoveMember,
  };

  return (
    <AdminContext.Provider value={ctxValue}>
      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.portfolioTitle}>{data.portfolio?.title || 'Admin'}</h2>
            <span style={{
              ...styles.statusBadge,
              background: data.portfolio?.is_published ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
              color: data.portfolio?.is_published ? '#22c55e' : '#94a3b8',
            }}>
              {data.portfolio?.is_published ? 'Published' : 'Draft'}
            </span>
          </div>

          <nav style={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={navPath(item.path)}
                style={{
                  ...styles.navItem,
                  background: activeTab === item.id ? 'var(--color-primary, #3b82f6)' : 'transparent',
                  color: activeTab === item.id ? '#fff' : 'var(--color-text-muted, #94a3b8)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={styles.sidebarFooter}>
            <button 
              onClick={() => setShowInviteModal(true)}
              style={styles.inviteBtn}
            >
              + Invite Member
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          {/* Top Bar */}
          <header style={styles.topBar}>
            <div style={styles.breadcrumbs}>
              <Link to="/dashboard" style={styles.breadcrumbLink}>Dashboard</Link>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>Admin</span>
            </div>
            <div style={styles.topActions}>
              <a 
                href={`/portfolio/${data.portfolio?.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.previewLink}
              >
                🔗 Preview
              </a>
            </div>
          </header>

          {/* Content Area — Outlet renders child routes */}
          <div style={styles.content}>
            {children || <Outlet />}
          </div>
        </main>

        {/* Invite Modal */}
        {showInviteModal && (
          <div style={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Invite Team Member</h3>
              <p style={styles.modalDesc}>
                They'll receive an email with a link to join this portfolio as an editor.
              </p>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  style={styles.input}
                  autoFocus
                />
              </div>
              <div style={styles.modalActions}>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleInvite(inviteEmail)}
                  disabled={inviting || !inviteEmail}
                  style={{
                    ...styles.submitBtn,
                    opacity: inviting || !inviteEmail ? 0.6 : 1,
                  }}
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminContext.Provider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
  },
  loader: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  sidebar: {
    width: '260px',
    background: 'var(--color-surface, #1e293b)',
    borderRight: '1px solid var(--color-gray, #334155)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid var(--color-gray, #334155)',
  },
  portfolioTitle: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: 'var(--color-text, #e2e8f0)',
    wordBreak: 'break-word',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.15s',
    display: 'block',
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid var(--color-gray, #334155)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inviteBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px dashed var(--color-primary, #3b82f6)',
    background: 'transparent',
    color: 'var(--color-primary, #3b82f6)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
  logoutBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'transparent',
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%',
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 28px',
    borderBottom: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-surface, #1e293b)',
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  breadcrumbLink: {
    color: 'var(--color-primary, #3b82f6)',
    textDecoration: 'none',
  },
  breadcrumbSep: {
    color: 'var(--color-text-muted, #94a3b8)',
  },
  breadcrumbCurrent: {
    color: 'var(--color-text-muted, #94a3b8)',
  },
  topActions: {
    display: 'flex',
    gap: '12px',
  },
  previewLink: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 500,
  },
  content: {
    flex: 1,
    padding: '28px',
    overflowY: 'auto',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '16px',
    padding: '28px',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid var(--color-gray, #334155)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: 'var(--color-text, #e2e8f0)',
  },
  modalDesc: {
    fontSize: '14px',
    color: 'var(--color-text-muted, #94a3b8)',
    margin: '0 0 20px 0',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '20px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text, #e2e8f0)',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '15px',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'transparent',
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};