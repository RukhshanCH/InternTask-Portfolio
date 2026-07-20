import { useState } from 'react';
import type { ContentItem } from '../index';
import { FaEnvelope, FaLinkedin, FaGithub, FaPhone, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa';

interface ContactProps {
  data?: ContentItem | null;
}

export default function Contact({ data: contactProp }: ContactProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thanks for reaching out! (Demo only)');
    setFormData({ name: '', email: '', message: '' });
  };

  const d = (contactProp?.data as Record<string, unknown>) || {};

  const heading = String(d.heading || 'Get In Touch');
  const subheading = String(d.subheading || "Have a project in mind? Let's work together.");
  const email = d.email ? String(d.email) : undefined;
  const phone = d.phone ? String(d.phone) : undefined;
  const location = d.location ? String(d.location) : undefined;
  const github = d.github ? String(d.github) : undefined;
  const linkedin = d.linkedin ? String(d.linkedin) : undefined;
  const whatsapp = d.whatsapp ? String(d.whatsapp) : undefined;
  const formEnabled = d.formEnabled !== false;
  const WHATSAPP_MSG = d.whatsappMessage ? String(d.whatsappMessage) : 'Hello!';

  const socials = [
    { url: github, icon: <FaGithub size={20} />, label: 'GitHub', title: 'GitHub' },
    { url: linkedin, icon: <FaLinkedin size={20} />, label: 'LinkedIn', title: 'LinkedIn' },
    {
      url: whatsapp
        ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MSG)}`
        : undefined,
      icon: <FaWhatsapp size={20} />,
      label: 'WhatsApp',
      title: 'WhatsApp',
    },
  ].filter((s) => s.url);

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