import type { ContentItem } from '../index';

// ─── TYPES ───

// Supabase flat schema (snake_case)
export interface SupabaseAbout {
  id: string;
  heading?: string;
  bio?: string;
  paragraphs?: string[];
  image_url?: string;
  stats?: { number: string; label: string }[] | string[];
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
  [key: string]: unknown;
}

interface AboutProps {
  data?: ContentItem | SupabaseAbout | null;
}

// ─── HELPER: Normalize about data ───
function normalizeAboutData(item: ContentItem | SupabaseAbout | null | undefined): Record<string, unknown> | null {
  if (!item) return null;

  // If it has a `data` property → legacy ContentItem wrapper
  if ('data' in item && item.data && typeof item.data === 'object') {
    return item.data as Record<string, unknown>;
  }

  // Otherwise → flat Supabase object
  return item as Record<string, unknown>;
}

// ─── HELPER: Parse stats ───
function parseStats(rawStats: unknown): { number: string; label: string }[] {
  if (Array.isArray(rawStats)) {
    // If already objects → return as-is
    if (rawStats.length > 0 && typeof rawStats[0] === 'object' && rawStats[0] !== null) {
      return (rawStats as { number?: string; label?: string }[]).map((s) => ({
        number: String(s.number || '0'),
        label: String(s.label || 'Stat'),
      }));
    }

    // If strings like "5+|Years Experience" → parse
    return rawStats.map((s: string) => {
      const parts = String(s).split('|').map((p) => p.trim());
      return { number: parts[0] || '0', label: parts[1] || 'Stat' };
    });
  }

  return [
    { number: '5+', label: 'Years Experience' },
    { number: '50+', label: 'Projects Completed' },
    { number: '20+', label: 'Happy Clients' },
  ];
}

// ─── COMPONENT ───

export default function About({ data: aboutProp }: AboutProps) {
  const d = normalizeAboutData(aboutProp);

  const heading = String(d?.heading || 'About Me');

  // Bio: support both `bio` (single text) and `paragraphs` (array)
  const rawBio = String(
    d?.bio ||
      (Array.isArray(d?.paragraphs) ? (d.paragraphs as string[]).join('\n\n') : '') ||
      "I'm a passionate developer with 5+ years of experience.\n\nI specialize in React, TypeScript, and Node.js."
  );
  const paragraphs = rawBio.split(/\n\n+/).filter((p) => p.trim().length > 0);

  // Image: support both snake_case and camelCase
  const imageUrl = d?.image_url
    ? String(d.image_url)
    : d?.imageUrl
      ? String(d.imageUrl)
      : d?.imageurl
        ? String(d.imageurl)
        : null;

  // Stats: support both JSONB objects and pipe-delimited strings
  const stats = parseStats(d?.stats);

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