import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '../services/socket';
import { chatApi } from '../services/api';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value }) => (
  <div className="ag-card p-4">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-1 text-2xl font-semibold">{value}</div>
  </div>
);
const ExpertDashboard = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview | chat
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [text, setText] = useState('');
  const [composeTo, setComposeTo] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [availability, setAvailability] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onReceive = (msg) => {
      const peerEmail = String(selectedEmail || composeTo || '').toLowerCase();
      const fromEmail = String(msg.fromEmail || '').toLowerCase();
      const toEmail = String(msg.toEmail || '').toLowerCase();
      const myEmail = String(user?.email || '').toLowerCase();
      const isForThisChat = peerEmail && (fromEmail === peerEmail || (fromEmail === myEmail && toEmail === peerEmail));
      if (!isForThisChat) return;
      const inbound = fromEmail !== myEmail;
      setMessages((m) => [...m, { ...msg, inbound }]);
      setConversations((prev) => {
        const idx = prev.findIndex(c => c._id === msg.conversationId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], lastMessageAt: new Date(msg.ts).toISOString(), lastMessageText: msg.text };
          return next.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        }
        return prev;
      });
    };
    const onTyping = (payload = {}) => {
      const fromEmail = String(payload.fromEmail || '').toLowerCase();
      const peerEmail = String(selectedEmail || composeTo || '').toLowerCase();
      if (fromEmail && peerEmail && fromEmail === peerEmail) {
        setIsOtherTyping(true);
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => setIsOtherTyping(false), 1500);
      }
    };
    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    return () => {
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
    };
  }, [selectedEmail, composeTo]);

  // Initial load conversations
  useEffect(() => {
    (async () => {
      try {
        const data = await chatApi.listConversations();
        if (data?.success) setConversations(data.conversations || []);
      } catch (_) {}
    })();
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleLogout = () => {
    authService.logout();
    navigate('/', { replace: true });
  };

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

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      send(e);
    } else {
      const target = (selectedEmail || composeTo || '').trim();
      if (target) {
        const socket = getSocket();
        socket.emit('typing', { toEmail: target });
      }
    }
  };

  // Select conversation by email helper
  const openByEmail = async (email) => {
    try {
      const res = await chatApi.getOrCreateConversationByEmail(email);
      if (res?.success) {
        setSelectedEmail(email);
        // Load messages
        const msgs = await chatApi.listMessages(res.conversation._id);
        if (msgs?.success) {
          const myEmail = String(user?.email || '').toLowerCase();
          const hydrated = (msgs.messages || []).map((m) => ({
            ...m,
            inbound: String(m.fromEmail || '').toLowerCase() !== myEmail,
            ts: new Date(m.createdAt).getTime()
          }));
          setMessages(hydrated);
          await chatApi.markRead(res.conversation._id).catch(() => {});
        }
        setConversations((prev) => {
          const exists = prev.find(c => c._id === res.conversation._id);
          return exists ? prev : [res.conversation, ...prev].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
      }
    } catch (_) {}
  };

  const visibleMessages = useMemo(() => {
    const peer = (selectedEmail || composeTo || '').toLowerCase();
    if (!peer) return messages;
    return messages.filter((m) => {
      const fromEmail = String(m.fromEmail || '').toLowerCase();
      const toEmail = String(m.toEmail || '').toLowerCase();
      return fromEmail === peer || toEmail === peer;
    });
  }, [messages, selectedEmail, composeTo]);

  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (_) {
      return '';
    }
  };

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
          <button onClick={handleLogout} className="ml-3 px-3 py-2 text-sm rounded-lg border border-[var(--ag-border)] hover:bg-gray-50">
            Logout
          </button>
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

          {/* Recent messages */}
          <div className="ag-card p-4 space-y-3">
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
              <button onClick={(e) => { openByEmail(composeTo.trim()); }} className="px-3 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg">Open</button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[var(--ag-border)]">
              {conversations.map((c) => (
                <button key={c._id} onClick={async () => {
                  setSelectedEmail((c.participantEmails || []).find(e => e !== (user?.email || '').toLowerCase()) || '');
                  const msgs = await chatApi.listMessages(c._id);
                  if (msgs?.success) setMessages(msgs.messages || []);
                }} className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedEmail && (c.participantEmails||[]).includes(selectedEmail) ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{((c.participantEmails||[]).find(e => e !== (user?.email || '').toLowerCase())) || 'Conversation'}</div>
                    <div className="text-xs text-gray-500">{new Date(c.lastMessageAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="text-xs text-gray-600 truncate">{c.lastMessageText}</div>
                  <div className="text-xs text-gray-500">{(c.participantEmails||[]).join(', ')}</div>
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
              {isOtherTyping && (selectedEmail || composeTo) && (
                <div className="text-xs text-[var(--ag-primary-600)] mt-1">typing…</div>
              )}
            </div>
            <div ref={scrollContainerRef} className="h-96 overflow-y-auto p-4 space-y-3 bg-[var(--ag-muted)]">
              {visibleMessages.map((m, i) => (
                <motion.div
                  key={`${m._id || ''}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-md px-3 py-2 rounded-2xl shadow-sm ${m.inbound ? 'bg-white border border-[var(--ag-border)]' : 'bg-[var(--ag-primary-500)] text-white ml-auto'}`}
                >
                  <div className="text-xs opacity-70 mb-0.5">{m.inbound ? `${m.fromName || m.fromEmail}` : 'You'}</div>
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  <div className={`text-[10px] mt-1 ${m.inbound ? 'text-gray-500' : 'text-white/80'} text-right`}>{formatTime(m.ts || m.createdAt)}</div>
                </motion.div>
              ))}
              {visibleMessages.length === 0 && <div className="text-sm text-gray-500">No messages in this conversation.</div>}
            </div>
            <form onSubmit={send} className="p-3 border-t border-[var(--ag-border)] flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a message"
                rows={1}
                className="flex-1 px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] resize-none"
              />
              <button className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDashboard;


