import { useState, type JSX } from 'react';
import type { ContentItem } from '../index';
import { FaEnvelope, FaLinkedin, FaPhone, FaMapMarkerAlt, FaWhatsapp, FaInstagram, FaFacebook, FaReddit, FaGithub, FaTwitter, FaYoutube, FaDribbble } from 'react-icons/fa';

// ─── TYPES ───

// Supabase flat schema (snake_case) — individual link fields like projects
export interface SupabaseContact {
  id: string;
  heading?: string;
  description?: string;
  email?: string;
  phone?: string;
  location?: string;
  whatsapp_number?: string;
  whatsapp_message?: string;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  reddit_url?: string;
  youtube_url?: string;
  dribbble_url?: string;
  behance_url?: string;
  form_enabled?: boolean;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
  [key: string]: unknown;
}

interface ContactProps {
  data?: ContentItem | SupabaseContact | null;
}

// ─── HELPER: Normalize contact data ───
function normalizeContactData(item: ContentItem | SupabaseContact | null | undefined): Record<string, unknown> | null {
  if (!item) return null;

  // If it has a `data` property → legacy ContentItem wrapper
  if ('data' in item && item.data && typeof item.data === 'object') {
    return item.data as Record<string, unknown>;
  }

  // Otherwise → flat Supabase object
  return item as Record<string, unknown>;
}

// ─── COMPONENT ───

export default function Contact({ data: contactProp }: ContactProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thanks for reaching out! (Demo only)');
    setFormData({ name: '', email: '', message: '' });
  };

  const d = normalizeContactData(contactProp) || {};

  const heading = String(d.heading || 'Get In Touch');
  const subheading = String(
    d.description || d.subheading || "Have a project in mind? Let's work together."
  );

  // Contact details
  const email = d.email ? String(d.email) : undefined;
  const phone = d.phone ? String(d.phone) : undefined;
  const location = d.location ? String(d.location) : undefined;

  // WhatsApp: support both snake_case and camelCase
  const whatsappNumber = d.whatsapp_number
    ? String(d.whatsapp_number)
    : d.whatsapp
      ? String(d.whatsapp)
      : undefined;

  const WHATSAPP_MSG = d.whatsapp_message
    ? String(d.whatsapp_message)
    : d.whatsappMessage
      ? String(d.whatsappMessage)
      : 'Hello!';

  // Form toggle: support both snake_case and camelCase
  const formEnabled = d.form_enabled !== false && d.formEnabled !== false;

  // Social links — individual fields like projects (snake_case + camelCase fallback)
  const socials = [
    {
      url: d.linkedin_url ? String(d.linkedin_url) : d.linkedin ? String(d.linkedin) : undefined,
      icon: <FaLinkedin size={20} />,
      label: 'LinkedIn',
      title: 'LinkedIn',
    },
    {
      url: d.github_url ? String(d.github_url) : d.github ? String(d.github) : undefined,
      icon: <FaGithub size={20} />,
      label: 'GitHub',
      title: 'GitHub',
    },
    {
      url: d.twitter_url ? String(d.twitter_url) : d.twitter ? String(d.twitter) : undefined,
      icon: <FaTwitter size={20} />,
      label: 'Twitter',
      title: 'Twitter',
    },
    {
      url: d.instagram_url ? String(d.instagram_url) : d.instagram ? String(d.instagram) : undefined,
      icon: <FaInstagram size={20} />,
      label: 'Instagram',
      title: 'Instagram',
    },
    {
      url: d.facebook_url ? String(d.facebook_url) : d.facebook ? String(d.facebook) : undefined,
      icon: <FaFacebook size={20} />,
      label: 'Facebook',
      title: 'Facebook',
    },
    {
      url: d.reddit_url ? String(d.reddit_url) : d.reddit ? String(d.reddit) : undefined,
      icon: <FaReddit size={20} />,
      label: 'Reddit',
      title: 'Reddit',
    },
    {
      url: d.youtube_url ? String(d.youtube_url) : d.youtube ? String(d.youtube) : undefined,
      icon: <FaYoutube size={20} />,
      label: 'YouTube',
      title: 'YouTube',
    },
    {
      url: d.dribbble_url ? String(d.dribbble_url) : d.dribbble ? String(d.dribbble) : undefined,
      icon: <FaDribbble size={20} />,
      label: 'Dribbble',
      title: 'Dribbble',
    },
    {
      url: d.behance_url ? String(d.behance_url) : d.behance ? String(d.behance) : undefined,
      icon: <FaDribbble size={20} />,
      label: 'Behance',
      title: 'Behance',
    },
    {
      url: whatsappNumber
        ? `https://wa.me/${String(whatsappNumber).replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MSG)}`
        : undefined,
      icon: <FaWhatsapp size={20} />,
      label: 'WhatsApp',
      title: 'WhatsApp',
    },
  ].filter((s): s is { url: string; icon: JSX.Element; label: string; title: string } => !!s.url);

  return (
    <section id="contact" className="contact section">
      <div className="container">
        <h2 className="section-title">{heading}</h2>
        <div className="contact-grid">
          <div className="contact-info">
            <h3>{subheading}</h3>

            <div className="contact-details">
              {email && (
                <a href={`mailto:${email}`} className="contact-detail">
                  <FaEnvelope size={16} />
                  <span>{email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="contact-detail">
                  <FaPhone size={16} />
                  <span>{phone}</span>
                </a>
              )}
              {location && (
                <span className="contact-detail">
                  <FaMapMarkerAlt size={16} />
                  <span>{location}</span>
                </span>
              )}
            </div>

            {socials.length > 0 && (
              <div className="social-links">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.title}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {formEnabled && (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell me about your project..."
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}