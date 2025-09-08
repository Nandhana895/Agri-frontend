import React, { useState } from 'react';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message || 'If the email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-[var(--ag-border)] shadow">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        {message && <div className="mb-3 p-3 bg-green-100 text-green-800 rounded">{message}</div>}
        {error && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registered Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-600)]"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full ag-cta-gradient text-white py-2 rounded-lg font-semibold disabled:opacity-60">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;


