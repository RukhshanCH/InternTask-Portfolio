// ============================================
// App.tsx — Complete Multi-Tenant Portfolio CMS
// Public portfolio view + Auth + Dashboard + Admin + Invites
// ============================================

import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './utils/supabase';
import type { Theme, PortfolioData } from './utils/supabase';
import { getPublicPortfolio, getSession } from './utils/supabase';

// ─── COMPONENTS ───
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Loader from './components/Loader';

// ─── PAGES ───
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import InvitePage from './pages/InvitePage';

// ─── ADMIN ───
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './components/cms/AdminDashboard';
import ContentManager from './components/cms/ContentManager';
import ContentTypeBuilder from './components/cms/ContentTypeBuilder';
import PageBuilder from './components/cms/PageBuilder';
import MembersPage from './admin/MembersPage';
import InboxPage from './admin/InboxPage';

import './App.css';

// ─── THEME CONTEXT ───

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

// ─── PORTFOLIO CONTEXT (for admin navigation) ───

interface PortfolioContextType {
  portfolioId: string | null;
}

export const PortfolioContext = createContext<PortfolioContextType>({
  portfolioId: null,
});

export const usePortfolio = () => useContext(PortfolioContext);

// Helper: build absolute admin paths (prevents URL stacking)
export function useAdminPath(section: string = '') {
  const { portfolioId } = usePortfolio();
  if (!portfolioId) return '/dashboard';
  return section ? `/admin/${portfolioId}/${section}` : `/admin/${portfolioId}`;
}

// ─── CSS VARIABLES INJECTOR ───

