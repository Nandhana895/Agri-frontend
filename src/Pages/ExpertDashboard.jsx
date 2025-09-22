import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '../services/socket';
import { chatApi } from '../services/api';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import SowingTrendsDashboard from '../Components/SowingTrendsDashboard';

const StatCard = ({ title, value, icon }) => (
  <div className="ag-card p-5">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs tracking-wide text-gray-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
      </div>
      {icon ? (
        <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">{icon}</div>
      ) : null}
    </div>
  </div>
);
const ExpertDashboard = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [text, setText] = useState('');
  const [composeTo, setComposeTo] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [availability, setAvailability] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsTab, setRequestsTab] = useState('pending'); // pending | handled
  const [displayNameByEmail, setDisplayNameByEmail] = useState({});
  const [unreadByConvo, setUnreadByConvo] = useState({}); // { [conversationId]: number }
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]); // {type:'request'|'message', text, ts, conversationId?, peerEmail?}
  const [now, setNow] = useState(() => new Date());
  const totalUnread = useMemo(() => Object.values(unreadByConvo).reduce((a, b) => a + (b || 0), 0), [unreadByConvo]);
  const notifCount = (pendingRequests?.length || 0) + notifications.filter((n) => n.type === 'message').length;
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Keep date fresh for header display
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
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
    const onReceiveAny = (msg) => {
      // Maintain name map and unread counts for background conversations
      const myEmail = String(user?.email || '').toLowerCase();
      const fromEmail = String(msg.fromEmail || '').toLowerCase();
      const toEmail = String(msg.toEmail || '').toLowerCase();
      const peer = fromEmail === myEmail ? toEmail : fromEmail;
      if (msg.fromName && peer) {
        setDisplayNameByEmail((m) => ({ ...m, [peer]: msg.fromName }));
      }
      const activePeer = String(selectedEmail || composeTo || '').toLowerCase();
      const inbound = fromEmail !== myEmail;
      if (inbound && peer && peer !== activePeer && msg.conversationId) {
        setUnreadByConvo((m) => ({ ...m, [msg.conversationId]: (m[msg.conversationId] || 0) + 1 }));
        const label = msg.fromName || displayNameByEmail[peer] || peer;
        setNotifications((list) => [
          { type: 'message', text: `New message from ${label}`, ts: Date.now(), conversationId: msg.conversationId, peerEmail: peer },
          ...list
        ].slice(0, 30));
      }
    };
    socket.on('receive_message', onReceiveAny);
    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    return () => {
      socket.off('receive_message', onReceiveAny);
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

  // Load pending chat requests
  useEffect(() => {
    (async () => {
      try {
        const r = await chatApi.listPendingRequests();
        if (r?.success) setPendingRequests(r.data || []);
        // Seed display names from pending requests (farmer side)
        const seed = {};
        (r?.data || []).forEach((it) => {
          const email = String(it?.farmer?.email || '').toLowerCase();
          const name = it?.farmer?.name;
          if (email && name) seed[email] = name;
        });
        if (Object.keys(seed).length) setDisplayNameByEmail((m) => ({ ...seed, ...m }));
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
          <h1 className="text-2xl font-bold ag-display">Expert Dashboard</h1>
          <p className="mt-1 text-gray-600">{greeting}, {user?.name || 'Expert'}. Manage consultations and messages.</p>
        </div>
        <div className="ag-card px-4 py-2 flex items-center gap-3 relative">
          {/* Date */}
          <div className="hidden sm:flex items-center gap-2 px-2 text-gray-600">
            <svg className="w-4 h-4 text-[var(--ag-primary-600)]" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2a1 1 0 011 1v1h10V3a1 1 0 112 0v1h1a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zm-3 6v10a1 1 0 001 1h16a1 1 0 001-1V8H3z"/></svg>
            <span className="text-sm">{now.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {/* Notification bell */}
          <div className="relative">
            <button onClick={() => setShowNotifMenu((s) => !s)} className="px-2 py-2 rounded-lg border border-[var(--ag-border)] hover:bg-gray-50 relative flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 004 13h12a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
              {notifCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex items-center justify-center text-[10px] h-4 min-w-4 px-1 rounded-full bg-green-600 text-white">{notifCount}</span>
              )}
            </button>
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[var(--ag-border)] rounded-lg shadow z-10 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 text-sm font-semibold border-b border-[var(--ag-border)]">Notifications</div>
                {pendingRequests.map((r) => (
                  <div key={`req-${r._id}`} className="px-3 py-2 text-sm hover:bg-gray-50">
                    New chat request from <span className="font-medium">{r.farmer?.name || r.farmer?.email || 'Farmer'}</span>
                  </div>
                ))}
                {notifications.map((n, idx) => (
                  <button key={`n-${idx}`} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={async () => {
                    // Open conversation when clicking a message notif
                    if (n.conversationId && n.peerEmail) {
                      setSelectedEmail(n.peerEmail);
                      const msgs = await chatApi.listMessages(n.conversationId);
                      if (msgs?.success) {
                        const myEmail = String(user?.email || '').toLowerCase();
                        const hydrated = (msgs.messages || []).map((m) => ({
                          ...m,
                          inbound: String(m.fromEmail || '').toLowerCase() !== myEmail,
                          ts: new Date(m.createdAt).getTime()
                        }));
                        setMessages(hydrated);
                      }
                      try { await chatApi.markRead(n.conversationId); } catch (_) {}
                      setUnreadByConvo((m) => ({ ...m, [n.conversationId]: 0 }));
                      // Remove this message notification immediately
                      setNotifications((list) => list.filter((x, i) => i !== idx));
                      setShowNotifMenu(false);
                      setActiveTab('chat');
                    }
                  }}>
                    {n.text}
                  </button>
                ))}
                {pendingRequests.length === 0 && notifications.length === 0 && (
                  <div className="px-3 py-3 text-sm text-gray-500">No notifications</div>
                )}
              </div>
            )}
          </div>
          <div className="ml-3 relative">
            <button onClick={() => setShowProfileMenu((s) => !s)} className="px-3 py-2 text-sm rounded-lg border border-[var(--ag-border)] hover:bg-gray-50 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center font-semibold">
                {(String(user?.name || user?.email || 'E').charAt(0) || 'E').toUpperCase()}
              </span>
              <span className="hidden sm:block">{user?.name || user?.email || 'Expert'}</span>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-[var(--ag-border)] rounded-lg shadow z-10">
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => setShowProfileMenu(false)}>Profile Settings</button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Conversations" value={conversations.length} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m-1 7l-4-4H7a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v6a4 4 0 01-4 4h-3l-4 4z"/></svg>} />
        <StatCard title="Pending Requests" value={pendingRequests.length} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>} />
        <StatCard title="Unread Messages" value={totalUnread} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8"/></svg>} />
        <StatCard title="Availability" value={availability ? 'Online' : 'Offline'} icon={<span className={`w-2 h-2 rounded-full ${availability ? 'bg-green-500' : 'bg-gray-400'}`}></span>} />
      </div>

      {/* Tabs */}
      <div className="ag-card p-2 flex gap-2">
        <button onClick={() => setActiveTab('chat')} className={`px-3 py-2 rounded-lg text-sm relative ${activeTab === 'chat' ? 'bg-[var(--ag-primary-500)] text-white' : 'bg-[var(--ag-muted)]'}`}>
          Chat
          {totalUnread > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex items-center justify-center text-[10px] h-4 min-w-4 px-1 rounded-full bg-green-600 text-white">{totalUnread}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('requests')} className={`px-3 py-2 rounded-lg text-sm relative ${activeTab === 'requests' ? 'bg-[var(--ag-primary-500)] text-white' : 'bg-[var(--ag-muted)]'}`}>
          Requests
          {(pendingRequests?.length || 0) > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex items-center justify-center text-[10px] h-4 min-w-4 px-1 rounded-full bg-green-600 text-white">{pendingRequests.length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('trends')} className={`px-3 py-2 rounded-lg text-sm relative ${activeTab === 'trends' ? 'bg-[var(--ag-primary-500)] text-white' : 'bg-[var(--ag-muted)]'}`}>
          Sowing Trends
        </button>
      </div>

      {/* Overview Content */}
      {/* Overview removed */}

      {/* Requests Content */}
      {activeTab === 'requests' && (
        <div className="ag-card p-0 overflow-hidden">
          <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)] flex items-center justify-between">
            <div className="font-semibold">Chat Requests</div>
            <button
              className="text-sm px-3 py-1 border rounded"
              onClick={async () => { const r = await chatApi.listPendingRequests(); if (r?.success) setPendingRequests(r.data || []); }}
            >Refresh</button>
          </div>
          <div className="divide-y divide-[var(--ag-border)]">
            {pendingRequests.map((r) => (
              <div key={r._id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{r.farmer?.name || r.farmer?.email || 'Farmer'}</div>
                  <div className="text-xs text-gray-600">{r.farmer?.email}</div>
                  {r.farmerNote && <div className="text-xs mt-1">“{r.farmerNote}”</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded"
                    onClick={async () => {
                      const res = await chatApi.approveRequest(r._id);
                      if (res?.success) {
                        setPendingRequests((list) => list.filter((x) => x._id !== r._id));
                      }
                    }}
                  >Accept</button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={async () => {
                      const res = await chatApi.rejectRequest(r._id);
                      if (res?.success) {
                        setPendingRequests((list) => list.filter((x) => x._id !== r._id));
                      }
                    }}
                  >Reject</button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No pending requests.</div>
            )}
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
                  const peerEmailLocal = (c.participantEmails || []).find(e => e !== (user?.email || '').toLowerCase()) || '';
                  setSelectedEmail(peerEmailLocal);
                  const msgs = await chatApi.listMessages(c._id);
                  if (msgs?.success) {
                    const myEmail = String(user?.email || '').toLowerCase();
                    const hydrated = (msgs.messages || []).map((m) => ({
                      ...m,
                      inbound: String(m.fromEmail || '').toLowerCase() !== myEmail,
                      ts: new Date(m.createdAt).getTime()
                    }));
                    setMessages(hydrated);
                  }
                  // Mark as read and clear unread count for this conversation
                  try { await chatApi.markRead(c._id); } catch (_) {}
                  setUnreadByConvo((m) => ({ ...m, [c._id]: 0 }));
                }} className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedEmail && (c.participantEmails||[]).includes(selectedEmail) ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {(() => {
                        const peer = ((c.participantEmails||[]).find(e => e !== (user?.email || '').toLowerCase())) || '';
                        const label = displayNameByEmail[String(peer).toLowerCase()] || peer || 'Conversation';
                        return label;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      {(unreadByConvo[c._id] || 0) > 0 && (
                        <span className="inline-flex items-center justify-center text-[10px] h-5 min-w-5 px-1 rounded-full bg-green-600 text-white">
                          {unreadByConvo[c._id]}
                        </span>
                      )}
                      <div className="text-xs text-gray-500">{new Date(c.lastMessageAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 truncate">{c.lastMessageText}</div>
                  <div className="text-xs text-gray-500">{(() => {
                    const peer = ((c.participantEmails||[]).find(e => e !== (user?.email || '').toLowerCase())) || '';
                    return displayNameByEmail[String(peer).toLowerCase()] || peer;
                  })()}</div>
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

      {/* Trends Content */}
      {activeTab === 'trends' && (
        <SowingTrendsDashboard />
      )}
    </div>
  );
};

export default ExpertDashboard;


