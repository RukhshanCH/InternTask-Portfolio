// ============================================
// components/cms/PageBuilder.tsx — Updated for Multi-Tenant
// Manages site settings and navigation order
// ============================================

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../layouts/AdminLayout';
import { updateSiteSettings } from '../../utils/supabase';

const AVAILABLE_SECTIONS = [
  { id: 'hero', label: '🏠 Hero' },
  { id: 'about', label: '👤 About' },
  { id: 'skills', label: '⭐ Skills' },
  { id: 'projects', label: '🚀 Projects' },
  { id: 'contact', label: '📧 Contact' },
];

export default function PageBuilder() {
  const { portfolioId, data, refreshData } = useAdmin();
  const settings = data?.settings;

  const [navOrder, setNavOrder] = useState<string[]>([]);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setNavOrder(settings.nav_order || ['hero', 'about', 'skills', 'projects', 'contact']);
      setSiteTitle(settings.site_title || '');
      setSiteDescription(settings.site_description || '');
    }
  }, [settings]);

  function moveSection(index: number, direction: 'up' | 'down') {
    const newOrder = [...navOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setNavOrder(newOrder);
  }

  function toggleSection(sectionId: string) {
    if (navOrder.includes(sectionId)) {
      setNavOrder(navOrder.filter(id => id !== sectionId));
    } else {
      setNavOrder([...navOrder, sectionId]);
    }
  }

  async function handleSave() {
    if (!portfolioId || !settings?.id) return;
    setSaving(true);
    await updateSiteSettings(portfolioId, settings.id, {
      site_title: siteTitle,
      site_description: siteDescription,
      nav_order: navOrder,
    });
    await refreshData();
    setSaving(false);
  }

  return (
    <div>
      <h1 style={styles.title}>📄 Page Builder</h1>
      <p style={styles.subtitle}>Configure site settings and navigation order</p>

      {/* Site Settings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Site Settings</h2>
        <div style={styles.formCard}>
          <div style={styles.field}>
            <label style={styles.label}>Site Title</label>
            <input
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              style={styles.input}
              placeholder="My Portfolio"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Site Description</label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              style={styles.textarea}
              rows={3}
              placeholder="Brief description for SEO..."
            />
          </div>
        </div>
      </div>

      {/* Navigation Order */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Navigation Order</h2>
        <p style={styles.hint}>Toggle sections to show/hide them. Drag to reorder (use arrows).</p>

        <div style={styles.navList}>
          {AVAILABLE_SECTIONS.map((section) => {
            const isEnabled = navOrder.includes(section.id);
            const index = navOrder.indexOf(section.id);

            return (
              <div 
                key={section.id} 
                style={{
                  ...styles.navItem,
                  opacity: isEnabled ? 1 : 0.5,
                  borderColor: isEnabled ? 'var(--color-primary, #3b82f6)' : 'var(--color-gray, #334155)',
                }}
              >
                <div style={styles.navItemLeft}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    style={{
                      ...styles.toggleBtn,
                      background: isEnabled ? 'var(--color-success, #22c55e)' : 'var(--color-gray, #334155)',
                    }}
                  >
                    {isEnabled ? '✓' : '○'}
                  </button>
                  <span style={styles.navLabel}>{section.label}</span>
                </div>

                {isEnabled && (
                  <div style={styles.navControls}>
                    <span style={styles.orderNum}>#{index + 1}</span>
                    <button 
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      style={styles.moveBtn}
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === navOrder.length - 1}
                      style={styles.moveBtn}
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave} 
        disabled={saving}
        style={{
          ...styles.saveBtn,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving...' : '💾 Save Changes'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: 'var(--color-text, #e2e8f0)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted, #94a3b8)',
    margin: '0 0 28px 0',
  },
  section: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: 'var(--color-text, #e2e8f0)',
  },
  formCard: {
    padding: '20px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '12px',
    border: '1px solid var(--color-gray, #334155)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
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
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  hint: {
    fontSize: '13px',
    color: 'var(--color-text-muted, #94a3b8)',
    margin: '-8px 0 12px 0',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #334155)',
    transition: 'all 0.15s',
  },
  navItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toggleBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--color-text, #e2e8f0)',
  },
  navControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orderNum: {
    fontSize: '13px',
    color: 'var(--color-text-muted, #94a3b8)',
    fontWeight: 600,
    minWidth: '30px',
    textAlign: 'center',
  },
  moveBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    padding: '14px 28px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};