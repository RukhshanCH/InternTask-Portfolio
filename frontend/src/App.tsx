// ============================================
// App.tsx — Supabase Version (All Sections Active)
// Replaces localhost:3001 API calls with Supabase client
// ============================================

import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './utils/supabase';
import { CMSProvider } from './context/CMSContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import AdminDashboard from './components/cms/AdminDashboard';
import ContentManager from './components/cms/ContentManager';
import ContentTypeBuilder from './components/cms/ContentTypeBuilder';
import PageBuilder from './components/cms/PageBuilder';
import Loader from './components/Loader';
import './App.css';

// ─── THEME CONTEXT ───

export interface Theme {
  id: string;
  name: string;
  slug: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_accent_soft: string;
  color_accent_bg: string;
  color_dark: string;
  color_light: string;
  color_gray: string;
  color_gray_warm: string;
  color_text: string;
  color_text_muted: string;
  color_success: string;
  color_warning: string;
  color_danger: string;
  color_featured: string;
  border_radius: number;
  max_width: number;
  font_family: string;
  gradient_direction: string;
  card_style: string;
  button_style: string;
  enable_animations: boolean;
  dark_mode: boolean;
  is_active: boolean;
  is_featured: boolean;
  order_index: number;
}

interface ThemeContextType {
  theme: Theme | null;
  loading: boolean;
  refreshTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  loading: true,
  refreshTheme: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ─── CSS VARIABLES INJECTOR ───

function applyThemeVariables(theme: Theme | null) {
  if (!theme) return;

  const root = document.documentElement;

  // ─── Core Colors ───
  root.style.setProperty('--primary', theme.color_primary);
  root.style.setProperty('--primary-dark', theme.color_primary); // fallback to primary
  root.style.setProperty('--secondary', theme.color_secondary);
  root.style.setProperty('--accent', theme.color_accent);
  root.style.setProperty('--accent-light', `color-mix(in srgb, ${theme.color_accent} 30%, transparent)`);
  root.style.setProperty('--accent-soft', theme.color_accent_soft);
  root.style.setProperty('--accent-bg', theme.color_accent_bg);
  root.style.setProperty('--dark', theme.color_dark);
  root.style.setProperty('--light', theme.color_light);
  root.style.setProperty('--gray', theme.color_gray);
  root.style.setProperty('--gray-warm', theme.color_gray_warm);
  root.style.setProperty('--text', theme.color_text);
  root.style.setProperty('--text-light', theme.color_text_muted);

  // ─── Semantic Colors ───
  root.style.setProperty('--success', theme.color_success);
  root.style.setProperty('--success-bg', `color-mix(in srgb, ${theme.color_success} 10%, white)`);
  root.style.setProperty('--success-text', theme.color_success);
  root.style.setProperty('--success-border', `color-mix(in srgb, ${theme.color_success} 30%, white)`);
  root.style.setProperty('--warning', theme.color_warning);
  root.style.setProperty('--warning-dark', theme.color_warning);
  root.style.setProperty('--warning-bg', `color-mix(in srgb, ${theme.color_warning} 10%, white)`);
  root.style.setProperty('--warning-text', theme.color_warning);
  root.style.setProperty('--danger', theme.color_danger);
  root.style.setProperty('--danger-dark', theme.color_danger);
  root.style.setProperty('--danger-darker', `color-mix(in srgb, ${theme.color_danger} 70%, black)`);
  root.style.setProperty('--danger-bg', `color-mix(in srgb, ${theme.color_danger} 10%, white)`);
  root.style.setProperty('--danger-text', theme.color_danger);
  root.style.setProperty('--danger-border', `color-mix(in srgb, ${theme.color_danger} 30%, white)`);
  root.style.setProperty('--featured', theme.color_featured);
  root.style.setProperty('--featured-glow', theme.color_featured);

  // ─── Dark Mode Colors ───
  if (theme.dark_mode) {
    root.style.setProperty('--dm-bg', theme.color_dark);
    root.style.setProperty('--dm-bg-secondary', `color-mix(in srgb, ${theme.color_dark} 80%, ${theme.color_light})`);
    root.style.setProperty('--dm-text', theme.color_light);
    root.style.setProperty('--dm-text-light', theme.color_text_muted);
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.add('dark');
  } else {
    root.style.setProperty('--dm-bg', '#0f172a');
    root.style.setProperty('--dm-bg-secondary', '#1e293b');
    root.style.setProperty('--dm-text', '#e2e8f0');
    root.style.setProperty('--dm-text-light', '#94a3b8');
    document.documentElement.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark');
  }

  // ─── Layout ───
  root.style.setProperty('--radius', `${theme.border_radius}px`);
  root.style.setProperty('--radius-sm', `${Math.max(4, theme.border_radius - 6)}px`);
  root.style.setProperty('--radius-md', `${Math.max(6, theme.border_radius - 4)}px`);
  root.style.setProperty('--radius-lg', `${Math.max(8, theme.border_radius - 2)}px`);
  root.style.setProperty('--radius-pill', '999px');
  root.style.setProperty('--radius-circle', '50%');
  root.style.setProperty('--max-width', `${theme.max_width}px`);

  // ─── Typography ───
  const fontMap: Record<string, string> = {
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'Fira Code', 'Consolas', monospace",
  };
  root.style.setProperty('--font-family', fontMap[theme.font_family] || fontMap.system);

  // ─── Gradients ───
  root.style.setProperty('--gradient-direction', theme.gradient_direction);
  root.style.setProperty('--gradient-primary', `linear-gradient(${theme.gradient_direction}, ${theme.color_primary}, ${theme.color_secondary})`);
  root.style.setProperty('--gradient-primary-accent', `linear-gradient(90deg, ${theme.color_primary}, ${theme.color_accent})`);
  root.style.setProperty('--gradient-danger', `linear-gradient(${theme.gradient_direction}, ${theme.color_danger}, ${theme.color_danger})`);
  root.style.setProperty('--gradient-danger-hover', `linear-gradient(${theme.gradient_direction}, ${theme.color_danger}, color-mix(in srgb, ${theme.color_danger} 70%, black))`);
  root.style.setProperty('--gradient-warning', `linear-gradient(${theme.gradient_direction}, ${theme.color_warning}, ${theme.color_warning})`);
  root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${theme.color_accent_soft}, ${theme.color_accent_bg})`);
  root.style.setProperty('--gradient-skill', `linear-gradient(90deg, ${theme.color_primary}, ${theme.color_accent})`);
  root.style.setProperty('--gradient-dark', `linear-gradient(180deg, ${theme.color_dark} 0%, color-mix(in srgb, ${theme.color_dark} 80%, ${theme.color_light}) 100%)`);
  root.style.setProperty('--gradient-light', `linear-gradient(180deg, ${theme.color_light} 0%, ${theme.color_accent_bg} 100%)`);

  // ─── Component Tokens ───
  root.style.setProperty('--card-radius', `${theme.border_radius}px`);
  root.style.setProperty('--card-glass', theme.dark_mode ? 'rgba(255,255,255,0.05)' : 'white');
  root.style.setProperty('--card-backdrop', theme.card_style === 'glass' ? 'blur(10px)' : 'none');
  root.style.setProperty('--card-border', `1px solid ${theme.color_accent_soft}`);
  root.style.setProperty('--btn-style', theme.button_style);
  root.style.setProperty('--focus-ring', `0 0 0 3px color-mix(in srgb, ${theme.color_accent} 20%, transparent)`);
  root.style.setProperty('--focus-ring-danger', `0 0 0 4px color-mix(in srgb, ${theme.color_danger} 15%, transparent)`);
  root.style.setProperty('--backdrop-blur', 'blur(10px)');
  root.style.setProperty('--backdrop-blur-sm', 'blur(4px)');
}

// ─── ADMIN AUTH ───

function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide helpful error messages for common issues
      let msg = error.message;
      if (error.message.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. If you were just invited, make sure you clicked the invite link in your email and set a password first.';
      }
      if (error.message.includes('Email not confirmed')) {
        msg = 'Email not confirmed. Check your inbox for a confirmation email, or ask the admin to disable email confirmation in Supabase settings.';
      }
      setError(msg);
    } else if (data.session) {
      setSession(data.session);
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user?.identities?.length === 0) {
      setError('This email is already registered. Try signing in instead.');
    } else {
      setError('✅ Account created! Check your email for confirmation, or sign in if email confirmation is disabled.');
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (session) {
    return (
      <>
        <div style={{ position: 'fixed', top: 8, right: 8, zIndex: 9999 }}>
          <button onClick={handleLogout} className="btn-admin btn-cancel" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
            Logout
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="admin-gate">
      <form onSubmit={handleLogin} className="gate-card">
        <h2 className="gate-title">🔐 CMS Admin</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
          Sign in with your admin account
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="gate-input"
          style={{ marginBottom: '0.5rem' }}
          autoFocus
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="gate-input"
        />
        {error && <p className="gate-error">{error}</p>}
        <button type="submit" className="gate-btn" disabled={loading} style={{ marginBottom: '0.5rem' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <button
          type="button"
          className="gate-btn"
          onClick={handleSignUp}
          disabled={loading}
          style={{ background: 'var(--gray)', color: 'var(--dark)' }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <p style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
          <strong>Trouble signing in?</strong><br />
          1. If invited: click the invite email link first to set your password<br />
          2. If added manually: use the exact email and password from Supabase<br />
          3. Check that email confirmation is disabled in Supabase Auth settings
        </p>
      </form>
    </div>
  );
}

// ─── APP CONTENT ───

function AppContent({
  theme,
  themeLoading,
  hero,
  about,
  projects,
  skills,
  contact,
  contentLoading,
}: {
  theme: Theme | null;
  themeLoading: boolean;
  hero: any;
  about: any;
  projects: any[];
  skills: any[];
  contact: any;
  contentLoading: boolean;
}) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Block everything while theme loads (so loader uses correct colors)
  if (themeLoading) {
    return <Loader fullPage />;
  }

  // Admin: render immediately once theme is ready
  if (isAdmin) {
    return (
      <AdminAuthGate>
        <CMSProvider>
          <div className="cms-admin">
            <aside className="cms-sidebar">
              <h3 className="cms-logo">🛠️ CMS</h3>
              <nav className="cms-nav">
                <Link to="/admin" className="cms-nav-link">📊 Dashboard</Link>
                <Link to="/admin/content-types" className="cms-nav-link">🏗️ Content Types</Link>
                <Link to="/admin/content/theme" className="cms-nav-link">🎨 Themes</Link>
                <Link to="/admin/content/hero" className="cms-nav-link">📄 Hero</Link>
                <Link to="/admin/content/about" className="cms-nav-link">👨‍💻 About</Link>
                <Link to="/admin/content/project" className="cms-nav-link">🚀 Projects</Link>
                <Link to="/admin/content/skill" className="cms-nav-link">⭐ Skills</Link>
                <Link to="/admin/content/contact" className="cms-nav-link">📧 Contact</Link>
              </nav>
            </aside>
            <main className="cms-main">
              <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/content-types" element={<ContentTypeBuilder />} />
                <Route path="/admin/content/:typeName" element={<ContentManager />} />
                <Route path="/admin/pages" element={<PageBuilder />} />
              </Routes>
            </main>
          </div>
        </CMSProvider>
      </AdminAuthGate>
    );
  }

  // Portfolio: wait for content too
  if (contentLoading) {
    return <Loader fullPage />;
  }

  const title = theme?.name || 'Alex Developer';

  return (
    <div className="app" style={{ fontFamily: 'var(--font-family)' }}>
      <Navbar />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* ✅ Hero from Supabase */}
                <Hero data={hero} />
                {/* ✅ About from Supabase */}
                <About data={about} />
                {/* ✅ Projects from Supabase */}
                <Projects items={projects} />
                {/* ✅ Skills from Supabase */}
                <Skills items={skills} />
                {/* ✅ Contact from Supabase */}
                <Contact data={contact} />
              </>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} {title}. Built with React & TypeScript.
        </p>
      </footer>
    </div>
  );
}

// ─── APP INNER ───

function AppInner() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);
  const [hero, setHero] = useState<unknown>(null);
  const [about, setAbout] = useState<unknown>(null);
  const [projects, setProjects] = useState<unknown[]>([]);
  const [skills, setSkills] = useState<unknown[]>([]);
  const [contact, setContact] = useState<unknown>(null);
  const [contentLoading, setContentLoading] = useState(true);

  const refreshTheme = async () => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Theme fetch error:', error);
      return;
    }

    if (data) {
      applyThemeVariables(data as Theme);
      setTheme(data as Theme);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        // ─── STEP 1: Fetch theme FIRST (blocking) ───
        await refreshTheme();
        setThemeLoading(false);

        // ─── STEP 2: Fetch ALL content from Supabase in parallel ✅ ───
        const [
          { data: heroData, error: heroError },
          { data: aboutData, error: aboutError },
          { data: projectsData, error: projectsError },
          { data: skillsData, error: skillsError },
          { data: contactData, error: contactError },
        ] = await Promise.all([
          supabase.from('hero').select('*').eq('is_active', true).order('order_index').single(),
          supabase.from('about').select('*').eq('is_active', true).order('order_index').single(),
          supabase.from('projects').select('*').eq('is_active', true).order('order_index', { ascending: true }),
          supabase.from('skills').select('*').eq('is_active', true).order('order_index', { ascending: true }),
          supabase.from('contact').select('*').eq('is_active', true).order('order_index').single(),
        ]);

        if (heroError) console.error('Hero fetch error:', heroError);
        if (aboutError) console.error('About fetch error:', aboutError);
        if (projectsError) console.error('Projects fetch error:', projectsError);
        if (skillsError) console.error('Skills fetch error:', skillsError);
        if (contactError) console.error('Contact fetch error:', contactError);

        setHero(heroData || null);
        setAbout(aboutData || null);
        setProjects(projectsData || []);
        setSkills(skillsData || []);
        setContact(contactData || null);
      } catch (err) {
        console.error('Failed to load content:', err);
      } finally {
        setContentLoading(false);
      }
    };

    loadAll();

    // Optional: Subscribe to real-time theme changes
    const subscription = supabase
      .channel('theme-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'themes' },
        () => {
          refreshTheme();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, loading: themeLoading, refreshTheme }}>
      <AppContent
        theme={theme}
        themeLoading={themeLoading}
        hero={hero}
        about={about}
        projects={projects}
        skills={skills}
        contact={contact}
        contentLoading={contentLoading}
      />
    </ThemeContext.Provider>
  );
}

// ─── APP ───

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}