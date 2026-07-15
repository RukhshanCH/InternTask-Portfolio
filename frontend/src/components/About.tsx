import { useEffect, useState } from 'react';
import type { ContentItem } from '../index';

const API_URL = 'http://localhost:3001/api/content/about?status=published';

export default function About() {
  const [about, setAbout] = useState<ContentItem | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((data: ContentItem[]) => setAbout(data[0] || null))
      .catch(() => setAbout(null));
  }, []);

  const d = about?.data as Record<string, unknown> | undefined;

  const heading = String(d?.heading || 'About Me');

  // Prefer 'bio' (textarea with \n\n) over broken 'paragraphs' array
  const rawBio = String(
    d?.bio ||
      (Array.isArray(d?.paragraphs) ? (d.paragraphs as string[]).join('\n\n') : '') ||
      "I'm a passionate developer with 5+ years of experience.\n\nI specialize in React, TypeScript, and Node.js."
  );
  const paragraphs = rawBio.split(/\n\n+/).filter((p) => p.trim().length > 0);

  // FIX: Check both camelCase and lowercase due to DB mismatch
  const imageUrl = d?.imageUrl ? String(d.imageUrl) : d?.imageurl ? String(d.imageurl) : null;

  // Stats parser (pipe-delimited)
  const rawStats = d?.stats;
  let stats: { number: string; label: string }[] = [];
  if (Array.isArray(rawStats)) {
    stats = rawStats.map((s: string) => {
      const parts = String(s).split('|').map((p) => p.trim());
      return { number: parts[0] || '0', label: parts[1] || 'Stat' };
    });
  }
  if (stats.length === 0) {
    stats = [
      { number: '5+', label: 'Years Experience' },
      { number: '50+', label: 'Projects Completed' },
      { number: '20+', label: 'Happy Clients' },
    ];
  }

  return (
    <section id="about" className="about section">
      <div className="container">
        <h2 className="section-title">{heading}</h2>
        <div className="about-grid">
          <div className="about-image">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={heading}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius)', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="image-placeholder">Image failed to load</div>';
                }}
              />
            ) : (
              <div className="image-placeholder">About Image</div>
            )}
          </div>
          <div className="about-text">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="about-stats">
              {stats.map((stat, i) => (
                <div key={i} className="stat">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}