import { BrowserRouter, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import ProjectAdmin from './components/ProjectAdmin';
import './App.css';

// 🔐 Change this to your own password
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'password';

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  if (authenticated) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setInput('');
    }
  };

  return (
    <div className="admin-gate">
      <form onSubmit={handleSubmit} className="gate-card">
        <h2 className="gate-title">Admin Access</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter admin password"
          className="gate-input"
          autoFocus
        />
        {error && <p className="gate-error">{error}</p>}
        <button type="submit" className="gate-btn">
          Unlock
        </button>
      </form>
    </div>
  );
}

function AppContent() {
  const location = useLocation();

  // Admin route: show ONLY the password gate → admin panel
  if (location.pathname === '/admin') {
    return (
      <PasswordGate>
        <ProjectAdmin />
      </PasswordGate>
    );
  }

  // Normal portfolio
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Contact />
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