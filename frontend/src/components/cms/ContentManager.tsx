import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { ContentType, ContentItem } from '../../index';

const API_BASE = 'http://localhost:3001/api';

export default function ContentManager() {
  const { typeName } = useParams<{ typeName: string }>();
  
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  // Delete mode
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!typeName) return;
    fetch(`${API_BASE}/content-types`)
      .then(r => r.json())
      .then((types: ContentType[]) => {
        const ct = types.find(t => t.name === typeName);
        setContentType(ct || null);
        if (!ct) setError(`Content type "${typeName}" not found`);
      })
      .catch(err => setError('Failed to load: ' + err.message));
  }, [typeName]);

  const loadItems = useCallback(() => {
    if (!typeName) return;
    setLoading(true);
    fetch(`${API_BASE}/content/${typeName}?status=all&sort=createdAt`)
      .then(r => r.json())
      .then((data: ContentItem[]) => setItems(data))
      .catch(err => setError('Failed: ' + err.message))
      .finally(() => setLoading(false));
  }, [typeName]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3500);
  };

  const openAdd = () => {
    const defaults: Record<string, unknown> = {};
    contentType?.fields.forEach(f => {
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
    });
    setFormData(defaults);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setFormData({ ...item.data });
    setEditingId(item._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName) return;

    const url = editingId ? `${API_BASE}/content/${typeName}/${editingId}` : `${API_BASE}/content/${typeName}`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      
      showAlert('success', editingId ? 'Updated!' : 'Created!');
      setIsModalOpen(false);
      loadItems();
    } catch {
      showAlert('error', 'Request failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;
    if (!typeName) return;
    try {
      await fetch(`${API_BASE}/content/${typeName}/${id}`, { method: 'DELETE' });
      showAlert('success', 'Deleted!');
      loadItems();
    } catch {
      showAlert('error', 'Delete failed');
    }
  };

  // ─── BULK DELETE ───
  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} items?`)) return;
    if (!typeName) return;

    try {
      await fetch(`${API_BASE}/content/${typeName}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      showAlert('success', `${selectedIds.size} deleted!`);
      setSelectedIds(new Set());
      setIsDeleteMode(false);
      loadItems();
    } catch {
      showAlert('error', 'Bulk delete failed');
    }
  };

  // ─── FILE UPLOAD ───
  const handleFileSelect = async (fieldName: string, file: File) => {
    if (!file) return;
    setUploadingField(fieldName);

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: uploadData,
      });
      const result = await res.json();
      setFormData(prev => ({ ...prev, [fieldName]: result.url }));
      showAlert('success', 'Image uploaded!');
    } catch {
      showAlert('error', 'Upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const renderFieldInput = (field: ContentType['fields'][0]) => {
    const value = formData[field.name] ?? '';
    const onChange = (v: unknown) => setFormData(prev => ({ ...prev, [field.name]: v }));

    switch (field.type) {
      case 'textarea':
        return <textarea className="form-input" rows={3} value={String(value)} onChange={e => onChange(e.target.value)} placeholder={field.label} />;
      case 'boolean':
        return (
          <label className="form-checkbox">
            <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />
            <span>{field.label}</span>
          </label>
        );
      case 'number':
        return <input className="form-input" type="number" value={String(value)} onChange={e => onChange(Number(e.target.value))} placeholder={field.label} />;
      case 'array':
        return <input className="form-input" value={Array.isArray(value) ? value.join(', ') : String(value)} onChange={e => onChange(e.target.value.split(',').map(s => s.trim()))} placeholder={`${field.label} (comma separated)`} />;
      
      // ─── IMAGE UPLOAD FIELD ───
      case 'image':
        return (
          <div className="image-upload-field">
            {value && (
              <div className="image-preview">
                <img src={String(value)} alt="Preview" />
                <button type="button" className="btn-remove-image" onClick={() => onChange('')}>×</button>
              </div>
            )}
            <div className="image-upload-controls">
              <input
                className="form-input"
                type="text"
                value={String(value)}
                onChange={e => onChange(e.target.value)}
                placeholder="Paste image URL"
              />
              <span className="upload-or">— OR —</span>
              <input
                type="file"
                accept="image/*"
                ref={el => { fileInputRefs.current[field.name] = el; }}
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(field.name, file);
                }}
              />
              <button
                type="button"
                className="btn-admin btn-select"
                onClick={() => fileInputRefs.current[field.name]?.click()}
                disabled={uploadingField === field.name}
              >
                {uploadingField === field.name ? 'Uploading...' : '📁 Upload Image'}
              </button>
            </div>
          </div>
        );

      default:
        return <input className="form-input" type="text" value={String(value)} onChange={e => onChange(e.target.value)} placeholder={field.label} required={field.required} />;
    }
  };

  if (error) {
    return (
      <div className="cms-content-manager">
        <div className="cms-header"><h1>⚠️ Error</h1></div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!contentType) return <div className="cms-loading">Loading "{typeName}"...</div>;

  return (
    <div className="cms-content-manager">
      <div className="cms-header">
        <h1>{contentType.icon} {contentType.label}</h1>
        <div className="cms-actions">
          {!isDeleteMode ? (
            <>
              <button className="btn-admin btn-add" onClick={openAdd}>+ Add {contentType.label}</button>
              <button className="btn-admin btn-delete" onClick={toggleDeleteMode}>Bulk Delete</button>
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
              <button className="btn-admin btn-cancel" onClick={toggleDeleteMode}>Cancel</button>
            </>
          )}
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No {contentType.label.toLowerCase()}s yet.</p>
          <button className="btn-admin btn-add" onClick={openAdd} style={{ marginTop: '1rem' }}>
            + Add First {contentType.label}
          </button>
        </div>
      ) : (
        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                {isDeleteMode && <th style={{ width: 60 }}><input type="checkbox" checked={selectedIds.size === items.length && items.length > 0} onChange={selectAll} /></th>}
                {contentType.fields.map(f => <th key={f.name}>{f.label}</th>)}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className={isDeleteMode && selectedIds.has(item._id) ? 'selected-row' : ''}>
                  {isDeleteMode && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item._id)}
                        onChange={() => toggleSelection(item._id)}
                      />
                    </td>
                  )}
                  {contentType.fields.map(f => (
                    <td key={f.name}>
                      {f.type === 'boolean' ? (item.data[f.name] ? '✅' : '❌') :
                       f.type === 'array' ? (item.data[f.name] as string[])?.join(', ') :
                       f.type === 'image' && item.data[f.name] ? (
                         <img src={String(item.data[f.name])} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                       ) :
                       String(item.data[f.name] ?? '-')}
                    </td>
                  ))}
                  <td>
                    <span className={`status-badge status-${item.status}`}>{item.status}</span>
                  </td>
                  <td style={{textAlign: 'center'}}>
                    {!isDeleteMode && (
                      <>
                        <button className="btn-edit-card" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn-delete-small" onClick={() => handleDelete(item._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>{editingId ? 'Edit' : 'Add'} {contentType.label}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {contentType.fields.map(field => (
                <div key={field.name} className="form-group">
                  <label className="form-label">{field.label}{field.required && ' *'}</label>
                  {renderFieldInput(field)}
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="btn-admin btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-admin btn-add">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}