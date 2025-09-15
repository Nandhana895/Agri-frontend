
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login = ({ onClose, onSwitchToSignup, onAuthSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [inputsEnabled, setInputsEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Ensure form is reset cleanly when the modal is opened and after mount
  useEffect(() => {
    const emptyForm = { email: '', password: '' };
    setFormData(emptyForm);
    setTouched({ email: false, password: false });
    setFieldErrors({ email: '', password: '' });
    setError('');
    // Clear again on next tick to override any browser autofill
    const t = setTimeout(() => {
      setFormData(emptyForm);
    }, 0);
    const clearNativeAutofill = () => {
      try {
        if (emailRef.current) emailRef.current.value = '';
        if (passwordRef.current) passwordRef.current.value = '';
        if (formRef.current) formRef.current.reset?.();
      } catch (_) {}
    };
    const t2 = setTimeout(clearNativeAutofill, 150);
    const t3 = setTimeout(clearNativeAutofill, 600);
    const t4 = setTimeout(() => setInputsEnabled(true), 800);
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Load Google Identity Services script and render button
  useEffect(() => {
    const id = 'google-identity-services';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true; s.id = id;
      document.body.appendChild(s);
    }
    const t = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(t);
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return;
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (resp) => {
              try {
                const result = await authService.loginWithGoogle(resp.credential);
                if (onAuthSuccess) onAuthSuccess();
                else if (onClose) onClose();
                const target = result?.user?.role === 'admin' ? '/admin' : '/dashboard';
                navigate(target, { replace: true });
              } catch (err) {
                setError(err.message || 'Google login failed');
              }
            },
            ux_mode: 'popup',
            use_fedcm_for_prompt: false,
            auto_select: false,
            cancel_on_tap_outside: true
          });
          const container = document.getElementById('googleLoginBtn');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', text: 'signin_with' });
          }
        } catch (_) {}
      }
    }, 200);
    return () => clearInterval(t);
  }, [onAuthSuccess, onClose, navigate]);


  // Strict email validation: no consecutive dots, valid labels, TLD >= 2
  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const strict = /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
    return strict.test(value) ? '' : 'Enter a valid email address';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (/\s/.test(value)) return 'Password cannot contain spaces';
    return value.length >= 8 ? '' : 'Password should be at least 8 characters';
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
     // Clear error when user types
    // On-type validation per field
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: name === 'email' ? validateEmail(value) : validatePassword(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Do not force-show errors on submit; button stays disabled until valid

    try {
      const response = await authService.login(formData.email, formData.password);
      console.log('Login successful:', response);
      // Update app auth state
      if (onAuthSuccess) onAuthSuccess();
      else if (onClose) onClose();

      // Navigate based on role
      const target = response?.user?.role === 'admin' ? '/admin' : (response?.user?.role === 'expert' ? '/expert' : '/dashboard');
      navigate(target, { replace: true });
    } catch (error) {
      // Prefer server-provided message exactly as sent
      const serverMessage = error?.message || error?.error || 'Login failed. Please try again.';
      setError(serverMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('Closing login modal');
    if (onClose) {
      onClose();
    }
  };


  const handleSwitchToSignup = () => {
    console.log('Switching to signup');
    if (onSwitchToSignup) {
      onSwitchToSignup();
    }
  };

  const isFormValid =
    !validateEmail(formData.email) && !validatePassword(formData.password);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 border border-[var(--ag-border)] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl ag-display font-bold text-gray-900">Login</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" ref={formRef}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={!inputsEnabled}
              ref={emailRef}
              onFocus={() => {
                if (!inputsEnabled) return;
                if (formData.email !== '' && emailRef.current && emailRef.current.value !== formData.email) {
                  emailRef.current.value = formData.email;
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                touched.email && fieldErrors.email
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-600)]'
              }`}
              required
              disabled={loading}
            />
            {touched.email && fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="off"
                readOnly={!inputsEnabled}
                ref={passwordRef}
                onFocus={() => {
                  if (!inputsEnabled) return;
                  if (formData.password !== '' && passwordRef.current && passwordRef.current.value !== formData.password) {
                    passwordRef.current.value = formData.password;
                  }
                }}
                className={`w-full pr-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  touched.password && fieldErrors.password
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-600)]'
                }`}
                required
                disabled={loading}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20c-5 0-9.27-3.11-11-8 0-1.61.5-3.11 1.36-4.36" />
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                    <path d="M16.24 7.76A10.94 10.94 0 0123 12c-.5 1.61-1.5 3.11-2.76 4.36" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full ag-cta-gradient text-white py-2 rounded-lg hover:opacity-95 transition-opacity font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
            disabled={loading || !isFormValid}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--ag-border)]" />
            <div className="text-xs text-gray-500">OR</div>
            <div className="h-px flex-1 bg-[var(--ag-border)]" />
          </div>
          <div className="mt-3 flex justify-center">
            <div id="googleLoginBtn" />
          </div>
        </div>
        <div className="mt-4 text-center space-y-2">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button 
              onClick={handleSwitchToSignup}
              className="text-[var(--ag-primary-600)] hover:opacity-80 font-medium"
              type="button"
            >
              Sign up
            </button>
          </p>
          <p>
            <a href="/forgot-password" className="text-sm text-[var(--ag-primary-600)] hover:opacity-80">Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;





