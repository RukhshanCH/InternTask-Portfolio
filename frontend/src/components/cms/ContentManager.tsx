import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import { supabase } from '../../utils/supabase';

// ─── TABLE CONFIG ───
// Maps content type names to their Supabase table names and fields

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'image' | 'images' | 'array' | 'select';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface TableConfig {
  tableName: string;
  label: string;
  icon: string;
  fields: FieldConfig[];
  isSingle?: boolean; // true for hero, about, contact (only one row)
}

const TABLE_MAP: Record<string, TableConfig> = {
  project: {
    tableName: 'projects',
    label: 'Projects',
    icon: '🚀',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Web', 'Mobile', 'Design', 'Other'] },
      { name: 'image_url', label: 'Cover Image', type: 'image' },
      { name: 'images', label: 'Gallery Images', type: 'images' },
      { name: 'technologies', label: 'Technologies', type: 'array', placeholder: 'React, TypeScript, Node.js' },
      { name: 'github_url', label: 'GitHub URL', type: 'text' },
      { name: 'live_url', label: 'Live URL', type: 'text' },
      { name: 'insta_url', label: 'Instagram', type: 'text' },
      { name: 'fb_url', label: 'Facebook', type: 'text' },
      { name: 'behance_url', label: 'Behance', type: 'text' },
      { name: 'linkedin_url', label: 'LinkedIn', type: 'text' },
      { name: 'reddit_url', label: 'Reddit', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'boolean' },
      { name: 'is_active', label: 'Active', type: 'boolean' },
      { name: 'order_index', label: 'Sort Order', type: 'number' },
    ],
  },
  hero: {
    tableName: 'hero',
    label: 'Hero',
    icon: '📄',
    isSingle: true,
    fields: [
      { name: 'greeting', label: 'Greeting', type: 'text', placeholder: 'Hello, I am' },
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Alex Developer' },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { name: 'background_image', label: 'Background Image', type: 'image' },
      { name: 'is_active', label: 'Active', type: 'boolean' },
      { name: 'order_index', label: 'Sort Order', type: 'number' },
    ],
  },
  about: {
    tableName: 'about',
    label: 'About',
    icon: '👨‍💻',
    isSingle: true,
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'bio', label: 'Bio', type: 'textarea' },
      { name: 'image_url', label: 'Image', type: 'image' },
      { name: 'is_active', label: 'Active', type: 'boolean' },
      { name: 'order_index', label: 'Sort Order', type: 'number' },
    ],
  },
  skill: {
    tableName: 'skills',
    label: 'Skills',
    icon: '⭐',
    fields: [
      { name: 'name', label: 'Skill Name', type: 'text', required: true },
      { name: 'level', label: 'Level (0-100)', type: 'number' },
      { name: 'category', label: 'Category', type: 'select', options: ['Frontend', 'Backend', 'Database', 'DevOps', 'Design', 'Other'] },
      { name: 'icon', label: 'Icon', type: 'text', placeholder: 'react, node, etc.' },
      { name: 'is_active', label: 'Active', type: 'boolean' },
      { name: 'order_index', label: 'Sort Order', type: 'number' },
    ],
  },
  contact: {
    tableName: 'contact',
    label: 'Contact',
    icon: '📧',
    isSingle: true,
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
      { name: 'whatsapp_message', label: 'WhatsApp Message', type: 'text' },
      { name: 'linkedin_url', label: 'LinkedIn', type: 'text' },
      { name: 'github_url', label: 'GitHub', type: 'text' },
      { name: 'twitter_url', label: 'Twitter', type: 'text' },
      { name: 'instagram_url', label: 'Instagram', type: 'text' },
      { name: 'facebook_url', label: 'Facebook', type: 'text' },
      { name: 'reddit_url', label: 'Reddit', type: 'text' },
      { name: 'form_enabled', label: 'Show Form', type: 'boolean' },
      { name: 'is_active', label: 'Active', type: 'boolean' },
      { name: 'order_index', label: 'Sort Order', type: 'number' },
    ],
  },
  theme: {
    tableName: 'themes',
    label: 'Themes',
    icon: '🎨',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'color_primary', label: 'Primary Color', type: 'text' },
      { name: 'color_secondary', label: 'Secondary Color', type: 'text' },
      { name: 'color_accent', label: 'Accent Color', type: 'text' },
      { name: 'color_dark', label: 'Dark Color', type: 'text' },
      { name: 'color_light', label: 'Light Color', type: 'text' },
      { name: 'color_text', label: 'Text Color', type: 'text' },
      { name: 'border_radius', label: 'Border Radius', type: 'number' },
      { name: 'max_width', label: 'Max Width', type: 'number' },
      { name: 'font_family', label: 'Font Family', type: 'select', options: ['system', 'serif', 'mono'] },
      { name: 'card_style', label: 'Card Style', type: 'select', options: ['rounded', 'glass', 'flat'] },
      { name: 'button_style', label: 'Button Style', type: 'select', options: ['gradient', 'solid', 'glow', 'outline'] },
      { name: 'dark_mode', label: 'Dark Mode', type: 'boolean' },
      { name: 'is_active', label: 'Active', type: 'boolean' },
      { name: 'is_featured', label: 'Featured', type: 'boolean' },
      { name: 'order_index', label: 'Sort Order', type: 'number' },
    ],
  },
};

