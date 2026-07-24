import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for auth code in URL (OAuth callback)
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        navigate('/admin');
        return;
      }

      if (data.session) {
        // Successfully authenticated
        navigate('/admin');
      } else {
        // No session, redirect to admin login
        navigate('/admin');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="admin-gate">
      <div className="gate-card" style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Processing authentication...</p>
      </div>
    </div>
  );
}