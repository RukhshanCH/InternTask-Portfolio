import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FaTimes, FaUpload, FaImage, FaGripVertical } from 'react-icons/fa';
import type { ContentType, ContentItem } from '../../index';
import ThemePreview from './ThemePreview';

const API_BASE: string = (import.meta as any).env?.VITE_BACKEND_URL || 'password' + '/api';

export default function ContentManager() {
  const { typeName } = useParams<{ typeName: string }>();

  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);

  // Drag state
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [draggedImage, setDraggedImage] = useState<{ field: string; index: number } | null>(null);

  const fetchContentType = useCallback(async () => {
    if (!typeName) return;
    try {
      const res = await fetch(`${API_BASE}/content-types`);
      const types: ContentType[] = await res.json();
      const ct = types.find(t => t.name === typeName);
      setContentType(ct || null);
      if (!ct) setError(`Content type "${typeName}" not found`);
    } catch {
      setError('Failed to load content type');
    }
  }, [typeName]);

  const loadItems = useCallback(async () => {
    if (!typeName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/content/${typeName}?status=all&sort=order`);
      const data: ContentItem[] = await res.json();
      setItems(data);
    } catch {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [typeName]);

  useEffect(() => {
    fetchContentType();
    loadItems();
  }, [fetchContentType, loadItems]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3500);
  };

  const getNextOrder = (): number => {
    if (items.length === 0) return 1;
    const orders = items.map(i => Number((i.data as Record<string, unknown>).order) || 0);
    return Math.max(...orders) + 1;
  };

  const openModal = async (item?: ContentItem) => {
    await fetchContentType();

    if (item) {
      setFormData({ ...item.data });
      setEditingId(item._id);
    } else {
      const defaults: Record<string, unknown> = {};
      contentType?.fields.forEach(f => {
        if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      });
      defaults.order = getNextOrder();
      setFormData(defaults);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const openAdd = () => openModal();
  const openEdit = (item: ContentItem) => openModal(item);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName) return;

    const payload = { ...formData };
    if (payload.order !== undefined) payload.order = Number(payload.order) || 0;

    const url = editingId
      ? `${API_BASE}/content/${typeName}/${editingId}`
      : `${API_BASE}/content/${typeName}`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed');

      showAlert('success', editingId ? 'Updated!' : 'Created!');
      setIsModalOpen(false);
      loadItems();

      // ── THEME-SPECIFIC LOGIC ──
      if (typeName === 'theme' && formData.isActive) {
        // 1. Unfeature all other themes
        const themesRes = await fetch(`${API_BASE}/content/theme?status=all`);
        const themes = await themesRes.json();
        const others = themes.filter((t: ContentItem) => t._id !== editingId);

        await Promise.all(
          others.map((t: ContentItem) =>
            fetch(`${API_BASE}/content/theme/${t._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...t.data, isActive: false }), // ← was featured: false
            })
          )
        );

        // 2. Refresh the page so new theme CSS variables apply
        window.location.reload();
      }
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

  // ─── SINGLE FILE UPLOAD ───
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

  // ─── MULTI-IMAGE UPLOAD ───
  const handleMultiUpload = async (fieldName: string, files: FileList) => {
    if (!files || files.length === 0) return;

    const currentImages = (formData[fieldName] as string[]) || [];
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, [`${fieldName}-${i}`]: 0 }));

      const uploadData = new FormData();
      uploadData.append('image', file);

      try {
        setUploadProgress(prev => ({ ...prev, [`${fieldName}-${i}`]: 50 }));
        const res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: uploadData,
        });
        const result = await res.json();
        newUrls.push(result.url);
        setUploadProgress(prev => ({ ...prev, [`${fieldName}-${i}`]: 100 }));
      } catch {
        showAlert('error', `Failed to upload ${file.name}`);
      }
    }

    setFormData(prev => ({
      ...prev,
      [fieldName]: [...currentImages, ...newUrls],
    }));

    setUploadingField(null);
    setUploadProgress({});

    if (newUrls.length > 0) {
      showAlert('success', `${newUrls.length} image(s) uploaded!`);
    }
  };

  // ─── DRAG AND DROP REORDERING ───
  const handleDragStart = (fieldName: string, index: number) => {
    setDraggedImage({ field: fieldName, index });
  };

  const handleDragOver = (e: React.DragEvent, fieldName: string) => {
    e.preventDefault();
    setDragOverField(fieldName);
  };

  const handleDragLeave = () => {
    setDragOverField(null);
  };

  const handleDrop = (e: React.DragEvent, fieldName: string, dropIndex: number) => {
    e.preventDefault();
    setDragOverField(null);

    if (!draggedImage || draggedImage.field !== fieldName) return;

    const images = [...((formData[fieldName] as string[]) || [])];
    const [moved] = images.splice(draggedImage.index, 1);
    images.splice(dropIndex, 0, moved);

    setFormData(prev => ({ ...prev, [fieldName]: images }));
    setDraggedImage(null);
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDragOverField(null);
  };

  const removeImage = (fieldName: string, index: number) => {
    const images = (formData[fieldName] as string[]) || [];
    const updated = images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [fieldName]: updated }));
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
        const isImageArray = field.name.toLowerCase().includes('image');

        if (isImageArray) {
          const images = (formData[field.name] as string[]) || [];
          const isDragOver = dragOverField === field.name;

          return (
            <div
              className={`multi-image-field ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, field.name)}
              onDragLeave={handleDragLeave}
            >
              {/* Draggable Image Grid */}
              {images.length > 0 && (
                <div className="image-grid">
                  {images.map((url, idx) => (
                    <div
                      key={`${field.name}-${idx}`}
                      className={`image-grid-item ${draggedImage?.field === field.name && draggedImage?.index === idx ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(field.name, idx)}
                      onDragEnd={handleDragEnd}
                      onDrop={e => handleDrop(e, field.name, idx)}
                    >
                      <div className="drag-handle">
                        <FaGripVertical />
                      </div>
                      <img src={url} alt={`Image ${idx + 1}`} />
                      <button
                        type="button"
                        className="image-remove-btn"
                        onClick={() => removeImage(field.name, idx)}
                        title="Remove image"
                      >
                        <FaTimes />
                      </button>
                      <span className="image-order-badge">{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div className="image-drop-zone">
                  <FaImage size={32} color="var(--text-light)" />
                  <p>No images yet. Upload some below.</p>
                </div>
              )}

              {/* Upload Controls */}
              <div className="multi-upload-controls">
                <input
                  className="form-input"
                  type="text"
                  value={Array.isArray(value) ? value.join(', ') : String(value)}
                  onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Or paste image URLs (comma separated)"
                />
                <span className="upload-or">— OR —</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={el => { fileInputRefs.current[field.name] = el; }}
                  style={{ display: 'none' }}
                  onChange={e => {
                    const files = e.target.files;
                    if (files) handleMultiUpload(field.name, files);
                  }}
                />
                <button
                  type="button"
                  className="btn-admin btn-select"
                  onClick={() => fileInputRefs.current[field.name]?.click()}
                  disabled={uploadingField === field.name}
                >
                  <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>
                    <FaUpload />
                  </span>
                  {uploadingField === field.name ? 'Uploading...' : 'Upload Multiple Images'}
                </button>
              </div>

              {/* Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="upload-progress">
                  {Object.entries(uploadProgress).map(([key, progress]) => (
                    <div key={key} className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return <input className="form-input" value={Array.isArray(value) ? value.join(', ') : String(value)} onChange={e => onChange(e.target.value.split(',').map(s => s.trim()))} placeholder={`${field.label} (comma separated)`} />;

      case 'select':
        return (
          <select className="form-input" value={String(value)} onChange={e => onChange(e.target.value)}>
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'image':
        return (
          <div className="image-upload-field">
            {value && (
              <div className="image-preview">
                <img src={String(value)} alt="Preview" />
                <button type="button" className="btn-remove-image" onClick={() => onChange('')}>
                  <FaTimes />
                </button>
              </div>
            )}
            <div className="image-upload-controls">
              <input className="form-input" type="text" value={String(value)} onChange={e => onChange(e.target.value)} placeholder="Paste image URL" />
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
                <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>
                  <FaImage />
                </span>
                {uploadingField === field.name ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
          </div>
        );

      default:
        return <input className="form-input" type="text" value={String(value)} onChange={e => onChange(e.target.value)} placeholder={field.label} required={field.required} />;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        isModalOpen && setIsModalOpen(false);
        previewItem && setPreviewItem(null)
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsModalOpen, isModalOpen, setPreviewItem, previewItem]);

  if (error && !contentType) {
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
              <button className="btn-admin btn-delete-confirm" disabled={selectedIds.size === 0} onClick={handleBulkDelete}>
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
                {typeName === 'theme' && !isDeleteMode && (
                  <th>Preview</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className={isDeleteMode && selectedIds.has(item._id) ? 'selected-row' : ''}>
                  {isDeleteMode && (
                    <td><input type="checkbox" checked={selectedIds.has(item._id)} onChange={() => toggleSelection(item._id)} /></td>
                  )}
                  {contentType.fields.map(f => (
                    <td key={f.name}>
                      {f.type === 'boolean' ? (item.data[f.name] ? '✅' : '❌') :
                        f.type === 'array' && f.name.toLowerCase().includes('image') ? (
                          <div className="table-image-stack">
                            {((item.data[f.name] as string[]) || []).slice(0, 3).map((url, i) => (
                              <img key={i} src={url} alt="" className="table-thumb" style={{ marginLeft: i > 0 ? -12 : 0, zIndex: 3 - i }} />
                            ))}
                            {((item.data[f.name] as string[]) || []).length > 3 && (
                              <span className="table-more-images">+{((item.data[f.name] as string[]) || []).length - 3}</span>
                            )}
                          </div>
                        ) :
                          f.type === 'array' ? (item.data[f.name] as string[])?.join(', ') :
                            f.type === 'image' && item.data[f.name] ? (
                              <img src={String(item.data[f.name])} alt="" className="table-thumb" />
                            ) :
                              f.type === 'select' ? (
                                <span className="tag">{String(item.data[f.name] || '-')}</span>
                              ) :
                                String(item.data[f.name] ?? '-')}
                    </td>
                  ))}
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                  <td>
                    {!isDeleteMode && (
                      <>
                        <button className="btn-edit-card" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn-delete-small" onClick={() => handleDelete(item._id)}>Delete</button>
                      </>
                    )}
                  </td>
                  {typeName === 'theme' && !isDeleteMode && (
                    <td>
                      <button
                        className="btn-edit-card"
                        onClick={() => setPreviewItem(item)}
                      >
                        👁️ Preview
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
      {/* Preview Modal */}
      {previewItem && typeName === 'theme' && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👁️ Preview: {String(previewItem.data.title || previewItem.data.name || 'Theme')}</h2>
              <button className="modal-close" onClick={() => setPreviewItem(null)}>×</button>
            </div>
            <ThemePreview previewData={previewItem.data as Record<string, unknown>} />
            <div className="modal-actions">
              <button className="btn-admin btn-cancel" onClick={() => setPreviewItem(null)}>Close</button>
              <button
                className="btn-admin btn-add"
                onClick={() => { setPreviewItem(null); openEdit(previewItem); }}
              >
                Edit This Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}