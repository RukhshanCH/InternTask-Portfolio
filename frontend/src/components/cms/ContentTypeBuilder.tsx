import { useState } from 'react';
import { useCMS } from '../../context/CMSContext';

export default function ContentTypeBuilder() {
  const { contentTypes } = useCMS();
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="cms-dashboard">
      <div className="cms-header">
        <h1 className="cms-page-title">🏗️ Content Types</h1>
      </div>

      {showInfo && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <strong>ℹ️ Content types are now managed in Supabase.</strong>
          <br />
          Your schema is defined directly in Supabase tables. To add new fields, use the Supabase Table Editor.
          <button 
            onClick={() => setShowInfo(false)} 
            style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}

      <div className="content-types-grid">
        {contentTypes.map((ct) => (
          <div key={ct.id} className="content-type-item">
            <div className="ct-header">
              <span className="ct-icon-large">{ct.icon}</span>
              <div className="ct-details">
                <h3>{ct.label}</h3>
                <span className="ct-code">{ct.tableName}</span>
              </div>
            </div>
            <div className="ct-fields-list">
              <span className="ct-field-tag">
                {ct.isSingle ? 'Single' : 'Multiple'} items
              </span>
              <span className="ct-field-tag">
                Table: <small>{ct.tableName}</small>
              </span>
            </div>
            <div className="ct-actions">
              <a 
                href={`https://supabase.com/dashboard/project/_/editor/${ct.tableName}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-admin btn-add"
                style={{ fontSize: '0.85rem' }}
              >
                Open in Supabase →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--gray-warm)', borderRadius: 'var(--radius)' }}>
        <h3 style={{ marginBottom: '1rem' }}>How to add a new content type</h3>
        <ol style={{ lineHeight: 2, color: 'var(--text)' }}>
          <li>Go to <strong>Supabase Dashboard → Table Editor</strong></li>
          <li>Click <strong>New Table</strong> and define your columns</li>
          <li>Add the table to <code>DEFAULT_CONTENT_TYPES</code> in <code>CMSContext.tsx</code></li>
          <li>Add a route in <code>App.tsx</code> sidebar</li>
          <li>Add table config in <code>ContentManager.tsx</code> <code>TABLE_MAP</code></li>
        </ol>
      </div>
    </div>
  );
}