// ============================================
// admin/InboxPage.tsx — Contact Form Submissions
// Shows messages sent via the public portfolio contact form
// ============================================

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../layouts/AdminLayout';
import { getContactSubmissions, markSubmissionAsRead } from '../utils/supabase';
import type { ContactSubmission } from '../utils/supabase';

export default function InboxPage() {
  const { portfolioId } = useAdmin();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadSubmissions();
  }, [portfolioId]);

  async function loadSubmissions() {
    if (!portfolioId) return;
    setLoading(true);
    const data = await getContactSubmissions(portfolioId);
    setSubmissions(data);
    setLoading(false);
  }

  async function handleMarkRead(id: string) {
    if (!portfolioId) return;
    await markSubmissionAsRead(portfolioId, id);
    await loadSubmissions();
  }

  const filtered = filter === 'unread' 
    ? submissions.filter(s => !s.is_read) 
    : submissions;

  const unreadCount = submissions.filter(s => !s.is_read).length;

  if (loading) {
    return <p style={{ color: 'var(--color-text-muted)' }}>Loading messages...</p>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📨 Inbox</h2>
          <p style={styles.subtitle}>
            {submissions.length} total · {unreadCount} unread
          </p>
        </div>
        <div style={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterBtn,
              background: filter === 'all' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: filter === 'all' ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            style={{
              ...styles.filterBtn,
              background: filter === 'unread' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: filter === 'unread' ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>
            {filter === 'unread' ? 'No unread messages' : 'No messages yet'}
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map((sub) => (
            <div 
              key={sub.id} 
              style={{
                ...styles.messageCard,
                borderLeftColor: sub.is_read ? 'var(--color-gray, #334155)' : 'var(--color-primary, #3b82f6)',
                background: sub.is_read ? 'var(--color-surface, #1e293b)' : 'rgba(59,130,246,0.05)',
              }}
            >
              <div style={styles.messageHeader}>
                <div style={styles.senderInfo}>
                  <span style={styles.senderName}>{sub.name}</span>
                  <span style={styles.senderEmail}>&lt;{sub.email}&gt;</span>
                  {sub.subject && (
                    <span style={styles.subject}>— {sub.subject}</span>
                  )}
                </div>
                <div style={styles.messageMeta}>
                  <span style={styles.date}>
                    {new Date(sub.created_at).toLocaleString()}
                  </span>
                  {!sub.is_read && (
                    <button
                      onClick={() => handleMarkRead(sub.id)}
                      style={styles.markReadBtn}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
              <p style={styles.messageBody}>{sub.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: 'var(--color-text, #e2e8f0)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted, #94a3b8)',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '8px',
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--color-gray, #334155)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '12px',
    border: '1px solid var(--color-gray, #334155)',
  },
  emptyText: {
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '15px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageCard: {
    padding: '20px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '12px',
    border: '1px solid var(--color-gray, #334155)',
    borderLeft: '4px solid var(--color-primary, #3b82f6)',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  senderInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  senderName: {
    fontWeight: 600,
    fontSize: '15px',
    color: 'var(--color-text, #e2e8f0)',
  },
  senderEmail: {
    fontSize: '13px',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  subject: {
    fontSize: '14px',
    color: 'var(--color-text, #e2e8f0)',
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  date: {
    fontSize: '12px',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  markReadBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
  },
  messageBody: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--color-text, #e2e8f0)',
    whiteSpace: 'pre-wrap',
  },
};