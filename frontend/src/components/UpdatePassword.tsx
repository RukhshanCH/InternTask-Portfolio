import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/admin'), 2000);
    }
  };

  if (success) {
    return (
      <div className="admin-gate">
        <div className="gate-card">
          <h2 className="gate-title">✅ Success</h2>
          <p style={{ textAlign: 'center', color: 'var(--success)' }}>
            Password updated! Redirecting to admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-gate">
      <form onSubmit={handleSubmit} className="gate-card">
        <h2 className="gate-title">🔑 Update Password</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="gate-input"
          required
          minLength={6}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          className="gate-input"
          required
        />
        {error && <p className="gate-error">{error}</p>}
        <button type="submit" className="gate-btn">
          Update Password
        </button>
      </form>
    </div>
  );
}