// ─── COMPONENT ───

export default function ContentManager() {
  const { typeName } = useParams<{ typeName: string }>();
  const config = typeName ? TABLE_MAP[typeName] : null;

  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── FETCH ───
  const loadItems = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(config.tableName).select('*');

      if (config.isSingle) {
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        setItems(data ? [data] : []);
      } else {
        const { data, error } = await query.order('order_index', { ascending: true });
        if (error) throw error;
        setItems(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3500);
  };

  // ─── FORM ───
  const openModal = (item?: Record<string, unknown>) => {
    if (item) {
      setFormData({ ...item });
      setEditingId(String(item.id));
    } else {
      const defaults: Record<string, unknown> = {};
      config?.fields.forEach((f) => {
        if (f.type === 'boolean') defaults[f.name] = true;
        else if (f.type === 'number') defaults[f.name] = 0;
        else if (f.type === 'array' || f.type === 'images') defaults[f.name] = [];
        else defaults[f.name] = '';
      });
      if (!config?.isSingle) {
        defaults.order_index = items.length + 1;
      }
      setFormData(defaults);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({});
    setEditingId(null);
  };

  // ─── SUBMIT ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setAlert(null);

    // Clean up empty arrays
    const payload = { ...formData };
    config.fields.forEach((f) => {
      if ((f.type === 'array' || f.type === 'images') && !payload[f.name]) {
        payload[f.name] = [];
      }
      if (f.type === 'number' && payload[f.name]) {
        payload[f.name] = Number(payload[f.name]);
      }
    });

    try {
      if (editingId) {
        const { error } = await supabase
          .from(config.tableName)
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        showAlert('success', 'Updated!');
      } else {
        const { error } = await supabase.from(config.tableName).insert(payload);
        if (error) throw error;
        showAlert('success', 'Created!');
      }

      // Theme activation: deactivate others, then refresh
      if (typeName === 'theme' && payload.is_active) {
        const { error: themeError } = await supabase
          .from('themes')
          .update({ is_active: false })
          .neq('id', editingId || '');
        if (themeError) console.error('Theme deactivate error:', themeError);

        // Apply theme immediately without full page reload
        const { data: freshTheme } = await supabase
          .from('themes')
          .select('*')
          .eq('id', editingId)
          .single();

        if (freshTheme) {
          // Dispatch custom event so App.tsx can pick it up
          window.dispatchEvent(new CustomEvent('theme-updated', { detail: freshTheme }));
        }
      }

      setIsModalOpen(false);
      resetForm();
      await loadItems();
      // Force refresh theme if we edited themes
      if (typeName === 'theme') {
        window.dispatchEvent(new CustomEvent('theme-needs-refresh'));
      }
    } catch (err: any) {
      showAlert('error', err.message || 'Request failed');
    }
  };

  // ─── DELETE ───
  const handleDelete = async (id: string) => {
    if (!config) return;
    if (!window.confirm('Delete this item?')) return;

    try {
      const { error } = await supabase.from(config.tableName).delete().eq('id', id);
      if (error) throw error;
      showAlert('success', 'Deleted!');
      loadItems();
    } catch (err: any) {
      showAlert('error', err.message || 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!config || selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} items?`)) return;

    try {
      const { error } = await supabase
        .from(config.tableName)
        .delete()
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      showAlert('success', `${selectedIds.size} deleted!`);
      setSelectedIds(new Set());
      setIsDeleteMode(false);
      loadItems();
    } catch (err: any) {
      showAlert('error', err.message || 'Bulk delete failed');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => String(i.id))));
    }
  };

  // ─── FIELD RENDERERS ───
  const renderFieldInput = (field: FieldConfig) => {
    const value = formData[field.name] ?? '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className="form-input"
            rows={3}
            value={String(value)}
            onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.value }))}
            placeholder={field.placeholder || field.label}
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.checked }))}
            />
            <span>{field.label}</span>
          </label>
        );

      case 'number':
        return (
          <input
            className="form-input"
            type="number"
            value={String(value)}
            onChange={(e) => setFormData((p) => ({ ...p, [field.name]: Number(e.target.value) }))}
            placeholder={field.placeholder || field.label}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            className="form-input"
            value={String(value)}
            onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.value }))}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'image':
        return (
          <div className="image-upload-field">
            {value && (
              <div className="image-preview">
                <img src={String(value)} alt="Preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => setFormData((p) => ({ ...p, [field.name]: '' }))}
                >
                  <FaTimes />
                </button>
              </div>
            )}
            <input
              className="form-input"
              type="text"
              value={String(value)}
              onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.value }))}
              placeholder="Paste image URL"
            />
          </div>
        );

      case 'images':
        const images = (formData[field.name] as string[]) || [];
        return (
          <div className="multi-image-field">
            {images.length > 0 && (
              <div className="image-grid">
                {images.map((url, idx) => (
                  <div key={idx} className="image-grid-item">
                    <img src={url} alt={`Image ${idx + 1}`} />
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => {
                        const updated = images.filter((_, i) => i !== idx);
                        setFormData((p) => ({ ...p, [field.name]: updated }));
                      }}
                    >
                      <FaTimes />
                    </button>
                    <span className="image-order-badge">{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
            <input
              className="form-input"
              type="text"
              value={images.join(', ')}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  [field.name]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
              placeholder="Paste image URLs (comma separated)"
            />
          </div>
        );

      case 'array':
        const arr = (formData[field.name] as string[]) || [];
        return (
          <input
            className="form-input"
            value={arr.join(', ')}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                [field.name]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              }))
            }
            placeholder={field.placeholder || `${field.label} (comma separated)`}
          />
        );

      default:
        return (
          <input
            className="form-input"
            type="text"
            value={String(value)}
            onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.value }))}
            placeholder={field.placeholder || field.label}
            required={field.required}
          />
        );
    }
  };

  // ─── RENDER CELL VALUE ───
  const renderCellValue = (item: Record<string, unknown>, field: FieldConfig) => {
    const value = item[field.name];

    if (field.type === 'boolean') {
      return value ? '✅' : '❌';
    }
    if (field.type === 'images' && Array.isArray(value)) {
      return (
        <div className="table-image-stack">
          {value.slice(0, 3).map((url: string, i: number) => (
            <img
              key={i}
              src={url}
              alt=""
              className="table-thumb"
              style={{ marginLeft: i > 0 ? -12 : 0, zIndex: 3 - i }}
            />
          ))}
          {value.length > 3 && <span className="table-more-images">+{value.length - 3}</span>}
        </div>
      );
    }
    if (field.type === 'image' && value) {
      return <img src={String(value)} alt="" className="table-thumb" />;
    }
    if (field.type === 'array' && Array.isArray(value)) {
      return value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '');
    }
    if (field.name === 'title' || field.name === 'name') {
      return <strong>{String(value || '-')}</strong>;
    }
    return String(value ?? '-');
  };

  // ─── RENDER ───
  if (!config) {
    return (
      <div className="cms-content-manager">
        <div className="cms-header">
          <h1>⚠️ Unknown Content Type</h1>
        </div>
        <div className="alert alert-error">
          Content type "{typeName}" not found. Available: {Object.keys(TABLE_MAP).join(', ')}
        </div>
      </div>
    );
  }

  return (
    <div className="cms-content-manager">
      <div className="cms-header">
        <h1>
          {config.icon} {config.label}
        </h1>
        <div className="cms-actions">
          {!isDeleteMode ? (
            <>
              {!config.isSingle && (
                <button className="btn-admin btn-add" onClick={() => openModal()}>
                  <FaPlus /> Add {config.label}
                </button>
              )}
              {config.isSingle && items.length === 0 && (
                <button className="btn-admin btn-add" onClick={() => openModal()}>
                  <FaPlus /> Create {config.label}
                </button>
              )}
              {config.isSingle && items.length > 0 && (
                <button className="btn-admin btn-add" onClick={() => openModal(items[0])}>
                  <FaEdit /> Edit {config.label}
                </button>
              )}
              {!config.isSingle && (
                <button className="btn-admin btn-delete" onClick={() => setIsDeleteMode(true)}>
                  <FaTrash /> Bulk Delete
                </button>
              )}
            </>
          ) : (
            <>
              <button className="btn-admin btn-select" onClick={selectAll}>
                {selectedIds.size === items.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                className="btn-admin btn-delete-confirm"
                disabled={selectedIds.size === 0}
                onClick={handleBulkDelete}
              >
                Delete ({selectedIds.size})
              </button>
              <button className="btn-admin btn-cancel" onClick={() => { setIsDeleteMode(false); setSelectedIds(new Set()); }}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No {config.label.toLowerCase()} yet.</p>
          {!config.isSingle && (
            <button className="btn-admin btn-add" onClick={() => openModal()} style={{ marginTop: '1rem' }}>
              <FaPlus /> Add First {config.label}
            </button>
          )}
        </div>
      ) : (
        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                {isDeleteMode && !config.isSingle && (
                  <th style={{ width: 50 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === items.length && items.length > 0}
                      onChange={selectAll}
                    />
                  </th>
                )}
                {config.fields
                  .filter((f) => !['insta_url', 'fb_url', 'behance_url', 'linkedin_url', 'reddit_url', 'youtube_url', 'dribbble_url', 'whatsapp_number', 'whatsapp_message'].includes(f.name))
                  .map((f) => (
                    <th key={f.name}>{f.label}</th>
                  ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={String(item.id)}
                  className={selectedIds.has(String(item.id)) ? 'selected-row' : ''}
                >
                  {isDeleteMode && !config.isSingle && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(String(item.id))}
                        onChange={() => toggleSelection(String(item.id))}
                      />
                    </td>
                  )}
                  {config.fields
                    .filter((f) => !['insta_url', 'fb_url', 'behance_url', 'linkedin_url', 'reddit_url', 'youtube_url', 'dribbble_url', 'whatsapp_number', 'whatsapp_message'].includes(f.name))
                    .map((f) => (
                      <td key={f.name}>{renderCellValue(item, f)}</td>
                    ))}
                  <td>
                    {!isDeleteMode && (
                      <>
                        <button className="btn-edit-card" onClick={() => openModal(item)}>
                          <FaEdit /> Edit
                        </button>
                        {!config.isSingle && (
                          <button className="btn-delete-small" onClick={() => handleDelete(String(item.id))}>
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL ─── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>
                {editingId ? '✏️ Edit' : '➕ Add'} {config.label}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {config.fields.map((field) => (
                <div key={field.name} className="form-group">
                  <label className="form-label">
                    {field.label}
                    {field.required && ' *'}
                  </label>
                  {renderFieldInput(field)}
                </div>
              ))}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-admin btn-cancel"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-admin btn-add">
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}