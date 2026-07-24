// ============================================
// components/cms/ContentManager.tsx — Updated for Multi-Tenant
// Generic content manager that works with any content type
// Uses useAdmin() for portfolioId and data
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAdmin } from '../../layouts/AdminLayout';
import { 
  getProjects, 
  getSkills, 
  getContact,
  getHero,
  getAbout,
  getSiteSettings,
  getAllThemes,
  updateProject,
  updateSkill,
  updateContact,
  updateHero,
  updateAbout,
  updateSiteSettings,
  updateTheme,
  createProject,
  createSkill,
  deleteProject,
  deleteSkill,
} from '../../utils/supabase';

// Content type configurations
const CONTENT_CONFIG: Record<string, {
  title: string;
  table: string;
  getData: (portfolioId: string) => Promise<any>;
  updateData: (portfolioId: string, id: string, data: any) => Promise<boolean>;
  createData?: (portfolioId: string, data: any) => Promise<any>;
  deleteData?: (portfolioId: string, id: string) => Promise<boolean>;
  fields: { name: string; label: string; type: string; required?: boolean }[];
}> = {
  theme: {
    title: 'Themes',
    table: 'themes',
    getData: getAllThemes,
    updateData: updateTheme,
    fields: [
      { name: 'name', label: 'Theme Name', type: 'text', required: true },
      { name: 'color_primary', label: 'Primary Color', type: 'color' },
      { name: 'color_secondary', label: 'Secondary Color', type: 'color' },
      { name: 'color_accent', label: 'Accent Color', type: 'color' },
      { name: 'color_background', label: 'Background Color', type: 'color' },
      { name: 'color_text', label: 'Text Color', type: 'color' },
      { name: 'color_success', label: 'Success Color', type: 'color' },
      { name: 'color_warning', label: 'Warning Color', type: 'color' },
      { name: 'color_danger', label: 'Danger Color', type: 'color' },
      { name: 'color_featured', label: 'Featured Color', type: 'color' },
      { name: 'border_radius', label: 'Border Radius', type: 'number' },
      { name: 'max_width', label: 'Max Width', type: 'number' },
      { name: 'font_family', label: 'Font Family', type: 'select' },
      { name: 'card_style', label: 'Card Style', type: 'select' },
      { name: 'button_style', label: 'Button Style', type: 'select' },
      { name: 'dark_mode', label: 'Dark Mode', type: 'checkbox' },
      { name: 'enable_animations', label: 'Enable Animations', type: 'checkbox' },
      { name: 'is_active', label: 'Active Theme', type: 'checkbox' },
    ],
  },
  hero: {
    title: 'Hero Section',
    table: 'hero',
    getData: getHero,
    updateData: updateHero,
    fields: [
      { name: 'greeting', label: 'Greeting', type: 'text' },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'headline', label: 'Headline', type: 'text' },
      { name: 'subheadline', label: 'Subheadline', type: 'textarea' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'cta_text', label: 'CTA Button Text', type: 'text' },
      { name: 'cta_link', label: 'CTA Link', type: 'text' },
      { name: 'image_url', label: 'Profile Image URL', type: 'text' },
      { name: 'background_image_url', label: 'Background Image URL', type: 'text' },
      { name: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  about: {
    title: 'About Section',
    table: 'about',
    getData: getAbout,
    updateData: updateAbout,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'richtext' },
      { name: 'short_bio', label: 'Short Bio', type: 'textarea' },
      { name: 'image_url', label: 'Image URL', type: 'text' },
      { name: 'resume_url', label: 'Resume URL', type: 'text' },
      { name: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  project: {
    title: 'Projects',
    table: 'projects',
    getData: getProjects,
    updateData: updateProject,
    createData: createProject,
    deleteData: deleteProject,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'long_description', label: 'Long Description', type: 'richtext' },
      { name: 'thumbnail_url', label: 'Thumbnail URL', type: 'text' },
      { name: 'live_url', label: 'Live URL', type: 'text' },
      { name: 'repo_url', label: 'Repository URL', type: 'text' },
      { name: 'tech_stack', label: 'Tech Stack (comma separated)', type: 'text' },
      { name: 'is_featured', label: 'Featured', type: 'checkbox' },
      { name: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  skill: {
    title: 'Skills',
    table: 'skills',
    getData: getSkills,
    updateData: updateSkill,
    createData: createSkill,
    deleteData: deleteSkill,
    fields: [
      { name: 'name', label: 'Skill Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'proficiency', label: 'Proficiency (0-100)', type: 'number' },
      { name: 'icon', label: 'Icon', type: 'text' },
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'display_order', label: 'Display Order', type: 'number' },
      { name: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  contact: {
    title: 'Contact',
    table: 'contact',
    getData: getContact,
    updateData: updateContact,
    fields: [
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
      { name: 'whatsapp_default_message', label: 'WhatsApp Default Message', type: 'text' },
      { name: 'form_enabled', label: 'Enable Contact Form', type: 'checkbox' },
      { name: 'form_success_message', label: 'Success Message', type: 'text' },
      { name: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  settings: {
    title: 'Site Settings',
    table: 'site_settings',
    getData: getSiteSettings,
    updateData: updateSiteSettings,
    fields: [
      { name: 'site_title', label: 'Site Title', type: 'text', required: true },
      { name: 'site_description', label: 'Site Description', type: 'textarea' },
      { name: 'favicon_url', label: 'Favicon URL', type: 'text' },
      { name: 'og_image_url', label: 'OG Image URL', type: 'text' },
      { name: 'nav_order', label: 'Navigation Order (JSON)', type: 'textarea' },
    ],
  },
};

export default function ContentManager() {
  const { typeName } = useParams<{ typeName: string }>();
  const { portfolioId, refreshData } = useAdmin();

  const config = typeName ? CONTENT_CONFIG[typeName] : null;

  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config && portfolioId) {
      loadData();
    }
  }, [typeName, portfolioId]);

  async function loadData() {
    if (!config || !portfolioId) return;
    setLoading(true);
    const data = await config.getData(portfolioId);
    setItems(Array.isArray(data) ? data : data ? [data] : []);
    setLoading(false);
  }

  function handleEdit(item: any) {
    setEditingId(item.id);
    setFormData({ ...item });
  }

  function handleNew() {
    setEditingId('new');
    const empty: Record<string, any> = {};
    config?.fields.forEach(f => {
      empty[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? 0 : '';
    });
    setFormData(empty);
  }

  async function handleSave() {
    if (!config || !portfolioId) return;
    setSaving(true);

    // Process form data
    const processed = { ...formData };
    if (processed.tech_stack && typeof processed.tech_stack === 'string') {
      processed.tech_stack = processed.tech_stack.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (processed.nav_order && typeof processed.nav_order === 'string') {
      try { processed.nav_order = JSON.parse(processed.nav_order); } catch {}
    }
    if (processed.border_radius) processed.border_radius = String(processed.border_radius);
    if (processed.max_width) processed.max_width = String(processed.max_width);
    if (processed.proficiency) processed.proficiency = Number(processed.proficiency);
    if (processed.display_order) processed.display_order = Number(processed.display_order);

    if (editingId === 'new' && config.createData) {
      await config.createData(portfolioId, processed);
    } else if (editingId) {
      await config.updateData(portfolioId, editingId, processed);
    }

    await loadData();
    await refreshData();
    setEditingId(null);
    setFormData({});
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!config?.deleteData || !portfolioId) return;
    if (!confirm('Are you sure you want to delete this item?')) return;
    await config.deleteData(portfolioId, id);
    await loadData();
    await refreshData();
  }

  function handleChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function renderField(field: typeof CONTENT_CONFIG[string]['fields'][0]) {
    const value = formData[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            rows={4}
            style={styles.textarea}
          />
        );
      case 'richtext':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            rows={8}
            style={styles.textarea}
            placeholder="Supports markdown..."
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            style={styles.checkbox}
          />
        );
      case 'color':
        return (
          <div style={styles.colorInputWrapper}>
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(field.name, e.target.value)}
              style={styles.colorInput}
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleChange(field.name, e.target.value)}
            style={styles.input}
          />
        );
      case 'select':
        const options = field.name === 'font_family' 
          ? ['system', 'inter', 'roboto', 'poppins', 'montserrat']
          : field.name === 'card_style'
          ? ['rounded', 'sharp', 'glass']
          : field.name === 'button_style'
          ? ['gradient', 'solid', 'outline', 'glow']
          : [];
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            style={styles.select}
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            style={styles.input}
          />
        );
    }
  }

  if (!config) {
    return (
      <div>
        <h2>Unknown Content Type</h2>
        <p>The content type "{typeName}" is not configured.</p>
      </div>
    );
  }

  if (loading) {
    return <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>{config.title}</h1>
        {config.createData && (
          <button onClick={handleNew} style={styles.newButton}>
            + New {config.title.slice(0, -1)}
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editingId && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingId === 'new' ? `Create New ${config.title.slice(0, -1)}` : 'Edit'}
          </h3>
          <div style={styles.formGrid}>
            {config.fields.map(field => (
              <div key={field.name} style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <span style={styles.required}> *</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
          <div style={styles.formActions}>
            <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div style={styles.list}>
        {items.length === 0 ? (
          <p style={styles.empty}>No items yet. Click "New" to create one.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} style={styles.itemCard}>
              <div style={styles.itemInfo}>
                <h4 style={styles.itemTitle}>
                  {item.name || item.title || item.site_title || 'Untitled'}
                  {item.is_active === false && <span style={styles.inactiveBadge}>Inactive</span>}
                  {item.is_featured && <span style={styles.featuredBadge}>Featured</span>}
                </h4>
                {item.description && (
                  <p style={styles.itemDesc}>{item.description.substring(0, 100)}...</p>
                )}
              </div>
              <div style={styles.itemActions}>
                <button onClick={() => handleEdit(item)} style={styles.editBtn}>
                  Edit
                </button>
                {config.deleteData && (
                  <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-text, #e2e8f0)',
  },
  newButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  formCard: {
    padding: '24px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '12px',
    border: '1px solid var(--color-gray, #334155)',
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 20px 0',
    color: 'var(--color-text, #e2e8f0)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text, #e2e8f0)',
  },
  required: {
    color: '#ef4444',
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
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '14px',
    outline: 'none',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  colorInputWrapper: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  colorInput: {
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: 0,
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'transparent',
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--color-text-muted, #94a3b8)',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '12px',
    border: '1px solid var(--color-gray, #334155)',
  },
  itemCard: {
    padding: '16px 20px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #334155)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: 'var(--color-text, #e2e8f0)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  itemDesc: {
    fontSize: '13px',
    color: 'var(--color-text-muted, #94a3b8)',
    margin: 0,
  },
  itemActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid var(--color-primary, #3b82f6)',
    background: 'transparent',
    color: 'var(--color-primary, #3b82f6)',
    fontSize: '13px',
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #ef4444',
    background: 'transparent',
    color: '#ef4444',
    fontSize: '13px',
    cursor: 'pointer',
  },
  inactiveBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'rgba(148,163,184,0.2)',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 500,
  },
  featuredBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'rgba(251,191,36,0.2)',
    color: '#fbbf24',
    fontSize: '11px',
    fontWeight: 500,
  },
};