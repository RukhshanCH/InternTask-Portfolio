import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CMSProvider } from './context/CMSContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
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
import './App.css';
import type { ContentItem } from '.';
import Loader from './components/Loader';

const ADMIN_PASSWORD: string = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'password';
const API_BASE = 'http://localhost:3001/api/content';

// ─── PASSWORD GATE ───
function PasswordGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('cms_auth');
    if (saved === 'true') setAuth(true);
  }, []);

  if (auth) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuth(true);
      sessionStorage.setItem('cms_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setInput('');
    }
  };

  return (
    <div className="admin-gate">
      <form onSubmit={handleSubmit} className="gate-card">
        <h2 className="gate-title">🔐 CMS Admin</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter password"
          className="gate-input"
          autoFocus
        />
        {error && <p className="gate-error">{error}</p>}
        <button type="submit" className="gate-btn">Unlock</button>
      </form>
    </div>
  );
}

// ─── APP CONTENT ───
function AppContent({
  hero,
  about,
  projects,
  skills,
  contact,
  themeLoading,
  contentLoading,
}: {
  hero: ContentItem | null;
  about: ContentItem | null;
  projects: ContentItem[];
  skills: ContentItem[];
  contact: ContentItem | null;
  themeLoading: boolean;
  contentLoading: boolean;
}) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // ── BLOCK EVERYTHING while theme loads (so loader uses correct colors) ──
  if (themeLoading) {
    return <Loader fullPage />;
  }

  // ── ADMIN: render immediately once theme is ready ──
  if (isAdmin) {
    return (
      <PasswordGate>
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
      </PasswordGate>
    );
  }

  // ── PORTFOLIO: wait for content too ──
  if (contentLoading) {
    return <Loader fullPage />;
  }

  const d = hero?.data as Record<string, unknown> | undefined;
  const title = String(d?.title || 'Alex Developer');

  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <Hero data={hero} />
              <About data={about} />
              <Projects items={projects} />
              <Skills items={skills} />
              <Contact data={contact} />
            </>
          } />
        </Routes>
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} {title}. Built with React & TypeScript.</p>
      </footer>
    </div>
  );
}

function AppInner() {
  const { loading: themeLoading } = useTheme();
  const [data, setData] = useState({
    hero: null as ContentItem | null,
    about: null as ContentItem | null,
    projects: [] as ContentItem[],
    skills: [] as ContentItem[],
    contact: null as ContentItem | null,
  });
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    if (themeLoading) return;

    const loadContent = async () => {
      try {
        const [heroRes, aboutRes, projRes, skillRes, contactRes] = await Promise.all([
          fetch(`${API_BASE}/hero?status=published&sort=order`),
          fetch(`${API_BASE}/about?status=published&sort=order`),
          fetch(`${API_BASE}/project?status=published&sort=order`),
          fetch(`${API_BASE}/skill?status=published&sort=order`),
          fetch(`${API_BASE}/contact?status=published&sort=order`),
        ]);

        const [heroArr, aboutArr, projArr, skillArr, contactArr] = await Promise.all([
          heroRes.json(),
          aboutRes.json(),
          projRes.json(),
          skillRes.json(),
          contactRes.json(),
        ]);

        setData({
          hero: heroArr[0] || null,
          about: aboutArr[0] || null,
          projects: projArr || [],
          skills: skillArr || [],
          contact: contactArr[0] || null,
        });
      } catch (err) {
        console.error('Failed to load content:', err);
      } finally {
        setContentLoading(false);
      }
    };

    loadContent();
  }, [themeLoading]);

  return (
    <AppContent
      {...data}
      themeLoading={themeLoading}
      contentLoading={contentLoading}
    />
  );
}

// ─── ROOT APP ───
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;