function applyThemeVariables(theme: Theme | null) {
  if (!theme) return;

  const root = document.documentElement;

  // ─── Core Colors ───
  root.style.setProperty('--primary', theme.color_primary);
  root.style.setProperty('--primary-dark', theme.color_primary);
  root.style.setProperty('--secondary', theme.color_secondary);
  root.style.setProperty('--accent', theme.color_accent || theme.color_secondary);
  root.style.setProperty('--accent-light', `color-mix(in srgb, ${theme.color_accent || theme.color_secondary} 30%, transparent)`);
  root.style.setProperty('--accent-soft', theme.color_accent_soft || '#bbf7d0');
  root.style.setProperty('--accent-bg', theme.color_accent_bg || '#f0fdf4');
  root.style.setProperty('--dark', theme.color_dark || '#1e1b4b');
  root.style.setProperty('--light', theme.color_light || '#ffffff');
  root.style.setProperty('--gray', theme.color_gray || '#e2e8f0');
  root.style.setProperty('--gray-warm', theme.color_gray_warm || '#f1f5f9');
  root.style.setProperty('--text', theme.color_text || '#334155');
  root.style.setProperty('--text-light', theme.color_text_muted || '#64748b');

  // ─── Semantic Colors ───
  root.style.setProperty('--success', theme.color_success || '#22c55e');
  root.style.setProperty('--success-bg', `color-mix(in srgb, ${theme.color_success || '#22c55e'} 10%, white)`);
  root.style.setProperty('--success-text', theme.color_success || '#22c55e');
  root.style.setProperty('--success-border', `color-mix(in srgb, ${theme.color_success || '#22c55e'} 30%, white)`);
  root.style.setProperty('--warning', theme.color_warning || '#f59e0b');
  root.style.setProperty('--warning-dark', theme.color_warning || '#f59e0b');
  root.style.setProperty('--warning-bg', `color-mix(in srgb, ${theme.color_warning || '#f59e0b'} 10%, white)`);
  root.style.setProperty('--warning-text', theme.color_warning || '#f59e0b');
  root.style.setProperty('--danger', theme.color_danger || '#ef4444');
  root.style.setProperty('--danger-dark', theme.color_danger || '#ef4444');
  root.style.setProperty('--danger-darker', `color-mix(in srgb, ${theme.color_danger || '#ef4444'} 70%, black)`);
  root.style.setProperty('--danger-bg', `color-mix(in srgb, ${theme.color_danger || '#ef4444'} 10%, white)`);
  root.style.setProperty('--danger-text', theme.color_danger || '#ef4444');
  root.style.setProperty('--danger-border', `color-mix(in srgb, ${theme.color_danger || '#ef4444'} 30%, white)`);
  root.style.setProperty('--featured', theme.color_featured || '#fbbf24');
  root.style.setProperty('--featured-glow', theme.color_featured || '#fbbf24');

  // ─── Dark Mode ───
  if (theme.dark_mode) {
    root.style.setProperty('--dm-bg', theme.color_dark || '#0f172a');
    root.style.setProperty('--dm-bg-secondary', `color-mix(in srgb, ${theme.color_dark || '#0f172a'} 80%, ${theme.color_light || '#fff'})`);
    root.style.setProperty('--dm-text', theme.color_light || '#e2e8f0');
    root.style.setProperty('--dm-text-light', theme.color_text_muted || '#94a3b8');
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
  const borderRadius = Number(theme.border_radius) || 12;
  root.style.setProperty('--radius', `${borderRadius}px`);
  root.style.setProperty('--radius-sm', `${Math.max(4, borderRadius - 6)}px`);
  root.style.setProperty('--radius-md', `${Math.max(6, borderRadius - 4)}px`);
  root.style.setProperty('--radius-lg', `${Math.max(8, borderRadius - 2)}px`);
  root.style.setProperty('--radius-pill', '999px');
  root.style.setProperty('--radius-circle', '50%');
  root.style.setProperty('--max-width', `${theme.max_width || 1200}px`);

  // ─── Typography ───
  const fontMap: Record<string, string> = {
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    inter: "'Inter', -apple-system, sans-serif",
    roboto: "'Roboto', sans-serif",
    poppins: "'Poppins', sans-serif",
    montserrat: "'Montserrat', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'Fira Code', 'Consolas', monospace",
  };
  root.style.setProperty('--font-family', fontMap[theme.font_family] || fontMap.system);

  // ─── Gradients ───
  const gradDir = theme.gradient_direction || '135deg';
  root.style.setProperty('--gradient-direction', gradDir);
  root.style.setProperty('--gradient-primary', `linear-gradient(${gradDir}, ${theme.color_primary}, ${theme.color_secondary})`);
  root.style.setProperty('--gradient-primary-accent', `linear-gradient(90deg, ${theme.color_primary}, ${theme.color_accent || theme.color_secondary})`);
  root.style.setProperty('--gradient-danger', `linear-gradient(${gradDir}, ${theme.color_danger || '#ef4444'}, ${theme.color_danger || '#ef4444'})`);
  root.style.setProperty('--gradient-danger-hover', `linear-gradient(${gradDir}, ${theme.color_danger || '#ef4444'}, color-mix(in srgb, ${theme.color_danger || '#ef4444'} 70%, black))`);
  root.style.setProperty('--gradient-warning', `linear-gradient(${gradDir}, ${theme.color_warning || '#f59e0b'}, ${theme.color_warning || '#f59e0b'})`);
  root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${theme.color_accent_soft || '#bbf7d0'}, ${theme.color_accent_bg || '#f0fdf4'})`);
  root.style.setProperty('--gradient-skill', `linear-gradient(90deg, ${theme.color_primary}, ${theme.color_accent || theme.color_secondary})`);
  root.style.setProperty('--gradient-dark', `linear-gradient(180deg, ${theme.color_dark || '#1e1b4b'} 0%, color-mix(in srgb, ${theme.color_dark || '#1e1b4b'} 80%, ${theme.color_light || '#fff'}) 100%)`);
  root.style.setProperty('--gradient-light', `linear-gradient(180deg, ${theme.color_light || '#fff'} 0%, ${theme.color_accent_bg || '#f0fdf4'} 100%)`);

  // ─── Component Tokens ───
  root.style.setProperty('--card-radius', `${theme.border_radius || 12}px`);
  root.style.setProperty('--card-glass', theme.dark_mode ? 'rgba(255,255,255,0.05)' : 'white');
  root.style.setProperty('--card-backdrop', theme.card_style === 'glass' ? 'blur(10px)' : 'none');
  root.style.setProperty('--card-border', `1px solid ${theme.color_accent_soft || '#e2e8f0'}`);
  root.style.setProperty('--btn-style', theme.button_style || 'gradient');
  root.style.setProperty('--focus-ring', `0 0 0 3px color-mix(in srgb, ${theme.color_accent || theme.color_secondary} 20%, transparent)`);
  root.style.setProperty('--focus-ring-danger', `0 0 0 4px color-mix(in srgb, ${theme.color_danger || '#ef4444'} 15%, transparent)`);
  root.style.setProperty('--backdrop-blur', 'blur(10px)');
  root.style.setProperty('--backdrop-blur-sm', 'blur(4px)');
}

// ─── AUTH GUARD ───

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    getSession().then((session) => {
      setAuthState(session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session) setAuthState('authenticated');
      } else if (event === 'SIGNED_OUT') {
        setAuthState('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authState === 'loading') {
    return <Loader fullPage />;
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ─── PUBLIC PORTFOLIO VIEWER ───

function PublicPortfolioViewer() {
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
    const portfolioData = await getPublicPortfolio(slug);
    if (!portfolioData) {
      setError('Portfolio not found or not published.');
    } else {
      setData(portfolioData);
      if (portfolioData.theme) {
        applyThemeVariables(portfolioData.theme);
      }
    }
    setLoading(false);
  }

  if (loading) return <Loader fullPage />;
  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <h2 style={{ color: '#ef4444' }}>Portfolio Not Found</h2>
        <p style={{ color: '#94a3b8' }}>{error}</p>
      </div>
    );
  }

  const { theme, hero, about, skills, projects, contact } = data;
  const title = theme?.name || data.portfolio?.title || 'Portfolio';

  return (
    <div className="app" style={{ fontFamily: 'var(--font-family)' }}>
      <title>{title}</title>
      <Navbar />
      <main>
        <Hero data={hero as any} />
        <About data={about as any} />
        <Projects items={projects as any} />
        <Skills items={skills as any} />
        <Contact data={contact as any} />
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} {title}. Built with Portfolio CMS.</p>
      </footer>
    </div>
  );
}

// ─── HOME PAGE (Default Portfolio) ───

function HomePage() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [hero, setHero] = useState<unknown>(null);
  const [about, setAbout] = useState<unknown>(null);
  const [projects, setProjects] = useState<unknown[]>([]);
  const [skills, setSkills] = useState<unknown[]>([]);
  const [contact, setContact] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      const { data: themeData } = await supabase
        .from('themes')
        .select('*')
        .eq('is_active', true)
        .single();

      if (themeData) {
        applyThemeVariables(themeData as Theme);
        setTheme(themeData as Theme);
      }

      const [
        { data: heroData },
        { data: aboutData },
        { data: projectsData },
        { data: skillsData },
        { data: contactData },
      ] = await Promise.all([
        supabase.from('hero').select('*').eq('is_active', true).single(),
        supabase.from('about').select('*').eq('is_active', true).single(),
        supabase.from('projects').select('*').eq('is_active', true).order('display_order', { ascending: true }),
        supabase.from('skills').select('*').eq('is_active', true).order('display_order', { ascending: true }),
        supabase.from('contact').select('*').eq('is_active', true).single(),
      ]);

      setHero(heroData || null);
      setAbout(aboutData || null);
      setProjects(projectsData || []);
      setSkills(skillsData || []);
      setContact(contactData || null);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loader fullPage />;

  const title = theme?.name || 'Portfolio';

  return (
    <ThemeContext.Provider value={{ theme, loading: false, refreshTheme: async () => { } }}>
      <div className="app" style={{ fontFamily: 'var(--font-family)' }}>
        <title>{title}</title>
        <Navbar />
        <main>
          <Hero data={hero as any} />
          <About data={about as any} />
          <Projects items={projects as any} />
          <Skills items={skills as any} />
          <Contact data={contact as any} />
        </main>
        <footer className="footer">
          <p>© {new Date().getFullYear()} {title}. Built with Portfolio CMS.</p>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}

// ─── ADMIN ROUTES ───

function AdminRoutes() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const location = useLocation();

  // Redirect /admin/:id to /admin/:id/hero (or dashboard)
  if (location.pathname === `/admin/${portfolioId}`) {
    return <Navigate to={`/admin/${portfolioId}/hero`} replace />;
  }

  return (
    <PortfolioContext.Provider value={{ portfolioId: portfolioId || null }}>
      <RequireAuth>
        <AdminLayout>
          <Routes>
            <Route index element={<Navigate to="hero" replace />} />
            <Route path="hero" element={<AdminDashboard />} />
            <Route path="about" element={<ContentManager />} />
            <Route path="skills" element={<ContentManager />} />
            <Route path="projects" element={<ContentManager />} />
            <Route path="settings" element={<ContentTypeBuilder />} />
            <Route path="content/:typeName" element={<ContentManager />} />
            <Route path="pages" element={<PageBuilder />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="inbox" element={<InboxPage />} />
          </Routes>
        </AdminLayout>
      </RequireAuth>
    </PortfolioContext.Provider>
  );
}

// ─── APP ───

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio/:slug" element={<PublicPortfolioViewer />} />
        <Route path="/invite/:token" element={<InvitePage />} />

        {/* Auth */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        } />

        {/* Admin — Portfolio-scoped */}
        <Route path="/admin/:portfolioId/*" element={<AdminRoutes />} />

        {/* Legacy admin redirect */}
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}