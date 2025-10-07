import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '../services/socket';
import { chatApi } from '../services/api';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import SowingTrendsDashboard from '../Components/SowingTrendsDashboard';
import config from '../config/config';

const StatCard = ({ title, value, icon, trend, subtitle, color = "green" }) => {
  const colorClasses = {
    green: "from-green-500 to-emerald-600",
    blue: "from-blue-500 to-cyan-600", 
    orange: "from-orange-500 to-amber-600",
    purple: "from-purple-500 to-violet-600"
  };
  
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              <svg className={`w-4 h-4 mr-1 ${trend > 0 ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  </div>
);
};
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
  const [presenceByEmail, setPresenceByEmail] = useState({});
  const [chatSearch, setChatSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

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
    const onRead = (payload = {}) => {
      const ids = new Set((payload.messageIds || []).map(String));
      if (!ids.size) return;
      setMessages((arr) => arr.map((m) => (ids.has(String(m._id)) ? { ...m, readAt: new Date().toISOString() } : m)));
    };
    const onPresence = (p = {}) => {
      const email = String(p.email || '').toLowerCase();
      if (!email) return;
      setPresenceByEmail((m) => ({ ...m, [email]: { online: !!p.online, lastActiveAt: p.lastActiveAt } }));
      setAvailability(!!p.online);
    };
    socket.on('receive_message', onReceiveAny);
    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    socket.on('messages_read', onRead);
    socket.on('presence', onPresence);
    return () => {
      socket.off('receive_message', onReceiveAny);
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
      socket.off('messages_read', onRead);
      socket.off('presence', onPresence);
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
    const filtered = messages.filter((m) => {
      const fromEmail = String(m.fromEmail || '').toLowerCase();
      const toEmail = String(m.toEmail || '').toLowerCase();
      return fromEmail === peer || toEmail === peer;
    });
    return pinnedOnly ? filtered.filter((m) => m.pinned) : filtered;
  }, [messages, selectedEmail, composeTo, pinnedOnly]);

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

  const formatLastSeen = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return `last seen ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (_) { return ''; }
  };

  const baseUrl = useMemo(() => (config.API_URL || '').replace(/\/$/, ''), []);
  const toAttachmentUrl = (att) => {
    const p = String(att?.path || '');
    const fname = p.startsWith('uploads/') ? p.slice('uploads/'.length) : p;
    return `${baseUrl}/admin/uploads/${fname}`;
  };

  const MessageStatus = ({ m }) => {
    if (m.inbound) return null;
    const delivered = Boolean(m.deliveredAt || (!m._id && m.ts));
    const read = Boolean(m.readAt);
    return (
      <span className={`ml-1 text-[10px] ${read ? 'text-blue-500' : (delivered ? 'text-gray-500' : 'text-gray-400')}`}
        title={read ? 'Read' : delivered ? 'Delivered' : 'Sent'}>
        {read ? '✔✔' : delivered ? '✔✔' : '✔'}
      </span>
    );
  };

  const AttachmentView = ({ atts = [] }) => {
    if (!atts.length) return null;
    return (
      <div className="mt-2 space-y-2">
        {atts.map((a, idx) => {
          const url = toAttachmentUrl(a);
          if ((a.mimeType || '').startsWith('image/')) {
            return <img key={idx} src={url} alt={a.originalName} className="max-w-[200px] rounded" />;
          }
          if ((a.mimeType || '').startsWith('audio/')) {
            return <audio key={idx} src={url} controls className="w-64" />;
          }
          return <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs underline">{a.originalName}</a>;
        })}
      </div>
    );
  };

  const currentConversationId = useMemo(() => {
    if (!selectedEmail) return null;
    const peer = String(selectedEmail).toLowerCase();
    const me = String(user?.email || '').toLowerCase();
    const convo = conversations.find((c) => (c.participantEmails || []).includes(peer) && (c.participantEmails || []).includes(me));
    return convo?._id || null;
  }, [selectedEmail, conversations, user]);

  const doSearch = async () => {
    if (!currentConversationId || !chatSearch.trim()) { setSearchResults([]); return; }
    try {
      const res = await chatApi.searchMessages(currentConversationId, chatSearch.trim());
      setSearchResults(Array.isArray(res?.results) ? res.results : []);
    } catch (_) { setSearchResults([]); }
  };

  const downloadPdf = async () => {
    if (!currentConversationId) return;
    try {
      const blob = await chatApi.exportConversation(currentConversationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `conversation_${currentConversationId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Agricultural Hero Header */}
      <div className="relative bg-gradient-to-r from-green-600 via-green-700 to-emerald-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative z-10 px-6 py-8">
      <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
        <div>
                <h1 className="text-3xl font-bold text-white ag-display">Agricultural Expert Portal</h1>
                <p className="text-green-100 mt-1">{greeting}, {user?.name || 'Expert'}. Guide farmers with your expertise.</p>
        </div>
          </div>
            
            {/* Weather Widget */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-white">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium">Today's Weather</div>
                    <div className="text-xs text-green-100">28°C • Partly Cloudy</div>
                  </div>
                </div>
              </div>
              
              {/* Expert Status */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-white">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${availability ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="text-xs text-green-100">{availability ? 'Available' : 'Away'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile & Notifications */}
            <div className="flex items-center space-x-3">
          {/* Notification bell */}
          <div className="relative">
                <button onClick={() => setShowNotifMenu((s) => !s)} className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white hover:bg-white/30 transition-colors relative">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 004 13h12a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                  </svg>
              {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-xs h-5 min-w-5 px-1 rounded-full bg-red-500 text-white">{notifCount}</span>
              )}
            </button>
            {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                    <div className="px-4 py-3 text-sm font-semibold border-b border-gray-200 bg-gray-50 rounded-t-2xl">Notifications</div>
                {pendingRequests.map((r) => (
                      <div key={`req-${r._id}`} className="px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>New chat request from <span className="font-medium text-green-700">{r.farmer?.name || r.farmer?.email || 'Farmer'}</span></span>
                        </div>
                  </div>
                ))}
                {notifications.map((n, idx) => (
                      <button key={`n-${idx}`} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100" onClick={async () => {
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
                      setNotifications((list) => list.filter((x, i) => i !== idx));
                      setShowNotifMenu(false);
                      setActiveTab('chat');
                    }
                  }}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{n.text}</span>
                        </div>
                  </button>
                ))}
                {pendingRequests.length === 0 && notifications.length === 0 && (
                      <div className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</div>
                )}
              </div>
            )}
          </div>
              
              {/* Profile Menu - Simplified */}
              <div className="relative profile-menu-container">
                <button 
                  onClick={() => {
                    console.log('Profile clicked, current state:', showProfileMenu);
                    setShowProfileMenu(!showProfileMenu);
                  }} 
                  className={`flex items-center space-x-3 p-2 backdrop-blur-sm rounded-2xl text-white transition-colors ${
                    showProfileMenu ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-semibold text-sm">
                    {(String(user?.name || user?.email || 'E').charAt(0) || 'E').toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{user?.name || user?.email || 'Expert'}</div>
                    <div className="text-xs text-green-100">Agricultural Expert</div>
                  </div>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                    <div className="py-1">
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </button>
                      
                      <div className="border-t border-gray-100"></div>
                      
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">

      {/* Agricultural KPI Dashboard */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 ag-display">Expert Analytics</h2>
          <div className="text-sm text-gray-500">
            Last updated: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Active Consultations" 
            value={conversations.length} 
            subtitle="Ongoing farmer support"
            trend={12}
            color="green"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>} 
          />
          
          <StatCard 
            title="Pending Requests" 
            value={pendingRequests.length} 
            subtitle="Awaiting approval"
            trend={-5}
            color="orange"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>} 
          />
          
          <StatCard 
            title="Unread Messages" 
            value={totalUnread} 
            subtitle="Require attention"
            trend={8}
            color="blue"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>} 
          />
          
          <StatCard 
            title="Response Rate" 
            value="94%" 
            subtitle="This month"
            trend={3}
            color="purple"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>} 
          />
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700">Farmers Helped Today</div>
                <div className="text-2xl font-bold text-green-900 mt-1">12</div>
                <div className="text-xs text-green-600 mt-1">+2 from yesterday</div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700">Crop Issues Resolved</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">8</div>
                <div className="text-xs text-blue-600 mt-1">This week</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700">Expert Rating</div>
                <div className="text-2xl font-bold text-orange-900 mt-1">4.8/5</div>
                <div className="text-xs text-orange-600 mt-1">Based on 47 reviews</div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
              activeTab === 'chat' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Farmer Consultations
          {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-xs h-5 min-w-5 px-1 rounded-full bg-red-500 text-white font-bold">
                {totalUnread}
              </span>
          )}
        </button>
          
          <button 
            onClick={() => setActiveTab('requests')} 
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
              activeTab === 'requests' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Pending Requests
          {(pendingRequests?.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-xs h-5 min-w-5 px-1 rounded-full bg-red-500 text-white font-bold">
                {pendingRequests.length}
              </span>
          )}
        </button>
          
          <button 
            onClick={() => setActiveTab('trends')} 
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'trends' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Agricultural Trends
        </button>
        </div>
      </div>

      {/* Overview Content */}
      {/* Overview removed */}

      {/* Requests Content */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Farmer Consultation Requests</h3>
                    <p className="text-sm text-gray-600">Review and approve new consultation requests from farmers</p>
                  </div>
                </div>
            <button
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-orange-200 rounded-xl text-orange-700 hover:bg-orange-50 transition-colors"
              onClick={async () => { const r = await chatApi.listPendingRequests(); if (r?.success) setPendingRequests(r.data || []); }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>Refresh</span>
                </button>
          </div>
            </div>
            
            <div className="divide-y divide-gray-100">
            {pendingRequests.map((r) => (
                <div key={r._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{r.farmer?.name || 'Farmer'}</h4>
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                            New Request
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{r.farmer?.email}</p>
                        {r.farmerNote && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-700 italic">"{r.farmerNote}"</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>Requested {new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                  <button
                        className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                    onClick={async () => {
                          const res = await chatApi.rejectRequest(r._id);
                      if (res?.success) {
                        setPendingRequests((list) => list.filter((x) => x._id !== r._id));
                      }
                    }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <span>Decline</span>
                      </button>
                  <button
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                    onClick={async () => {
                          const res = await chatApi.approveRequest(r._id);
                      if (res?.success) {
                        setPendingRequests((list) => list.filter((x) => x._id !== r._id));
                      }
                    }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>Accept</span>
                      </button>
                    </div>
                </div>
              </div>
            ))}
              
            {pendingRequests.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-500">No pending consultation requests at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Content */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-xl">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Farmer Consultations</h3>
                  <p className="text-sm text-gray-600">Active conversations with farmers</p>
                </div>
              </div>
              <div className="flex gap-2">
              <input
                placeholder="Start new chat by email"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                  className="flex-1 px-4 py-2 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button 
                  onClick={(e) => { openByEmail(composeTo.trim()); }} 
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </button>
            </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {conversations.map((c) => (
                <button 
                  key={c._id} 
                  onClick={async () => {
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
                  try { await chatApi.markRead(c._id); } catch (_) {}
                  setUnreadByConvo((m) => ({ ...m, [c._id]: 0 }));
                  }} 
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedEmail && (c.participantEmails||[]).includes(selectedEmail) 
                      ? 'bg-green-50 border-l-4 border-l-green-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900 truncate">
                      {(() => {
                        const peer = ((c.participantEmails||[]).find(e => e !== (user?.email || '').toLowerCase())) || '';
                            const label = displayNameByEmail[String(peer).toLowerCase()] || peer || 'Farmer';
                        return label;
                      })()}
                    </div>
                        <div className="flex items-center space-x-2">
                      {(unreadByConvo[c._id] || 0) > 0 && (
                            <span className="inline-flex items-center justify-center text-xs h-5 min-w-5 px-1 rounded-full bg-red-500 text-white font-bold">
                          {unreadByConvo[c._id]}
                        </span>
                      )}
                          <div className="text-xs text-gray-500">
                            {new Date(c.lastMessageAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                      </div>
                      <div className="text-sm text-gray-600 truncate mb-1">{c.lastMessageText || 'No messages yet'}</div>
                      <div className="text-xs text-gray-500">
                        {(() => {
                    const peer = ((c.participantEmails||[]).find(e => e !== (user?.email || '').toLowerCase())) || '';
                    return displayNameByEmail[String(peer).toLowerCase()] || peer;
                        })()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {conversations.length === 0 && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No conversations yet. Start one above.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden lg:col-span-2">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {selectedEmail || (composeTo ? composeTo : 'Select a conversation')}
                    </div>
                  {selectedEmail && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {presenceByEmail[String(selectedEmail).toLowerCase()]?.online ? (
                          <span className="inline-flex items-center space-x-1 text-green-600">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                            <span>Online</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">{formatLastSeen(presenceByEmail[String(selectedEmail).toLowerCase()]?.lastActiveAt)}</span>
                      )}
                      </div>
                  )}
                </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      value={chatSearch} 
                      onChange={(e) => setChatSearch(e.target.value)} 
                      placeholder="Search in chat" 
                      className="px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                    <button 
                      type="button" 
                      onClick={doSearch} 
                      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={downloadPdf} 
                    className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </button>
                  
                  <label className="flex items-center space-x-2 text-sm cursor-pointer px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                    <input type="checkbox" checked={pinnedOnly} onChange={(e) => setPinnedOnly(e.target.checked)} className="rounded" />
                    <span>Pinned only</span>
                  </label>
                </div>
              </div>
              
              {isOtherTyping && (selectedEmail || composeTo) && (
                <div className="flex items-center space-x-2 mt-3 text-sm text-blue-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span>Farmer is typing...</span>
                </div>
              )}
            </div>
            <div ref={scrollContainerRef} className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {visibleMessages.map((m, i) => (
                <motion.div
                  key={`${m._id || ''}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.inbound ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    m.inbound 
                      ? 'bg-white border border-gray-200' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  }`}>
                    <div className={`text-xs font-medium mb-1 ${m.inbound ? 'text-gray-500' : 'text-green-100'}`}>
                      {m.inbound ? `${m.fromName || m.fromEmail}` : 'You'}
                    </div>
                    {m.text && <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>}
                  {Array.isArray(m.attachments) && <AttachmentView atts={m.attachments} />}
                    <div className={`text-xs mt-2 flex items-center justify-between ${
                      m.inbound ? 'text-gray-400' : 'text-green-100'
                    }`}>
                      <div className="flex items-center space-x-2">
                    {m._id && (
                          <button 
                            type="button" 
                            className="hover:underline" 
                            onClick={async () => {
                        try {
                          if (!currentConversationId) return;
                          const res = await chatApi.pinMessage(currentConversationId, m._id, !m.pinned);
                          if (res?.success) {
                            setMessages((arr) => arr.map((x) => (x._id === m._id ? { ...x, pinned: !m.pinned } : x)));
                          }
                        } catch (_) {}
                            }}
                          >
                            {m.pinned ? '📌 Unpin' : '📌 Pin'}
                          </button>
                    )}
                    <span>{formatTime(m.ts || m.createdAt)}</span>
                    <MessageStatus m={m} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {searchResults.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-2">Search Results</div>
                  {searchResults.map((m) => (
                    <div key={m._id} className="text-sm p-3 bg-white rounded-lg border border-blue-100 mb-2">
                      <div className="text-xs text-blue-600 mb-1">{new Date(m.createdAt).toLocaleString()}</div>
                      <div className="text-gray-700">{m.text}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {visibleMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
            </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation</h3>
                  <p className="text-gray-500">Send a message to begin helping this farmer with their agricultural needs.</p>
                </div>
              )}
            </div>
            
            <form onSubmit={send} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                    placeholder="Type your agricultural advice..."
                rows={1}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trends Content */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 ag-display">Agricultural Trends & Insights</h3>
                <p className="text-gray-600">Monitor sowing patterns and agricultural trends to better assist farmers</p>
              </div>
            </div>
        <SowingTrendsDashboard />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ExpertDashboard;


