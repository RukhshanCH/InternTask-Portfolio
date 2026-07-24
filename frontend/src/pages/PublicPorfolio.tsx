// ============================================
// pages/PublicPortfolio.tsx — Public Portfolio View
// No auth required. Reads slug from URL.
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPortfolio, getWhatsAppLink } from '../utils/supabase';
import type { PortfolioData } from '../utils/supabase';

export default function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, [slug]);

  async function loadPortfolio() {
    if (!slug) return;
    setLoading(true);
    setError(null);

    const portfolioData = await getPublicPortfolio(slug);
    if (!portfolioData) {
      setError('Portfolio not found or not published.');
    } else {
      setData(portfolioData);
      // Apply theme CSS variables
      if (portfolioData.theme) {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', portfolioData.theme.color_primary);
        root.style.setProperty('--color-secondary', portfolioData.theme.color_secondary);
        root.style.setProperty('--color-text', portfolioData.theme.color_text);
        root.style.setProperty('--color-text-muted', portfolioData.theme.color_text_muted);
        root.style.setProperty('--color-success', portfolioData.theme.color_success);
        root.style.setProperty('--color-warning', portfolioData.theme.color_warning);
        root.style.setProperty('--color-danger', portfolioData.theme.color_danger);
        root.style.setProperty('--color-featured', portfolioData.theme.color_featured);
        root.style.setProperty('--border-radius', `${portfolioData.theme.border_radius}px`);
        root.style.setProperty('--max-width', `${portfolioData.theme.max_width}px`);
      }
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={styles.loader}>
        <div className="spinner" />
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.loader}>
        <h2 style={styles.errorTitle}>Portfolio Not Found</h2>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  const { portfolio, theme, hero, about, skills, projects, contact, settings } = data;

  return (
    <div style={{
      ...styles.container,
      fontFamily: theme?.font_family || 'system-ui',
      color: theme?.color_text || '#334155',
    }}>
      {/* Site Title */}
      <title>{settings?.site_title || portfolio?.title || 'Portfolio'}</title>

      {/* HERO SECTION */}
      {hero && (
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <p style={styles.greeting}>{hero.greeting || 'Hello, I am'}</p>
            <h1 style={styles.heroName}>{hero.name}</h1>
            <h2 style={styles.heroHeadline}>{hero.headline}</h2>
            <p style={styles.heroSub}>{hero.subheadline}</p>
            {hero.cta_text && (
              <a href={hero.cta_link || '#contact'} style={styles.ctaButton}>
                {hero.cta_text}
              </a>
            )}
          </div>
          {hero.image_url && (
            <img src={hero.image_url} alt={hero.name} style={styles.heroImage} />
          )}
        </section>
      )}

      {/* ABOUT SECTION */}
      {about && (
        <section style={styles.section} id="about">
          <h2 style={styles.sectionTitle}>{about.title || 'About Me'}</h2>
          <div style={styles.aboutContent}>
            {about.image_url && (
              <img src={about.image_url} alt="About" style={styles.aboutImage} />
            )}
            <div>
              <p style={styles.aboutText}>{about.content}</p>
              {about.details && about.details.length > 0 && (
                <div style={styles.detailsGrid}>
                  {about.details.map((detail, i) => (
                    <div key={i} style={styles.detailItem}>
                      <span style={styles.detailLabel}>{detail.label}</span>
                      <span style={styles.detailValue}>{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SKILLS SECTION */}
      {skills.length > 0 && (
        <section style={styles.section} id="skills">
          <h2 style={styles.sectionTitle}>Skills</h2>
          <div style={styles.skillsGrid}>
            {skills.map((skill) => (
              <div key={skill.id} style={styles.skillCard}>
                <span style={styles.skillName}>{skill.name}</span>
                <div style={styles.skillBar}>
                  <div 
                    style={{
                      ...styles.skillFill,
                      width: `${skill.proficiency}%`,
                      background: skill.color || 'var(--color-primary, #3b82f6)',
                    }} 
                  />
                </div>
                <span style={styles.skillPercent}>{skill.proficiency}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROJECTS SECTION */}
      {projects.length > 0 && (
        <section style={styles.section} id="projects">
          <h2 style={styles.sectionTitle}>Projects</h2>
          <div style={styles.projectsGrid}>
            {projects.map((project) => (
              <div key={project.id} style={styles.projectCard}>
                {project.thumbnail_url && (
                  <img src={project.thumbnail_url} alt={project.title} style={styles.projectImage} />
                )}
                <div style={styles.projectInfo}>
                  <h3 style={styles.projectTitle}>{project.title}</h3>
                  <p style={styles.projectDesc}>{project.description}</p>
                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div style={styles.techStack}>
                      {project.tech_stack.map((tech, i) => (
                        <span key={i} style={styles.techTag}>{tech}</span>
                      ))}
                    </div>
                  )}
                  <div style={styles.projectLinks}>
                    {project.live_url && (
                      <a href={project.live_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                        Live Demo →
                      </a>
                    )}
                    {project.repo_url && (
                      <a href={project.repo_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                        GitHub →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CONTACT SECTION */}
      {contact && (
        <section style={styles.section} id="contact">
          <h2 style={styles.sectionTitle}>{contact.email ? 'Get In Touch' : 'Contact'}</h2>
          <div style={styles.contactGrid}>
            <div style={styles.contactInfo}>
              {contact.email && (
                <p style={styles.contactItem}>📧 {contact.email}</p>
              )}
              {contact.phone && (
                <p style={styles.contactItem}>📞 {contact.phone}</p>
              )}
              {contact.location && (
                <p style={styles.contactItem}>📍 {contact.location}</p>
              )}
              {contact.whatsapp_number && (
                <a 
                  href={getWhatsAppLink(contact.whatsapp_number, contact.whatsapp_default_message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.whatsappBtn}
                >
                  💬 Message on WhatsApp
                </a>
              )}
            </div>

            {contact.form_enabled && (
              <ContactForm portfolioId={portfolio!.id} />
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © {new Date().getFullYear()} {portfolio?.title}. Built with Portfolio CMS.
        </p>
      </footer>
    </div>
  );
}

// Contact Form Component
function ContactForm({ portfolioId }: { portfolioId: string }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { submitContactForm } = await import('../utils/supabase');
    await submitContactForm(portfolioId, formData.name, formData.email, formData.message, formData.subject);
    setSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  }

  if (submitted) {
    return (
      <div style={styles.successMessage}>
        <p>✅ Thank you! Your message has been sent.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.contactForm}>
      <input
        placeholder="Your Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        style={styles.formInput}
      />
      <input
        type="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        style={styles.formInput}
      />
      <input
        placeholder="Subject (optional)"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        style={styles.formInput}
      />
      <textarea
        placeholder="Your Message"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        required
        rows={5}
        style={{ ...styles.formInput, resize: 'vertical' }}
      />
      <button type="submit" disabled={submitting} style={styles.submitButton}>
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loader: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text-muted, #94a3b8)',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ef4444',
    margin: '0 0 8px 0',
  },
  errorText: {
    color: 'var(--color-text-muted, #94a3b8)',
  },
  container: {
    minHeight: '100vh',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '80vh',
    gap: '48px',
    padding: '60px 0',
  },
  heroContent: {
    flex: 1,
  },
  greeting: {
    fontSize: '18px',
    color: 'var(--color-primary, #3b82f6)',
    fontWeight: 500,
    margin: '0 0 12px 0',
  },
  heroName: {
    fontSize: '56px',
    fontWeight: 800,
    margin: '0 0 16px 0',
    lineHeight: 1.1,
  },
  heroHeadline: {
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--color-text-muted, #64748b)',
    margin: '0 0 20px 0',
  },
  heroSub: {
    fontSize: '17px',
    lineHeight: 1.7,
    color: 'var(--color-text-muted, #64748b)',
    margin: '0 0 32px 0',
    maxWidth: '500px',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '14px 32px',
    borderRadius: '12px',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 600,
  },
  heroImage: {
    width: '380px',
    height: '380px',
    objectFit: 'cover',
    borderRadius: '24px',
  },
  section: {
    padding: '80px 0',
    borderTop: '1px solid var(--color-gray, #e2e8f0)',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: 700,
    margin: '0 0 40px 0',
    textAlign: 'center',
  },
  aboutContent: {
    display: 'flex',
    gap: '48px',
    alignItems: 'flex-start',
  },
  aboutImage: {
    width: '300px',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '20px',
    flexShrink: 0,
  },
  aboutText: {
    fontSize: '16px',
    lineHeight: 1.8,
    margin: '0 0 24px 0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '13px',
    color: 'var(--color-text-muted, #64748b)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '15px',
    fontWeight: 600,
  },
  skillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  skillCard: {
    padding: '20px',
    background: 'var(--color-surface, #f8fafc)',
    borderRadius: '12px',
    border: '1px solid var(--color-gray, #e2e8f0)',
  },
  skillName: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '12px',
    display: 'block',
  },
  skillBar: {
    height: '8px',
    background: 'var(--color-gray, #e2e8f0)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  skillFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s ease',
  },
  skillPercent: {
    fontSize: '13px',
    color: 'var(--color-text-muted, #64748b)',
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  projectCard: {
    background: 'var(--color-surface, #f8fafc)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--color-gray, #e2e8f0)',
  },
  projectImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  projectInfo: {
    padding: '20px',
  },
  projectTitle: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  projectDesc: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--color-text-muted, #64748b)',
    margin: '0 0 16px 0',
  },
  techStack: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
  },
  techTag: {
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 500,
  },
  projectLinks: {
    display: 'flex',
    gap: '16px',
  },
  link: {
    color: 'var(--color-primary, #3b82f6)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  contactItem: {
    fontSize: '16px',
    margin: 0,
  },
  whatsappBtn: {
    display: 'inline-block',
    padding: '12px 24px',
    borderRadius: '10px',
    background: '#22c55e',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '8px',
  },
  contactForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formInput: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #e2e8f0)',
    background: 'var(--color-surface, #f8fafc)',
    fontSize: '15px',
    outline: 'none',
  },
  submitButton: {
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  successMessage: {
    padding: '40px',
    textAlign: 'center',
    background: 'rgba(34,197,94,0.1)',
    borderRadius: '12px',
    color: '#22c55e',
    fontSize: '16px',
    fontWeight: 500,
  },
  footer: {
    padding: '40px 0',
    textAlign: 'center',
    borderTop: '1px solid var(--color-gray, #e2e8f0)',
  },
  footerText: {
    fontSize: '14px',
    color: 'var(--color-text-muted, #64748b)',
    margin: 0,
  },
};