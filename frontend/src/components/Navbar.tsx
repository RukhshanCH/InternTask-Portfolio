import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// ─── TYPES ───

interface SupabaseHero {
  id: string;
  greeting?: string;
  title?: string;
  subtitle?: string;
  background_image?: string;
  backgroundImage?: string;
  backgroundimage?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

// ─── COMPONENT ───

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hero, setHero] = useState<SupabaseHero | null>(null);

  // Fetch hero from Supabase
  useEffect(() => {
    const loadHero = async () => {
      const { data, error } = await supabase
        .from('hero')
        .select('*')
        .eq('is_active', true)
        .order('order_index')
        .single();

      if (error) {
        console.error('Navbar hero fetch error:', error);
        return;
      }

      if (data) {
        setHero(data as SupabaseHero);
      }
    };

    loadHero();
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
  ];

  // Support both snake_case (Supabase) and camelCase (legacy)
  const backgroundImage = hero?.background_image
    ? String(hero.background_image)
    : hero?.backgroundImage
      ? String(hero.backgroundImage)
      : hero?.backgroundimage
        ? String(hero.backgroundimage)
        : null;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#" className="nav-logo">Welcome to my Portfolio</a>

        <button
          className="nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileOpen ? 'open' : ''}`}></span>
        </button>

        <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`${backgroundImage ? 'bg-nav' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}