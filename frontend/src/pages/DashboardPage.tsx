// ============================================
// pages/DashboardPage.tsx — Portfolio List & Create
// Shows all portfolios user owns or is member of
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getMyPortfolios, 
  createPortfolio, 
  getMyInvitations, 
  acceptInvitation,
  signOut,
  type Portfolio,
  type Invitation 
} from '../utils/supabase';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [myPortfolios, myInvites] = await Promise.all([
      getMyPortfolios(),
      getMyInvitations(),
    ]);
    setPortfolios(myPortfolios);
    setInvitations(myInvites);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newSlug) return;

    setCreating(true);
    const slug = newSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const portfolio = await createPortfolio(newTitle, slug, newDescription || undefined);
    if (portfolio) {
      setShowCreateModal(false);
      setNewTitle('');
      setNewSlug('');
      setNewDescription('');
      navigate(`/admin/${portfolio.id}`);
    }
    setCreating(false);
  }

  async function handleAcceptInvite(token: string) {
    const success = await acceptInvitation(token);
    if (success) {
      await loadData(); // Refresh to show new portfolio
    }
  }

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  if (loading) {
    return (
      <div style={styles.loader}>
        <div className="spinner" />
        <p>Loading your portfolios...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>My Portfolios</h1>
        <div style={styles.headerActions}>
          <button 
            onClick={() => setShowCreateModal(true)}
            style={styles.createBtn}
          >
            + New Portfolio
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Invitations */}
      {invitations.length > 0 && (
        <div style={styles.inviteSection}>
          <h2 style={styles.sectionTitle}>📨 Pending Invitations</h2>
          <div style={styles.inviteList}>
            {invitations.map((invite) => (
              <div key={invite.id} style={styles.inviteCard}>
                <div>
                  <p style={styles.inviteText}>
                    Invited to <strong>{(invite as any).portfolios?.title || 'a portfolio'}</strong>
                  </p>
                  <p style={styles.inviteMeta}>Expires: {new Date(invite.expires_at).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => handleAcceptInvite(invite.token)}
                  style={styles.acceptBtn}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolios Grid */}
      <div style={styles.grid}>
        {portfolios.map((portfolio) => (
          <div 
            key={portfolio.id} 
            style={styles.card}
            onClick={() => navigate(`/admin/${portfolio.id}`)}
          >
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{portfolio.title}</h3>
              <span style={{
                ...styles.badge,
                background: portfolio.is_published ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
                color: portfolio.is_published ? '#22c55e' : '#94a3b8',
              }}>
                {portfolio.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <p style={styles.cardSlug}>/{portfolio.slug}</p>
            {portfolio.description && (
              <p style={styles.cardDesc}>{portfolio.description}</p>
            )}
            <div style={styles.cardFooter}>
              <span style={styles.cardDate}>
                Created {new Date(portfolio.created_at).toLocaleDateString()}
              </span>
              <span style={styles.arrow}>→</span>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <button 
          onClick={() => setShowCreateModal(true)}
          style={styles.addCard}
        >
          <span style={styles.addIcon}>+</span>
          <span style={styles.addText}>Create New Portfolio</span>
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Portfolio</h2>
            <form onSubmit={handleCreate} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  required
                  style={styles.input}
                  placeholder="My Awesome Portfolio"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Slug *</label>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="my-portfolio"
                />
                <p style={styles.hint}>URL: /portfolio/{newSlug || 'your-slug'}</p>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                  placeholder="Brief description..."
                />
              </div>
              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  style={styles.submitBtn}
                >
                  {creating ? 'Creating...' : 'Create Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    padding: '24px 32px',
  },
  loader: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--color-gray, #334155)',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  createBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'transparent',
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  inviteSection: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--color-text, #e2e8f0)',
  },
  inviteList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inviteCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '12px',
    border: '1px solid var(--color-gray, #334155)',
  },
  inviteText: {
    margin: '0 0 4px 0',
    fontSize: '15px',
  },
  inviteMeta: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  acceptBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--color-success, #22c55e)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    padding: '24px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '16px',
    border: '1px solid var(--color-gray, #334155)',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--color-text, #e2e8f0)',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
  },
  cardSlug: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: 'var(--color-primary, #3b82f6)',
  },
  cardDesc: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: 'var(--color-text-muted, #94a3b8)',
    lineHeight: 1.5,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid var(--color-gray, #334155)',
  },
  cardDate: {
    fontSize: '13px',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  arrow: {
    fontSize: '18px',
    color: 'var(--color-primary, #3b82f6)',
  },
  addCard: {
    padding: '24px',
    background: 'transparent',
    borderRadius: '16px',
    border: '2px dashed var(--color-gray, #334155)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    minHeight: '180px',
    transition: 'border-color 0.2s',
  },
  addIcon: {
    fontSize: '32px',
    color: 'var(--color-primary, #3b82f6)',
  },
  addText: {
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--color-text-muted, #94a3b8)',
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
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    border: '1px solid var(--color-gray, #334155)',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 24px 0',
    color: 'var(--color-text, #e2e8f0)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
  hint: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
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