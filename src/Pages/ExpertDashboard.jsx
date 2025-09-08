import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '../services/socket';
import authService from '../services/authService';

const StatCard = ({ title, value }) => (
  <div className="ag-card p-4">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-1 text-2xl font-semibold">{value}</div>
  </div>
);

const ExpertDashboard = () => {
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('overview'); // overview | chat
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [composeTo, setComposeTo] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [availability, setAvailability] = useState(true);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onReceive = (msg) => {
      // Ignore echo from self
      if (msg.fromEmail === user?.email) return;
      setMessages((m) => [...m, { ...msg, inbound: true }]);
    };
    socket.on('receive_message', onReceive);
    return () => {
      socket.off('receive_message', onReceive);
    };
  }, []);

  const send = (e) => {
    e.preventDefault();
    const target = (selectedEmail || composeTo || '').trim();
    if (!text.trim() || !target) return;
    const socket = getSocket();
    const outgoing = { toEmail: target, text: text.trim() };
    socket.emit('send_message', outgoing, (ack) => {
      if (ack?.success) {
        setMessages((m) => [
          ...m,
          { fromUserId: user?.id, fromName: user?.name, fromEmail: user?.email, toEmail: target, text, ts: Date.now(), inbound: false }
        ]);
        setText('');
      }
    });
  };

  // Build conversation list (unique farmer emails) and messages per selected
  const conversations = useMemo(() => {
    const convoMap = new Map();
    for (const m of messages) {
      const other = m.inbound ? (m.fromEmail) : (m.toEmail || '');
      if (!other) continue;
      const entry = convoMap.get(other) || { email: other, name: m.inbound ? (m.fromName || other) : other, lastTs: 0, lastText: '' };
      entry.lastTs = Math.max(entry.lastTs, m.ts || Date.now());
      entry.lastText = m.text || '';
      convoMap.set(other, entry);
    }
    return Array.from(convoMap.values()).sort((a, b) => b.lastTs - a.lastTs);
  }, [messages]);

  const visibleMessages = useMemo(() => {
    if (!selectedEmail) return messages;
    return messages.filter((m) => (m.inbound ? m.fromEmail === selectedEmail : m.toEmail === selectedEmail));
  }, [messages, selectedEmail]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expert Dashboard</h1>
          <p className="mt-1 text-gray-600">{greeting}, {user?.name || 'Expert'}. Manage consultations and messages.</p>
        </div>
        <div className="ag-card px-4 py-2 flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${availability ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm">{availability ? 'Available' : 'Away'}</span>
          <label className="inline-flex items-center cursor-pointer ml-2">
            <input type="checkbox" className="sr-only" checked={availability} onChange={(e) => setAvailability(e.target.checked)} />
            <span className="w-10 h-5 bg-gray-300 rounded-full p-1 flex items-center transition">
              <span className={`h-3 w-3 rounded-full bg-white shadow transform transition ${availability ? 'translate-x-5' : ''}`} />
            </span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="ag-card p-2 flex gap-2">
        <button onClick={() => setActiveTab('overview')} className={`px-3 py-2 rounded-lg text-sm ${activeTab === 'overview' ? 'bg-[var(--ag-primary-500)] text-white' : 'bg-[var(--ag-muted)]'}`}>Overview</button>
        <button onClick={() => setActiveTab('chat')} className={`px-3 py-2 rounded-lg text-sm ${activeTab === 'chat' ? 'bg-[var(--ag-primary-500)] text-white' : 'bg-[var(--ag-muted)]'}`}>Chat</button>
      </div>

      {/* Overview Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Open chats" value={messages.filter(m => !m.inbound).length} />
            <StatCard title="New messages" value={messages.filter(m => m.inbound).length} />
            <StatCard title="Today’s consultations" value={3} />
            <StatCard title="Avg. response time" value="< 2m" />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="ag-card p-4 space-y-3">
              <div className="font-semibold">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <a href="/dashboard/crop-profiles" className="px-3 py-2 bg-[var(--ag-muted)] rounded-lg text-sm">View Crop Profiles</a>
                <a href="/dashboard/reports" className="px-3 py-2 bg-[var(--ag-muted)] rounded-lg text-sm">View Reports</a>
                <a href="/dashboard/soil-health" className="px-3 py-2 bg-[var(--ag-muted)] rounded-lg text-sm">Soil Health</a>
                <a href="/dashboard/fertilizer" className="px-3 py-2 bg-[var(--ag-muted)] rounded-lg text-sm">Fertilizer Calc</a>
              </div>
            </div>
            <div className="ag-card p-4 space-y-3 lg:col-span-2">
              <div className="font-semibold">Recent Messages</div>
              <div className="max-h-56 overflow-y-auto space-y-2">
                {messages.slice(-8).reverse().map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${m.inbound ? 'bg-blue-500' : 'bg-green-500'}`} />
                    <div className="text-sm">
                      <div className="text-gray-600">{m.inbound ? (m.fromName || m.fromEmail) : 'You'}</div>
                      <div>{m.text}</div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <div className="text-sm text-gray-500">No messages yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Content */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversations List */}
          <div className="ag-card p-0 overflow-hidden">
            <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)] flex gap-2">
              <input
                placeholder="Start new chat by email"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
              />
              <button onClick={(e) => { setSelectedEmail(composeTo.trim()); }} className="px-3 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg">Open</button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[var(--ag-border)]">
              {conversations.map((c) => (
                <button key={c.email} onClick={() => setSelectedEmail(c.email)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedEmail === c.email ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{new Date(c.lastTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="text-xs text-gray-600 truncate">{c.lastText}</div>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No conversations yet. Start one above.</div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="ag-card p-0 overflow-hidden lg:col-span-2">
            <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
              <div className="text-sm text-gray-600">Chatting with: <span className="font-medium">{selectedEmail || (composeTo ? composeTo : '—')}</span></div>
            </div>
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-[var(--ag-muted)]">
              {visibleMessages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md px-4 py-2 rounded-lg ${m.inbound ? 'bg-white border border-[var(--ag-border)]' : 'bg-[var(--ag-primary-500)] text-white ml-auto'}`}>
                  <div className="text-xs opacity-80 mb-1">{m.inbound ? `${m.fromName || m.fromEmail}` : 'You'}</div>
                  {m.text}
                </motion.div>
              ))}
              {visibleMessages.length === 0 && <div className="text-sm text-gray-500">No messages in this conversation.</div>}
            </div>
            <form onSubmit={send} className="p-3 border-t border-[var(--ag-border)] flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" />
              <button className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDashboard;


