import React, { useState, useEffect, useRef } from 'react';
import authService from '../services/authService';

const Signup = ({ onClose, onSwitchToLogin, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordHints, setPasswordHints] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false,
    noSpace: true
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [inputsEnabled, setInputsEnabled] = useState(false);
  const formRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const pwdRef = useRef(null);
  const confirmRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);

  // Reset any persisted/autofilled values when the modal mounts
  useEffect(() => {
    const empty = { name: '', email: '', password: '', confirmPassword: '' };
    setFormData(empty);
    setTouched({ name: false, email: false, password: false, confirmPassword: false });
    setFieldErrors({ name: '', email: '', password: '', confirmPassword: '' });
    setError('');
    const t = setTimeout(() => setFormData(empty), 0);
    const clearNativeAutofill = () => {
      try {
        formRef.current?.reset?.();
        if (nameRef.current) nameRef.current.value = '';
        if (emailRef.current) emailRef.current.value = '';
        if (pwdRef.current) pwdRef.current.value = '';
        if (confirmRef.current) confirmRef.current.value = '';
      } catch (_) {}
    };
    const t2 = setTimeout(clearNativeAutofill, 150);
    const t3 = setTimeout(clearNativeAutofill, 600);
    const t4 = setTimeout(() => setInputsEnabled(true), 800);
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Load Google Identity Services script
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
        setGoogleReady(true);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  // Initialize and render Google button when script ready
  useEffect(() => {
    if (!googleReady) return;
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
          } catch (err) {
            setError(err.message || 'Google signup failed');
          }
        },
        ux_mode: 'popup',
        use_fedcm_for_prompt: false,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      const container = document.getElementById('googleSignupBtn');
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', text: 'signup_with' });
      }
    } catch (_) {}
  }, [googleReady]);

  const validateName = (value) => {
    if (!value) return 'Full name is required';
    return /^[A-Za-z][A-Za-z\s.'-]{1,49}$/.test(value.trim()) ? '' : 'Enter a valid full name';
  };

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const strict = /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
    return strict.test(value) ? '' : 'Enter a valid email address';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    const strong = value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value) && !/\s/.test(value);
    return strong ? '' : '8+ chars, upper, lower, number, symbol, no spaces';
  };

  const validateConfirm = (value, pwd) => {
    if (!value) return 'Please confirm your password';
    return value === pwd ? '' : 'Passwords do not match';
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types

    if (e.target.name === 'password') {
      const value = e.target.value;
      setPasswordHints({
        length: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        symbol: /[^A-Za-z0-9]/.test(value),
        noSpace: !/\s/.test(value)
      });
    }

    // On-type field validation
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]:
        name === 'name' ? validateName(value) :
        name === 'email' ? validateEmail(value) :
        name === 'password' ? validatePassword(value) :
        validateConfirm(value, name === 'confirmPassword' ? formData.password : formData.confirmPassword)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameOk = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/.test(formData.name.trim());
    if (!nameOk) {
      setError('Please enter a valid full name');
      return;
    }

    const emailOk = /\S+@\S+\.\S+/.test(formData.email);
    if (!emailOk) {
      setError('Please enter a valid email');
      return;
    }

    const pwd = formData.password;
    const strong = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) && !/\s/.test(pwd);
    if (!strong) {
      setError('Password must be 8+ chars with upper, lower, number, symbol, and no spaces');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    // Do not force-show errors on submit; button remains disabled until valid

    try {
      const response = await authService.signup(formData.name.trim(), formData.email.trim(), formData.password, formData.confirmPassword);
      console.log('Signup successful:', response);
      // Call the success callback to update app state
      if (onAuthSuccess) {
        onAuthSuccess();
      } else if (onClose) {
        onClose();
      }
    } catch (error) {
      setError(error.message || 'Signup failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  

  const isFormValid =
    !validateName(formData.name) && !validateEmail(formData.email) &&
    !validatePassword(formData.password) && !validateConfirm(formData.confirmPassword, formData.password);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 border border-[var(--ag-border)] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl ag-display font-bold text-gray-900">Sign Up</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={!inputsEnabled}
              ref={nameRef}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                touched.name && fieldErrors.name
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-600)]'
              }`}
              required
              disabled={loading}
            />
            {touched.name && fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>

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
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="off"
              readOnly={!inputsEnabled}
              ref={pwdRef}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                touched.password && fieldErrors.password
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-600)]'
              }`}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="off"
              readOnly={!inputsEnabled}
              ref={confirmRef}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                touched.confirmPassword && fieldErrors.confirmPassword
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-[var(--ag-border)] focus:ring-[var(--ag-primary-600)]'
              }`}
              required
              disabled={loading}
            />
            {touched.confirmPassword && fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full ag-cta-gradient text-white py-2 rounded-lg hover:opacity-95 transition-opacity font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
            disabled={loading || !isFormValid}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--ag-border)]" />
            <div className="text-xs text-gray-500">OR</div>
            <div className="h-px flex-1 bg-[var(--ag-border)]" />
          </div>
          <div className="mt-3 flex justify-center">
            <div id="googleSignupBtn" />
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button 
              onClick={onSwitchToLogin}
              className="text-[var(--ag-primary-600)] hover:opacity-80 font-medium"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;