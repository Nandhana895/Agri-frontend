import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Mail, TrendingUp, Heart, CheckCircle, Star, User, Bell, ChevronDown, LogOut, Sun, Cloud, Droplets, Calendar as CalendarIcon, MapPin, Menu, X, Mic, Send, Search, Download, Pin, StopCircle, XCircle } from 'lucide-react';
import { getSocket } from '../services/socket';
import { chatApi } from '../services/api';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import SowingTrendsDashboard from '../Components/SowingTrendsDashboard';
import ManageProfileModal from '../Components/ManageProfileModal';
import config from '../config/config';

const StatCard = ({ title, value, icon: Icon, trend, subtitle, color = "emerald" }) => {
  const colorClasses = {
    emerald: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    orange: 'from-orange-500 to-amber-600',
    purple: 'from-purple-500 to-pink-600',
    teal: 'from-teal-500 to-emerald-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-6 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group"
    >
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-700 mb-2">{title}</div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="text-xs text-emerald-600 mt-1">{subtitle}</div>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}% from last week</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white flex items-center justify-center shadow-lg shadow-${color}-500/30 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );
};
const ExpertDashboard = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); // {type:'request'|'message', text, ts, conversationId?, peerEmail?}
  const [now, setNow] = useState(() => new Date());
  const [presenceByEmail, setPresenceByEmail] = useState({});
  const [chatSearch, setChatSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const isCancelingRecordingRef = useRef(false);
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

  // Listen for user profile updates
  useEffect(() => {
    const handleUserUpdate = (event) => {
      setUser(event.detail);
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
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
      <div className="mt-3 space-y-2">
        {atts.map((a, idx) => {
          const url = toAttachmentUrl(a);
          if ((a.mimeType || '').startsWith('image/')) {
            return <img key={idx} src={url} alt={a.originalName} className="max-w-[200px] rounded-xl border-2 border-emerald-200/50 shadow-md" />;
          }
          if ((a.mimeType || '').startsWith('audio/')) {
            return (
              <div key={idx} className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Voice Message</span>
                </div>
                <audio src={url} controls className="w-full" style={{height: '32px'}} />
              </div>
            );
          }
          return <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs underline text-emerald-600 hover:text-emerald-800">{a.originalName}</a>;
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      // Reset cancel flag
      isCancelingRecordingRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        // Only upload if we're not canceling (use ref for reliable check)
        if (!isCancelingRecordingRef.current) {
          uploadAudioMessage(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordingTime(0);

      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access denied. Please allow microphone access to send voice messages.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      isCancelingRecordingRef.current = false; // Ensure this is a normal stop, not a cancel
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      // Set cancel flag BEFORE stopping so onstop handler knows we're canceling
      isCancelingRecordingRef.current = true;
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setRecordingTime(0);
      setAudioChunks([]);
      mediaRecorder.stop();
    }
  };

  const uploadAudioMessage = async (audioBlob) => {
    if (!currentConversationId || !selectedEmail) {
      alert('Please select a conversation first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('conversationId', currentConversationId);
      formData.append('text', '');

      const response = await fetch(`${config.API_URL}/chat/upload-audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Add the message to local state immediately
        setMessages(prev => [...prev, {
          ...result.message,
          inbound: false,
          fromName: user?.name || user?.email,
          ts: Date.now()
        }]);
        
        // Also emit via socket for real-time delivery to the other user
        const socket = getSocket();
        socket.emit('send_message', {
          toEmail: selectedEmail,
          text: '',
          attachments: result.message?.attachments || []
        });
      } else {
        alert(result.message || 'Failed to send voice message');
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to send voice message. Please try again.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [recordingInterval, mediaRecorder, isRecording]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Subtle Agricultural Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="expert-agricultural-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 5 L20 15 M15 10 L25 10 M20 25 L20 35 M15 30 L25 30" stroke="#10b981" strokeWidth="0.5" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#expert-agricultural-pattern)" />
        </svg>
      </div>

      {/* Enhanced Agricultural Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-green-600 via-emerald-700 to-teal-800 shadow-2xl shadow-emerald-500/20"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10"></div>
                <svg className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white ag-display">Agricultural Expert Portal</h1>
                <p className="text-emerald-100 mt-1">{greeting}, <span className="font-semibold">{user?.name || 'Expert'}</span> • Guide farmers with your expertise</p>
              </div>
            </div>
            
            {/* Right Section - Widgets */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Weather Widget */}
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-4 py-3 text-white border border-white/10 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center space-x-3">
                  <Sun className="w-5 h-5 text-yellow-300" />
                  <div>
                    <div className="text-xs font-medium text-emerald-100">Weather</div>
                    <div className="text-sm font-bold">28°C • Sunny</div>
                  </div>
                </div>
              </div>
              
              {/* Expert Status */}
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-4 py-3 text-white border border-white/10 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${availability ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} shadow-lg ${availability ? 'shadow-green-400/50' : ''}`}></div>
                  <div>
                    <div className="text-xs font-medium text-emerald-100">Status</div>
                    <div className="text-sm font-bold">{availability ? 'Available' : 'Away'}</div>
                  </div>
                </div>
              </div>
            
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifMenu((s) => !s)} 
                  className="relative p-2.5 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white/30 transition-all border border-white/10 shadow-lg shadow-emerald-500/10 group"
                >
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                      {notifCount}
                    </span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-xl border-2 border-emerald-200/50 rounded-2xl shadow-2xl shadow-emerald-500/20 z-50 max-h-96 overflow-y-auto custom-scrollbar"
                    >
                      <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-xl">
                            <Bell className="w-5 h-5 text-emerald-700" />
                          </div>
                          <h3 className="text-lg font-bold text-emerald-900">Notifications</h3>
                        </div>
                      </div>
                      <div className="divide-y divide-emerald-100">
                        {pendingRequests.map((r, idx) => (
                          <motion.div
                            key={`req-${r._id}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="px-4 py-3 hover:bg-emerald-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-emerald-800">
                                New chat request from <span className="font-semibold text-emerald-900">{r.farmer?.name || r.farmer?.email || 'Farmer'}</span>
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        {notifications.map((n, idx) => (
                          <button 
                            key={`n-${idx}`} 
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 transition-colors" 
                            onClick={async () => {
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
                          }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-emerald-800">{n.text}</span>
                            </div>
                          </button>
                        ))}
                        {pendingRequests.length === 0 && notifications.length === 0 && (
                          <div className="px-4 py-8 text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <Bell className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-emerald-700 font-medium">All caught up!</p>
                            <p className="text-xs text-emerald-600 mt-1">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Profile Menu */}
              <div className="relative profile-menu-container">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)} 
                  className="flex items-center gap-3 pl-2 pr-4 py-2 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white/30 transition-all border border-white/10 shadow-lg shadow-emerald-500/10 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center font-bold text-sm shadow-lg ring-2 ring-white/20 overflow-hidden">
                    {user?.avatarUrl ? (
                      <img 
                        src={(() => { 
                          const u = user.avatarUrl || ''; 
                          return u.startsWith('http') ? u : `${new URL(config.API_URL).origin}${u}`; 
                        })()} 
                        alt="avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      (String(user?.name || user?.email || 'E').charAt(0) || 'E').toUpperCase()
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-bold">{user?.name || user?.email || 'Expert'}</div>
                    <div className="text-xs text-emerald-100">Agricultural Expert</div>
                  </div>
                  <ChevronDown className={`hidden sm:block w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-500/20 py-2 z-50 border-2 border-emerald-200/50 overflow-hidden"
                    >
                      <div className="px-4 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 font-bold overflow-hidden">
                            {user?.avatarUrl ? (
                              <img 
                                src={(() => { 
                                  const u = user.avatarUrl || ''; 
                                  return u.startsWith('http') ? u : `${new URL(config.API_URL).origin}${u}`; 
                                })()} 
                                alt="avatar" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              (String(user?.name || user?.email || 'E').charAt(0) || 'E').toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-emerald-900 truncate">{user?.name || user?.email || 'Expert'}</div>
                            <div className="text-xs text-emerald-600 truncate">{user?.email}</div>
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-medium">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Expert
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button 
                          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setIsProfileModalOpen(true);
                          }}
                        >
                          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-emerald-900">Profile Settings</div>
                            <div className="text-xs text-emerald-600">Manage your account</div>
                          </div>
                        </button>
                        <button 
                          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                        >
                          <div className="p-2 bg-red-100 rounded-lg text-red-700 group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-red-900">Logout</div>
                            <div className="text-xs text-red-600">Sign out from portal</div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-6 py-8 space-y-8">

      {/* Agricultural KPI Dashboard */}
      <div className="relative space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 ag-display bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">Expert Analytics</h2>
            <p className="text-emerald-600 mt-1">Track your consultation performance and farmer support metrics</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 backdrop-blur-xl border border-emerald-200/50 shadow-lg shadow-emerald-500/10">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Active Consultations" 
            value={conversations.length} 
            subtitle="Ongoing farmer support"
            trend={12}
            color="emerald"
            icon={MessageSquare} 
          />
          
          <StatCard 
            title="Pending Requests" 
            value={pendingRequests.length} 
            subtitle="Awaiting approval"
            trend={-5}
            color="orange"
            icon={Clock} 
          />
          
          <StatCard 
            title="Unread Messages" 
            value={totalUnread} 
            subtitle="Require attention"
            trend={8}
            color="blue"
            icon={Mail} 
          />
          
          <StatCard 
            title="Response Rate" 
            value="94%" 
            subtitle="This month"
            trend={3}
            color="purple"
            icon={CheckCircle} 
          />
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200/50 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-emerald-700">Farmers Helped Today</div>
                <div className="text-3xl font-bold text-emerald-900 mt-1">12</div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2 from yesterday</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 rounded-2xl p-6 border-2 border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-blue-700">Crop Issues Resolved</div>
                <div className="text-3xl font-bold text-blue-900 mt-1">8</div>
                <div className="text-xs text-blue-600 mt-1">This week</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200/50 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-orange-700">Expert Rating</div>
                <div className="text-3xl font-bold text-orange-900 mt-1">4.8/5</div>
                <div className="text-xs text-orange-600 mt-1">Based on 47 reviews</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <Star className="w-7 h-7 text-white fill-white" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative max-w-7xl mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-emerald-200/50 p-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={() => setActiveTab('chat')} 
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-200 relative group ${
                activeTab === 'chat' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]' 
                  : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <MessageSquare className="w-5 h-5 mr-2" strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
              <span>Farmer Consultations</span>
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                  {totalUnread}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('requests')} 
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-200 relative group ${
                activeTab === 'requests' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02]' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-900'
              }`}
            >
              <Clock className="w-5 h-5 mr-2" strokeWidth={activeTab === 'requests' ? 2.5 : 2} />
              <span>Pending Requests</span>
              {(pendingRequests?.length || 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('trends')} 
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                activeTab === 'trends' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-900'
              }`}
            >
              <TrendingUp className="w-5 h-5 mr-2" strokeWidth={activeTab === 'trends' ? 2.5 : 2} />
              <span>Agricultural Trends</span>
            </button>
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Enhanced Conversations List */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-emerald-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 px-6 py-4 border-b-2 border-emerald-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                  <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900">Farmer Consultations</h3>
                  <p className="text-xs text-emerald-600">Active conversations with farmers</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Start new chat by farmer email..."
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="flex-1 px-4 py-2.5 border-2 border-emerald-200/50 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder:text-emerald-600/60"
                />
                <button 
                  onClick={() => { openByEmail(composeTo.trim()); }} 
                  className="p-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 group"
                >
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {conversations.map((c, idx) => (
                <motion.button 
                  key={c._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
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
                  className={`w-full text-left p-4 hover:bg-emerald-50/50 transition-all border-b border-emerald-100 ${
                    selectedEmail && (c.participantEmails||[]).includes(selectedEmail) 
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-l-emerald-500 shadow-sm' 
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                      <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-emerald-900 truncate">
                          {(() => {
                            const peer = ((c.participantEmails||[]).find(e => e !== (user?.email || '').toLowerCase())) || '';
                            const label = displayNameByEmail[String(peer).toLowerCase()] || peer || 'Farmer';
                            return label;
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          {(unreadByConvo[c._id] || 0) > 0 && (
                            <span className="inline-flex items-center justify-center text-xs h-5 min-w-5 px-1.5 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white font-bold shadow-lg shadow-red-500/50 animate-pulse">
                              {unreadByConvo[c._id]}
                            </span>
                          )}
                          <div className="text-xs text-emerald-600 font-medium">
                            {new Date(c.lastMessageAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-emerald-700 truncate mb-1">{c.lastMessageText || 'No messages yet'}</div>
                      <div className="text-xs text-emerald-600">
                        {(() => {
                          const peer = ((c.participantEmails||[]).find(e => e !== (user?.email || '').toLowerCase())) || '';
                          return displayNameByEmail[String(peer).toLowerCase()] || peer;
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
              
              {conversations.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 font-medium">No conversations yet</p>
                  <p className="text-sm text-emerald-600 mt-1">Start helping farmers above</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Chat Panel */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-emerald-200/50 overflow-hidden lg:col-span-2">
            <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 px-6 py-4 border-b-2 border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900">
                      {selectedEmail || (composeTo ? composeTo : 'Select a conversation')}
                    </div>
                    {selectedEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        {presenceByEmail[String(selectedEmail).toLowerCase()]?.online ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span>Online</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700">{formatLastSeen(presenceByEmail[String(selectedEmail).toLowerCase()]?.lastActiveAt)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      value={chatSearch} 
                      onChange={(e) => setChatSearch(e.target.value)} 
                      placeholder="Search messages..." 
                      className="px-3 py-2 text-sm border-2 border-emerald-200/50 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-emerald-600/60" 
                    />
                    <button 
                      type="button" 
                      onClick={doSearch} 
                      className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 group"
                    >
                      <Search className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={downloadPdf} 
                    className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 group"
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                  </button>
                  
                  <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 bg-white border-2 border-emerald-200/50 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors">
                    <input type="checkbox" checked={pinnedOnly} onChange={(e) => setPinnedOnly(e.target.checked)} className="rounded border-emerald-300" />
                    <Pin className="w-4 h-4" />
                  </label>
                </div>
              </div>
              
              {isOtherTyping && (selectedEmail || composeTo) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-3 text-sm text-emerald-700"
                >
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="font-medium">Farmer is typing...</span>
                </motion.div>
              )}
            </div>
            <div ref={scrollContainerRef} className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white custom-scrollbar">
              {visibleMessages.map((m, i) => (
                <motion.div
                  key={`${m._id || ''}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex ${m.inbound ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-md px-5 py-3.5 rounded-2xl shadow-lg ${
                    m.inbound 
                      ? 'bg-white border-2 border-emerald-200/50' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-emerald-500/30'
                  }`}>
                    <div className={`text-xs font-bold mb-2 ${m.inbound ? 'text-emerald-600' : 'text-emerald-100'}`}>
                      {m.inbound ? `${m.fromName || m.fromEmail}` : 'You (Expert)'}
                    </div>
                    {m.text && <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.text}</div>}
                    {Array.isArray(m.attachments) && <AttachmentView atts={m.attachments} />}
                    <div className={`text-xs mt-2.5 flex items-center justify-between font-medium ${
                      m.inbound ? 'text-emerald-600' : 'text-emerald-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        {m._id && (
                          <button 
                            type="button" 
                            className="hover:underline flex items-center gap-1" 
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
                            <Pin className="w-3 h-3" />
                            {m.pinned ? 'Unpin' : 'Pin'}
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
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                    <MessageSquare className="w-10 h-10 text-emerald-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900 mb-2">Start the Conversation</h3>
                  <p className="text-emerald-700">Send a message to begin helping this farmer with their agricultural needs.</p>
                  <div className="mt-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-xs text-emerald-600">💡 You can send text or voice messages</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Message Input Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200/50">
              <form onSubmit={send} className="p-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Type your agricultural advice to help the farmer..."
                      rows={1}
                      disabled={isRecording}
                      className="w-full px-4 py-3 border-2 border-emerald-200/50 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-gray-800 placeholder:text-emerald-600/60 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  {/* Voice Recording Button */}
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={!selectedEmail && !composeTo}
                      className="p-3 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all shadow-lg shadow-red-500/30 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-500 disabled:hover:to-pink-600"
                      title={!selectedEmail && !composeTo ? "Select a conversation first" : "Record Voice Message"}
                    >
                      <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 group"
                        title="Stop Recording & Send"
                      >
                        <StopCircle className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="p-3 bg-gradient-to-br from-gray-500 to-gray-700 text-white rounded-xl hover:from-gray-600 hover:to-gray-800 transition-all shadow-lg shadow-gray-500/30 group"
                        title="Cancel Recording"
                      >
                        <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                  
                  {/* Send Button */}
                  <button 
                    type="submit"
                    disabled={isRecording || (!text.trim() && !isRecording)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                    <span className="font-semibold">Send</span>
                  </button>
                </div>
              </form>
              
              {/* Recording Indicator */}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-3 bg-red-50 border-t border-red-200 flex items-center gap-3"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  <span className="text-sm font-semibold text-red-700">Recording voice message...</span>
                  <span className="text-sm text-red-600 font-mono">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                </motion.div>
              )}
            </div>
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

      {/* Manage Profile Modal */}
      {isProfileModalOpen && (
        <ManageProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          user={user} 
        />
      )}
    </div>
  );
};

export default ExpertDashboard;


