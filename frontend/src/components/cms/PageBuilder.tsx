import { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import type { ContentItem, CMSPage } from '../../index';

interface PageSection {
  contentType: string;
  contentId: string;
  order: number;
}

export default function PageBuilder() {
  const { contentTypes, getContent } = useCMS();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [route, setRoute] = useState('');
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [availableContent, setAvailableContent] = useState<Record<string, ContentItem[]>>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        isModalOpen && setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsModalOpen, isModalOpen]);

  const loadPages = async () => {
    const res = await fetch('http://localhost:3001/api/pages');
    const data = await res.json();
    setPages(data);
  };

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3500);
  };

  const resetForm = () => {
    setRoute('');
    setTitle('');
    setMetaDescription('');
    setSections([]);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (page: CMSPage) => {
    setEditingId(page._id);
    setRoute(page.route);
    setTitle(page.title);
    setMetaDescription(page.metaDescription || '');
    setSections(page.sections.map((s) => ({ ...s })));
    setIsModalOpen(true);
  };

  const loadContentForType = async (contentType: string) => {
    if (availableContent[contentType]) return;
    try {
      const items = await getContent(contentType);
      setAvailableContent((prev) => ({ ...prev, [contentType]: items }));
    } catch {
      // type might not exist
    }
  };

  const addSection = () => {
    setSections([...sections, { contentType: '', contentId: '', order: sections.length }]);
  };

  const updateSection = (index: number, key: keyof PageSection, value: string | number) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [key]: value };
    if (key === 'contentType') {
      updated[index].contentId = '';
      loadContentForType(value as string);
    }
    setSections(updated);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!route.trim() || !title.trim()) {
      showAlert('error', 'Route and title are required');
      return;
    }

    const payload = {
      route: route.startsWith('/') ? route : `/${route}`,
      title,
      metaDescription,
      sections: sections.filter((s) => s.contentType && s.contentId),
      isActive: true,
    };

    try {
      const url = editingId
        ? `http://localhost:3001/api/pages/${editingId}`
        : 'http://localhost:3001/api/pages';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');

      showAlert('success', editingId ? 'Page updated!' : 'Page created!');
      setIsModalOpen(false);
      resetForm();
      await loadPages();
    } catch (err) {
      showAlert('error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await fetch(`http://localhost:3001/api/pages/${id}`, { method: 'DELETE' });
      showAlert('success', 'Page deleted!');
      await loadPages();
    } catch {
      showAlert('error', 'Failed to delete');
    }
  };

  return (
    <div className="cms-page-builder">
      <div className="cms-header">
        <h1>📄 Pages</h1>
        <button className="btn-admin btn-add" onClick={openAdd}>+ Create Page</button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

      {pages.length === 0 ? (
        <p className="empty-state">No pages yet. Create one!</p>
      ) : (
        <div className="pages-list">
          {pages.map((page) => (
            <div key={page._id} className="page-card">
              <div className="page-info">
                <h3>{page.title}</h3>
                <code className="page-route">{page.route}</code>
                <div className="page-sections-count">{page.sections.length} section(s)</div>
              </div>
              <div className="page-actions">
                <a href={page.route} target="_blank" rel="noreferrer" className="btn-edit-card">
                  View
                </a>
                <button className="btn-edit-card" onClick={() => openEdit(page)}>Edit</button>
                <button className="btn-delete-small" onClick={() => handleDelete(page._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>{editingId ? 'Edit' : 'Create'} Page</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Route *</label>
                  <input
                    className="form-input"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="e.g., /about or /portfolio"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Page Title *</label>
                  <input
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., About Me"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Meta Description</label>
                <input
                  className="form-input"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO description"
                />
              </div>

              <div className="fields-section">
                <div className="fields-header">
                  <h3>Sections</h3>
                  <button type="button" className="btn-admin btn-add" onClick={addSection}>+ Add Section</button>
                </div>

                {sections.map((section, index) => (
                  <div key={index} className="section-row">
                    <select
                      className="form-input"
                      value={section.contentType}
                      onChange={(e) => updateSection(index, 'contentType', e.target.value)}
                    >
                      <option value="">Select content type</option>
                      {contentTypes.map((ct) => (
                        <option key={ct._id} value={ct.name}>{ct.icon} {ct.label}</option>
                      ))}
                    </select>

                    <select
                      className="form-input"
                      value={section.contentId}
                      onChange={(e) => updateSection(index, 'contentId', e.target.value)}
                      disabled={!section.contentType}
                    >
                      <option value="">Select content</option>
                      {(availableContent[section.contentType] || []).map((item) => (
                        <option key={item._id} value={item._id}>
                          {String(item.data.title || item._id)}
                        </option>
                      ))}
                    </select>

                    <input
                      className="form-input"
                      type="number"
                      value={section.order}
                      onChange={(e) => updateSection(index, 'order', Number(e.target.value))}
                      placeholder="Order"
                      style={{ width: '80px' }}
                    />

                    <button type="button" className="btn-delete-small" onClick={() => removeSection(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-admin btn-cancel" onClick={() => setIsModalOpen(false)}>
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