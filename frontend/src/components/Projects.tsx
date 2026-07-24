import { useState, useMemo } from 'react';
import { FaGlobe, FaGithub, FaInstagram, FaFacebook, FaPalette, FaLinkedin, FaComment } from 'react-icons/fa';
import type { ContentItem } from '../index';
import ImageCarousel from './Carousel';

// ─── TYPES ───

// Supabase flat schema (snake_case)
export interface SupabaseProject {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  images?: string[];
  tags?: string[];
  technologies?: string[];
  category?: string;
  github_url?: string;
  live_url?: string;
  insta_url?: string;
  fb_url?: string;
  behance_url?: string;
  linkedin_url?: string;
  reddit_url?: string;
  is_active?: boolean;
  featured?: boolean;
  order_index?: number;
  created_at?: string;
  [key: string]: unknown;
}

// ─── HELPER: Normalize any project format → flat object ───
function normalizeProjectData(item: ContentItem | SupabaseProject | null): Record<string, unknown> | null {
  if (!item) return null;

  // If it has a `data` property → legacy ContentItem wrapper
  if ('data' in item && item.data && typeof item.data === 'object') {
    return item.data as Record<string, unknown>;
  }

  // Otherwise → flat Supabase object (or already flat)
  return item as Record<string, unknown>;
}

// ─── PROPS ───

interface ProjectsProps {
  items?: (ContentItem | SupabaseProject | null)[];
}

export default function Projects({ items = [] }: ProjectsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Normalize all items to flat data objects
  const normalizedItems = useMemo(() => {
    return items
      .map(normalizeProjectData)
      .filter((d): d is Record<string, unknown> => d !== null);
  }, [items]);

  // Extract categories from normalized data
  const categories = useMemo(() => {
    const set = new Set<string>();
    normalizedItems.forEach((d) => {
      const cat = String(d.category || '').trim();
      if (cat) set.add(cat);
    });
    return ['All', ...Array.from(set).sort()];
  }, [normalizedItems]);

  // Filter projects
  const filtered = useMemo(() => {
    let result = normalizedItems;

    if (activeCategory !== 'All') {
      result = result.filter((d) => {
        const cat = String(d.category || '').trim();
        return cat === activeCategory;
      });
    }

    if (showFeaturedOnly) {
      result = result.filter((d) => Boolean(d.featured));
    }

    return result;
  }, [normalizedItems, activeCategory, showFeaturedOnly]);

  if (normalizedItems.length === 0) {
    return (
      <section id="projects" className="projects section">
        <div className="container">
          <h2 className="section-title">Featured Projects</h2>
          <p className="empty-state">
            No projects yet.{' '}
            <a href="/admin/content/project">
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

        <div className="project-filters-bar">
          <div className="project-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className={`featured-toggle ${showFeaturedOnly ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
            />
            <span>⭐ Featured Only</span>
          </label>
        </div>

        <div className="projects-grid">
          {filtered.map((d, index) => {
            const id = String(d.id || index);
            const title = String(d.title || 'Untitled');
            const description = String(d.description || '');
            const technologies = (d.technologies as string[]) || (d.tags as string[]) || [];
            const category = String(d.category || '');
            const isFeatured = Boolean(d.featured);

            // Images: support both `images` array and legacy `imageUrl` / `imageurl`
            let images: string[] = [];
            if (d.images && Array.isArray(d.images)) {
              images = d.images as string[];
            } else if (d.image_url) {
              images = [String(d.image_url)];
            } else if (d.imageUrl) {
              images = [String(d.imageUrl)];
            } else if (d.imageurl) {
              images = [String(d.imageurl)];
            }

            // Links: support both snake_case (Supabase) and camelCase (legacy)
            const liveUrl = d.live_url ? String(d.live_url) : d.liveUrl ? String(d.liveUrl) : null;
            const githubUrl = d.github_url ? String(d.github_url) : d.githubUrl ? String(d.githubUrl) : null;
            const instaUrl = d.insta_url ? String(d.insta_url) : d.instaUrl ? String(d.instaUrl) : null;
            const fbUrl = d.fb_url ? String(d.fb_url) : d.fbUrl ? String(d.fbUrl) : null;
            const behanceUrl = d.behance_url ? String(d.behance_url) : d.behanceUrl ? String(d.behanceUrl) : null;
            const linkedinUrl = d.linkedin_url ? String(d.linkedin_url) : d.linkedinUrl ? String(d.linkedinUrl) : null;
            const redditUrl = d.reddit_url ? String(d.reddit_url) : d.redditUrl ? String(d.redditUrl) : null;

            return (
              <article key={id} className={`project-card ${isFeatured ? 'project-featured' : ''}`}>
                <div className="project-image">
                  <ImageCarousel images={images} title={title} index={index} />

                  <div className="project-badges">
                    {isFeatured && <span className="featured-badge">⭐ Featured</span>}
                    {category && <span className="project-category-badge">{category}</span>}
                  </div>
                </div>

                <div className="project-content">
                  <h3>{title}</h3>
                  <p>{description}</p>

                  <div className="project-tags">
                    {technologies.map((tag: string, idx: number) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>

                  <div className="project-links">
                    {liveUrl && (
                      <a href={liveUrl} className="link-primary" target="_blank" rel="noreferrer" title="Live Demo">
                        <FaGlobe size={18} />
                      </a>
                    )}
                    {githubUrl && (
                      <a href={githubUrl} className="link-secondary" target="_blank" rel="noreferrer" title="GitHub">
                        <FaGithub size={18} />
                      </a>
                    )}
                    {instaUrl && (
                      <a href={instaUrl} className="link-secondary" target="_blank" rel="noreferrer" title="Instagram">
                        <FaInstagram size={18} />
                      </a>
                    )}
                    {fbUrl && (
                      <a href={fbUrl} className="link-secondary" target="_blank" rel="noreferrer" title="Facebook">
                        <FaFacebook size={18} />
                      </a>
                    )}
                    {behanceUrl && (
                      <a href={behanceUrl} className="link-secondary" target="_blank" rel="noreferrer" title="Behance">
                        <FaPalette size={18} />
                      </a>
                    )}
                    {linkedinUrl && (
                      <a href={linkedinUrl} className="link-secondary" target="_blank" rel="noreferrer" title="LinkedIn">
                        <FaLinkedin size={18} />
                      </a>
                    )}
                    {redditUrl && (
                      <a href={redditUrl} className="link-secondary" target="_blank" rel="noreferrer" title="Reddit">
                        <FaComment size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="empty-state" style={{ marginTop: '2rem' }}>
            {showFeaturedOnly && activeCategory !== 'All'
              ? <>No featured projects in <strong>{activeCategory}</strong>.</>
              : showFeaturedOnly
                ? 'No featured projects yet.'
                : <>No projects in <strong>{activeCategory}</strong>.</>}
          </p>
        )}
      </div>
    </section>
  );
}