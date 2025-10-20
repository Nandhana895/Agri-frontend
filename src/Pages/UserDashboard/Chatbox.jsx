import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '../../services/socket';
import authService from '../../services/authService';
import api, { chatApi } from '../../services/api';
import config from '../../config/config';

const Chatbox = () => {
  const user = authService.getCurrentUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [experts, setExperts] = useState([]);
  const [selectedExpertEmail, setSelectedExpertEmail] = useState('');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [conversationId, setConversationId] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [search, setSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [unreadByEmail, setUnreadByEmail] = useState({});
  const [presenceByEmail, setPresenceByEmail] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });
  const t = {
    en: {
      experts: 'Experts',
      searchPh: 'Search experts by name or email',
      requestChat: 'Request Chat',
      pending: 'Pending approval',
      rejected: 'Rejected',
      approved: 'Approved',
      noExperts: 'No experts available.',
      chattingWith: 'Chatting with:',
      selectExpert: '— Select an expert',
      selectToStart: 'Select an expert to start',
      needApproval: 'Request approval from the expert to start chatting.',
      typing: 'typing…',
      you: 'You',
      typeMsg: 'Type a message',
      send: 'Send',
      recordVoice: 'Record Voice',
      stopRecording: 'Stop Recording',
      recording: 'Recording...',
      uploadAudio: 'Uploading audio...',
      cancelRecording: 'Cancel'
    },
    ml: {
      experts: 'വിദഗ്ധർ',
      searchPh: 'പേര് അല്ലെങ്കിൽ ഇമെയിൽ ഉപയോഗിച്ച് വിദഗ്ധരെ തിരയുക',
      requestChat: 'ചാറ്റ് അഭ്യർത്ഥിക്കുക',
      pending: 'അംഗീകാരം കാത്തിരിക്കുന്നു',
      rejected: 'നിരസിച്ചു',
      approved: 'അംഗീകരിച്ചു',
      noExperts: 'വിദഗ്ധർ ലഭ്യമായിട്ടില്ല.',
      chattingWith: 'ചാറ്റ് ചെയ്യുന്നത്:',
      selectExpert: '— ഒരു വിദഗ്ധനെ തിരഞ്ഞെടുക്കുക',
      selectToStart: 'ആരംഭിക്കാൻ ഒരു വിദഗ്ധനെ തിരഞ്ഞെടുക്കുക',
      needApproval: 'ചാറ്റ് ആരംഭിക്കാൻ വിദഗ്ധന്റെ അംഗീകാരം അഭ്യർത്ഥിക്കുക.',
      typing: 'ടൈപ്പിംഗ്…',
      you: 'നിങ്ങൾ',
      typeMsg: 'സന്ദേശം ടൈപ്പ് ചെയ്യുക',
      send: 'അയക്കുക',
      recordVoice: 'വോയ്സ് റെക്കോർഡ്',
      stopRecording: 'റെക്കോർഡിംഗ് നിർത്തുക',
      recording: 'റെക്കോർഡിംഗ്...',
      uploadAudio: 'ഓഡിയോ അപ്ലോഡ് ചെയ്യുന്നു...',
      cancelRecording: 'റദ്ദാക്കുക'
    }
  }[lang];

  useEffect(() => {
    const handler = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', handler);
    // ask notification permission once
    if (window.Notification && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch(_) {}
    }
    return () => window.removeEventListener('langChanged', handler);
  }, []);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        uploadAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

    } catch (error) {
      console.error('Error starting recording:', error);
      setToasts(prev => [...prev, { id: Date.now(), text: 'Microphone access denied' }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
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
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setAudioChunks([]);
      setRecordingTime(0);
    }
  };

  const uploadAudioMessage = async (audioBlob) => {
    if (!conversationId || !selectedExpertEmail) return;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('conversationId', conversationId);
      formData.append('text', ''); // Optional text with voice message

      const response = await fetch(`${config.API_URL}/chat/upload-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        // Add the message to local state immediately
        setMessages(prev => [...prev, {
          ...result.message,
          inbound: false,
          fromName: user?.name || user?.email
        }]);
        setText('');
        setToasts(prev => [...prev, { id: Date.now(), text: 'Voice message sent' }]);
      } else {
        setToasts(prev => [...prev, { id: Date.now(), text: result.message || 'Failed to send voice message' }]);
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      setToasts(prev => [...prev, { id: Date.now(), text: 'Failed to send voice message' }]);
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
  const approvedEmails = new Set(
    myRequests
      .filter((r) => r.status === 'approved' && r.expert?.email)
      .map((r) => String(r.expert.email).toLowerCase())
  );

  useEffect(() => {
    const socket = getSocket();
    const onReceive = (msg) => {
      // Only show messages for the currently open peer
      const peerEmail = selectedExpertEmail?.toLowerCase();
      const fromEmail = String(msg.fromEmail || '').toLowerCase();
      const toEmail = String(msg.toEmail || '').toLowerCase();
      const myEmail = String(user?.email || '').toLowerCase();
      const isForThisChat = peerEmail && (fromEmail === peerEmail || (fromEmail === myEmail && toEmail === peerEmail));
      const inbound = fromEmail !== myEmail;
      if (!isForThisChat) {
        // increment unread for that expert
        if (inbound) {
          setUnreadByEmail((m) => ({ ...m, [fromEmail]: (m[fromEmail] || 0) + 1 }));
          // toast
          setToasts((tlist) => [...tlist, { id: Date.now(), text: `New message from ${msg.fromEmail}` }]);
          if (window.Notification && Notification.permission === 'granted') {
            try { new Notification(`New message from ${msg.fromEmail}`, { body: msg.text || 'Attachment', silent: true }); } catch (_) {}
          }
        }
        return;
      }
      setMessages((m) => [...m, { ...msg, inbound, deliveredAt: Date.now() }]);
    };
    const onTyping = (payload = {}) => {
      const fromEmail = String(payload.fromEmail || '').toLowerCase();
      const peerEmail = String(selectedExpertEmail || '').toLowerCase();
      if (fromEmail && peerEmail && fromEmail === peerEmail) {
        setIsOtherTyping(true);
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => setIsOtherTyping(false), 1500);
      }
    };
    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    const onPresence = (p = {}) => {
      const email = String(p.email || '').toLowerCase();
      if (!email) return;
      setPresenceByEmail((m) => ({ ...m, [email]: { online: !!p.online, lastActiveAt: p.lastActiveAt } }));
    };
    const onRead = (payload = {}) => {
      const ids = new Set((payload.messageIds || []).map(String));
      if (!ids.size) return;
      setMessages((arr) => arr.map((m) => (ids.has(String(m._id)) ? { ...m, readAt: new Date().toISOString() } : m)));
    };
    socket.on('presence', onPresence);
    socket.on('messages_read', onRead);
    return () => {
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
      socket.off('presence', onPresence);
      socket.off('messages_read', onRead);
    };
  }, [selectedExpertEmail]);

  // Load experts list
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/farmer/experts');
        if (res.data?.success) setExperts(res.data.data || []);
      } catch (_) {}
    })();
  }, []);

  // Load my chat requests
  useEffect(() => {
    (async () => {
      try {
        const res = await chatApi.listMyRequests();
        if (res?.success) setMyRequests(res.data || []);
      } catch (_) {}
    })();
  }, []);

  // Load existing conversations to enrich expert list with latest message
  useEffect(() => {
    (async () => {
      try {
        const data = await chatApi.listConversations();
        if (data?.success) setConversations(data.conversations || []);
      } catch (_) {}
    })();
  }, []);

  // When selecting an expert, resolve conversation and load history
  useEffect(() => {
    (async () => {
      try {
        setMessages([]);
        setConversationId('');
        setIsOtherTyping(false);
        const email = selectedExpertEmail?.trim();
        if (!email) return;
        if (!approvedEmails.has(email.toLowerCase())) {
          return; // Not approved yet; don't open conversation
        }
        const res = await chatApi.getOrCreateConversationByEmail(email);
        if (!res?.success || !res?.conversation?._id) return;
        const convoId = res.conversation._id;
        setConversationId(convoId);
        const msgsRes = await chatApi.listMessages(convoId);
        if (msgsRes?.success && Array.isArray(msgsRes.messages)) {
          const myEmail = String(user?.email || '').toLowerCase();
          const hydrated = msgsRes.messages.map((m) => ({
            ...m,
            inbound: String(m.fromEmail || '').toLowerCase() !== myEmail,
            ts: new Date(m.createdAt).getTime()
          }));
          setMessages(hydrated);
          // Mark as read
          await chatApi.markRead(convoId).catch(() => {});
          setUnreadByEmail((m) => ({ ...m, [email.toLowerCase()]: 0 }));
        }
      } catch (_) {}
    })();
  }, [selectedExpertEmail]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() && (!files || files.length === 0)) return;
    if (!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase())) return;
    try {
      if (!conversationId) return;
      const res = await chatApi.sendMessage(conversationId, { text: text.trim(), files });
      if (res?.success && res?.message) {
        const m = res.message;
        setMessages((prev) => [...prev, { ...m, inbound: false }]);
        setText('');
        setFiles([]);
        setFilePreviews([]);
      }
    } catch (_) {}
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      send(e);
    } else {
      // Emit typing signal
      const socket = getSocket();
      if (selectedExpertEmail) {
        socket.emit('typing', { toEmail: selectedExpertEmail });
      }
    }
  };

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
    // backend serves uploads at /api/admin/uploads
    const p = String(att?.path || ''); // e.g., uploads/filename
    const fname = p.startsWith('uploads/') ? p.slice('uploads/'.length) : p;
    return `${baseUrl}/admin/uploads/${fname}`;
  };

  const onFilesSelected = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(newFiles);
    const urls = newFiles.map((f) => ({ name: f.name, type: f.type, url: URL.createObjectURL(f) }));
    setFilePreviews(urls);
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
          // default link (e.g., PDF)
          return <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs underline">{a.originalName}</a>;
        })}
      </div>
    );
  };

  const doSearch = async () => {
    if (!conversationId || !chatSearch.trim()) { setSearchResults([]); return; }
    try {
      const res = await chatApi.searchMessages(conversationId, chatSearch.trim());
      setSearchResults(Array.isArray(res?.results) ? res.results : []);
    } catch (_) { setSearchResults([]); }
  };

  const downloadPdf = async () => {
    if (!conversationId) return;
    try {
      const blob = await chatApi.exportConversation(conversationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `conversation_${conversationId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Modern Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-lg shadow-slate-500/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Expert Chat</h1>
                <p className="text-sm text-slate-600">Connect with agricultural experts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/60">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">28°C</div>
                  <div className="text-slate-600">Sunny</div>
                </div>
              </div>
              <button className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Modern Experts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{t.experts}</h3>
                    <p className="text-sm text-slate-600">Available specialists</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPh}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
        </div>
              
              <div className="max-h-96 overflow-y-auto">
          {experts
            .filter((e) => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (
                String(e.name || '').toLowerCase().includes(q) ||
                String(e.email || '').toLowerCase().includes(q)
              );
            })
            .map((e) => {
              const convo = conversations.find((c) => (c.participantEmails || []).includes(String(e.email).toLowerCase()));
              const lastText = convo?.lastMessageText || '';
              const lastAt = convo?.lastMessageAt ? new Date(convo.lastMessageAt) : null;
              const time = lastAt ? lastAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const initials = (String(e.name || e.email).charAt(0) || '?').toUpperCase();
              const email = String(e.email || '').toLowerCase();
              const req = myRequests.find((r) => String(r.expert?.email || '').toLowerCase() === email);
              const status = req?.status || 'none';
              const unread = unreadByEmail[email] || 0;
                    const isOnline = presenceByEmail[email]?.online;
                    
              return (
                      <motion.button
                  key={e.email}
                        onClick={() => {
                          setSelectedExpertEmail(e.email);
                          setSelectedExpert(e);
                        }}
                        className={`w-full text-left p-4 hover:bg-slate-50 border-b border-slate-200/60 transition-all duration-200 ${
                          selectedExpertEmail === e.email ? 'bg-emerald-50 border-emerald-200' : ''
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`h-12 w-12 rounded-xl overflow-hidden shadow-lg ${
                              selectedExpertEmail === e.email 
                                ? 'ring-2 ring-emerald-500' 
                                : ''
                            }`}>
                              {e.profilePicture ? (
                                <img 
                                  src={e.profilePicture} 
                                  alt={e.name || e.email}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-full h-full bg-gradient-to-br ${
                                  selectedExpertEmail === e.email 
                                    ? 'from-emerald-500 to-green-600 text-white' 
                                    : 'from-slate-100 to-slate-200 text-slate-700'
                                } flex items-center justify-center font-bold text-lg ${e.profilePicture ? 'hidden' : 'flex'}`}
                              >
                      {initials}
                              </div>
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                    </div>
                    <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="font-semibold text-slate-900 truncate">{e.name || e.email}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                                {unread > 0 && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white font-bold">
                                    {unread}
                                  </span>
                                )}
                                {time && <div className="text-xs text-slate-500">{time}</div>}
                        </div>
                      </div>
                            <div className="text-sm text-slate-600 truncate mb-2">
                              {lastText || e.email}
                            </div>
                            <div className="flex items-center gap-2">
                        {!approvedEmails.has(email) && (
                          <button
                            type="button"
                                  className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-emerald-500/25"
                            onClick={async (ev) => {
                              ev.stopPropagation();
                              try {
                                const r = await chatApi.sendChatRequest(email);
                                if (r?.success) {
                                  const mine = await chatApi.listMyRequests();
                                  if (mine?.success) setMyRequests(mine.data || []);
                                }
                              } catch (_) {}
                            }}
                          >
                          {t.requestChat}
                          </button>
                        )}
                              {status === 'pending' && (
                                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                                  {t.pending}
                                </span>
                              )}
                              {status === 'rejected' && (
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                                  {t.rejected}
                                </span>
                              )}
                              {status === 'approved' && (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                  {t.approved}
                                </span>
                              )}
                      </div>
                    </div>
                  </div>
                      </motion.button>
              );
            })}
                {experts.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl mx-auto flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">{t.noExperts}</p>
                  </div>
                )}
              </div>
        </div>
      </div>

          {/* Right: Modern Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-[600px] flex flex-col">
              {/* Combined Chat Header & Expert Profile */}
              <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50 to-green-50">
                {selectedExpertEmail ? (
                  <div className="space-y-4">
                    {/* Expert Profile Section */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                        {selectedExpert?.profilePicture ? (
                          <img 
                            src={selectedExpert.profilePicture} 
                            alt={selectedExpert?.name || selectedExpertEmail}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-bold text-xl ${selectedExpert?.profilePicture ? 'hidden' : 'flex'}`}
                        >
                          {(selectedExpert?.name || selectedExpertEmail).charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900">
                          {t.chattingWith} {selectedExpert?.name || selectedExpertEmail}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">{selectedExpertEmail}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-slate-700">Agricultural Expert</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-slate-700">Available for consultation</span>
                          </div>
                  {presenceByEmail[String(selectedExpertEmail).toLowerCase()]?.online ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-green-600 font-medium">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 text-sm">
                                {formatLastSeen(presenceByEmail[String(selectedExpertEmail).toLowerCase()]?.lastActiveAt)}
                              </span>
                            </div>
                          )}
                          {isOtherTyping && (
                            <span className="text-emerald-600 text-sm font-medium animate-pulse">
                              {t.typing}
                </span>
              )}
            </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 mb-2">Specialization</div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Crop Management</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Soil Health</span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Pest Control</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Controls */}
                    <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                        <div className="relative">
                          <input 
                            value={chatSearch} 
                            onChange={(e) => setChatSearch(e.target.value)} 
                            placeholder="Search in chat" 
                            className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
            </div>
          </div>
                        <button 
                          type="button" 
                          onClick={doSearch} 
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                        >
                          Search
                        </button>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {!approvedEmails.has(selectedExpertEmail.toLowerCase()) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-amber-700 font-medium">{t.needApproval}</span>
                        </div>
                      </div>
                    )}
                    
                    {pinnedOnly && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span className="text-blue-700 font-medium">Showing pinned messages only</span>
                        </div>
                      </div>
                    )}
        </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
            </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{t.selectExpert}</h3>
                      <p className="text-sm text-slate-600">{t.selectToStart}</p>
            </div>
          </div>
        )}
              </div>

              {/* Pinned Messages Section */}
              {messages.some((m) => m.pinned) && (
                <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-amber-50 to-yellow-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span className="font-semibold text-amber-900">Pinned Advice</span>
                    </div>
                    <button 
                      className="text-sm text-amber-700 hover:text-amber-900 font-medium underline" 
                      onClick={() => setPinnedOnly((v) => !v)}
                    >
                      {pinnedOnly ? 'Show all' : 'Show pinned only'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {messages.filter((m) => m.pinned).slice(0, 5).map((m) => (
                      <div key={m._id || m.ts} className="text-sm text-amber-800 truncate bg-white/50 p-2 rounded-lg">
                        {m.text || (Array.isArray(m.attachments) && m.attachments[0]?.originalName)}
                      </div>
            ))}
          </div>
        </div>
              )}

              {/* Main Chat Messages Area */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
          {(pinnedOnly ? messages.filter((m) => m.pinned) : messages).map((m, i) => (
            <motion.div
              key={`${m._id || ''}-${i}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${m.inbound ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                      m.inbound 
                        ? 'bg-white border border-slate-200/60' 
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                    }`}>
                      <div className={`text-xs mb-1 ${
                        m.inbound ? 'text-slate-500' : 'text-white/80'
                      }`}>
                        {m.inbound ? `${m.fromName || m.fromEmail}` : t.you}
                      </div>
                      
                      {m.text && (
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {m.text}
                        </div>
                      )}
                      
              {Array.isArray(m.attachments) && <AttachmentView atts={m.attachments} />}
                      
                      <div className={`flex items-center justify-between mt-2 text-xs ${
                        m.inbound ? 'text-slate-500' : 'text-white/80'
                      }`}>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            className="hover:underline font-medium" 
                            onClick={async () => {
                  try {
                    if (!conversationId || !m._id) return;
                    const res = await chatApi.pinMessage(conversationId, m._id, !m.pinned);
                    if (res?.success) {
                      setMessages((arr) => arr.map((x) => (x._id === m._id ? { ...x, pinned: !m.pinned } : x)));
                    }
                  } catch (_) {}
                            }}
                          >
                            {m.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          {m.pinned && (
                            <span className="text-amber-500">📌</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                <span>{formatTime(m.ts || m.createdAt)}</span>
                <MessageStatus m={m} />
                        </div>
                      </div>
              </div>
            </motion.div>
          ))}
                
                {/* Search Results */}
          {searchResults.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="font-semibold text-blue-900">Search Results</span>
                    </div>
                    <div className="space-y-2">
              {searchResults.map((m) => (
                        <div key={m._id} className="p-3 bg-white rounded-lg border border-blue-200">
                          <div className="text-xs text-slate-500 mb-1">
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-900">{m.text}</div>
                </div>
              ))}
                    </div>
            </div>
          )}
                
                {/* Empty State */}
                {messages.length === 0 && selectedExpertEmail && approvedEmails.has(selectedExpertEmail.toLowerCase()) && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
        </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Start the conversation</h3>
                    <p className="text-slate-600 max-w-sm">
                      Send your first message to begin chatting with {selectedExpert?.name || selectedExpertEmail}
                    </p>
                  </div>
                )}
              </div>
              {/* Modern Message Input */}
              <div className="p-6 border-t border-slate-200/60 bg-white">
                {/* File Previews and Controls */}
                {(filePreviews.length > 0 || pinnedOnly) && (
                  <div className="mb-4 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={pinnedOnly} 
                        onChange={(e) => setPinnedOnly(e.target.checked)} 
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Pinned only</span>
                    </label>
                    
                    {filePreviews.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {filePreviews.map((p) => (
                          (p.type || '').startsWith('image/') ? (
                            <div key={p.url} className="relative group">
                              <img src={p.url} alt={p.name} className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                              <button 
                                onClick={() => {
                                  setFilePreviews(prev => prev.filter(f => f.url !== p.url));
                                  setFiles(prev => prev.filter(f => f.name !== p.name));
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div key={p.url} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs text-slate-700 truncate max-w-20">{p.name}</span>
                              <button 
                                onClick={() => {
                                  setFilePreviews(prev => prev.filter(f => f.url !== p.url));
                                  setFiles(prev => prev.filter(f => f.name !== p.name));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={send} className="flex gap-3">
                  <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.typeMsg}
            rows={1}
                      className="w-full px-4 py-3 pr-32 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all duration-200"
            disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase()) || isRecording}
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    
                    {/* Attach and Voice Recording Buttons */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                      {/* Attach Button */}
                      <label className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <input type="file" className="hidden" multiple onChange={onFilesSelected} accept="image/*,application/pdf,audio/*" />
                      </label>
          
          {/* Voice Recording Button */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-lg shadow-red-500/25"
              disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase())}
              title={t.recordVoice}
            >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                          </svg>
            </button>
          ) : (
                        <div className="flex gap-2">
              <button
                type="button"
                onClick={stopRecording}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 shadow-lg shadow-green-500/25"
                title={t.stopRecording}
              >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 6h12v12H6z"/>
                            </svg>
              </button>
              <button
                type="button"
                onClick={cancelRecording}
                            className="p-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
                title={t.cancelRecording}
              >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
              </button>
            </div>
          )}
                    </div>
                  </div>
          
          <button 
            type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase()) || isRecording || (!text.trim() && files.length === 0)}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>{t.send}</span>
                    </div>
          </button>
        </form>
        
        {/* Recording Indicator */}
        {isRecording && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-red-900">{t.recording}</div>
                      <div className="text-sm text-red-700">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-xs text-red-600">
                      Click stop to send or cancel to discard
                    </div>
          </div>
        )}
      </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modern Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50">
        {toasts.slice(-3).map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-500/20 p-4 max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{toast.text}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Chatbox;


