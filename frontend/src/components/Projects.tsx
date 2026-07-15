import { useEffect, useState } from 'react';
import type { ContentItem } from '../index';

const API_URL = 'http://localhost:3001/api/content/project?status=published&sort=order';

export default function Projects() {
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ContentItem[]) => {
        console.log('Projects loaded:', data.length, data);
        setProjects(data);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="projects section">
        <div className="container">
          <p className="loading-text">Loading projects...</p>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section id="projects" className="projects section">
        <div className="container">
          <h2 className="section-title">Featured Projects</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>
            No projects yet.{' '}
            <a href="/admin/content/project" style={{ color: 'var(--primary)' }}>
              Add some in the admin panel
            </a>
            .
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="projects section">
      <div className="container">
        <h2 className="section-title">Featured Projects</h2>
        <div className="projects-grid">
          {projects.map((project, index) => {
            const d = project.data as Record<string, unknown>;

            // FIX: Check both camelCase and lowercase due to DB mismatch
            const title = String(d.title || 'Untitled');
            const description = String(d.description || '');
            const technologies = (d.technologies as string[]) || [];
            const imageUrl = d.imageUrl ? String(d.imageUrl) : d.imageurl ? String(d.imageurl) : null;
            const liveUrl = d.liveUrl ? String(d.liveUrl) : d.liveurl ? String(d.liveurl) : null;
            const githubUrl = d.githubUrl ? String(d.githubUrl) : d.githuburl ? String(d.githuburl) : null;

            return (
              <article key={project._id} className="project-card">
                <div className="project-image">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show placeholder on error
                        const placeholder = document.createElement('div');
                        placeholder.className = 'image-placeholder';
                        placeholder.innerHTML = `<span>Project ${index + 1}</span>`;
                        target.parentElement?.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <div className="image-placeholder">
                      <span>Project {index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="project-content">
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className="project-tags">
                    {technologies.map((tag: string, idx: number) => (
                      <span key={idx} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="project-links">
                    {liveUrl && (
                      <a
                        href={liveUrl}
                        className="link-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Live Demo →
                      </a>
                    )}
                    {githubUrl && (
                      <a
                        href={githubUrl}
                        className="link-secondary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}