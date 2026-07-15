import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import './App.css';

const ADMIN_PASSWORD: string = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'password';

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

// ─── ADMIN LAYOUT ───
// ─── MAIN APP CONTENT ───
function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Admin routes: completely separate layout, no portfolio UI at all
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
              <Link to="/admin/content/hero" className="cms-nav-link">🚀 Hero</Link>
              <Link to="/admin/content/about" className="cms-nav-link">👨‍💻 About</Link>
              <Link to="/admin/content/project" className="cms-nav-link">🚀 Projects</Link>
              <Link to="/admin/content/skill" className="cms-nav-link">⭐ Skills</Link>
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

  // Portfolio site
  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <About />
              <Projects />
              <Skills />
              <Contact />
            </>
          } />
        </Routes>
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} Alex Developer. Built with React & TypeScript.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;