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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Experts list */}
      <div className="ag-card p-0 overflow-hidden">
        <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
          <div className="font-medium">{t.experts}</div>
          <div className="mt-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPh}
              className="w-full px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
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
              return (
                <button
                  key={e.email}
                  onClick={() => setSelectedExpertEmail(e.email)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-[var(--ag-border)] ${selectedExpertEmail === e.email ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--ag-primary-100)] text-[var(--ag-primary-700)] flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium truncate">{e.name || e.email}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">{unread}</span>}
                          {time && <div className="text-[10px] text-gray-500">{time}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 truncate">{lastText || e.email}</div>
                      <div className="mt-1 flex items-center gap-2">
                        {!approvedEmails.has(email) && (
                          <button
                            type="button"
                            className="text-[10px] px-2 py-1 rounded bg-[var(--ag-primary-500)] text-white"
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
                      {status === 'pending' && <span className="text-[10px] text-amber-600">{t.pending}</span>}
                      {status === 'rejected' && <span className="text-[10px] text-red-600">{t.rejected}</span>}
                      {status === 'approved' && <span className="text-[10px] text-green-600">{t.approved}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          {experts.length === 0 && <div className="p-4 text-sm text-gray-500">{t.noExperts}</div>}
        </div>
      </div>

      {/* Right: Conversation */}
      <div className="ag-card p-0 overflow-hidden lg:col-span-2">
        <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-gray-600">
              {t.chattingWith} <span className="font-medium">{selectedExpertEmail || t.selectExpert}</span>
              {selectedExpertEmail && (
                <span className="ml-2 text-[10px]">
                  {presenceByEmail[String(selectedExpertEmail).toLowerCase()]?.online ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Online
                    </span>
                  ) : (
                    <span className="text-gray-500">{formatLastSeen(presenceByEmail[String(selectedExpertEmail).toLowerCase()]?.lastActiveAt)}</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="Search in chat" className="text-xs px-2 py-1 border rounded" />
              <button type="button" onClick={doSearch} className="text-xs px-2 py-1 border rounded">Search</button>
              <button type="button" onClick={downloadPdf} className="text-xs px-2 py-1 border rounded">Export PDF</button>
            </div>
          </div>
          {!selectedExpertEmail && <div className="text-xs text-gray-500 mt-1">{t.selectToStart}</div>}
          {selectedExpertEmail && !approvedEmails.has(selectedExpertEmail.toLowerCase()) && (
            <div className="text-xs text-amber-700 mt-1">{t.needApproval}</div>
          )}
          {isOtherTyping && selectedExpertEmail && approvedEmails.has(selectedExpertEmail.toLowerCase()) && (
            <div className="text-xs text-[var(--ag-primary-600)] mt-1">{t.typing}</div>
          )}
          {pinnedOnly && <div className="text-xs text-blue-600 mt-1">Showing pinned messages</div>}
        </div>
        {/* Pinned messages summary */}
        {messages.some((m) => m.pinned) && (
          <div className="px-3 py-2 border-b border-[var(--ag-border)] bg-yellow-50 text-xs text-yellow-900">
            <div className="mb-1 flex items-center justify-between">
              <div className="font-medium">Pinned advice</div>
              <button className="underline" onClick={() => setPinnedOnly((v) => !v)}>{pinnedOnly ? 'Show all' : 'Show pinned only'}</button>
            </div>
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
              {messages.filter((m) => m.pinned).slice(0, 5).map((m) => (
                <div key={m._id || m.ts} className="truncate">{m.text || (Array.isArray(m.attachments) && m.attachments[0]?.originalName)}</div>
              ))}
            </div>
          </div>
        )}
        <div className="px-3 py-2 border-b border-[var(--ag-border)] bg-white flex items-center gap-3">
          <label className="text-xs px-2 py-1 border rounded cursor-pointer">
            Attach
            <input type="file" className="hidden" multiple onChange={onFilesSelected} accept="image/*,application/pdf,audio/*" />
          </label>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input type="checkbox" checked={pinnedOnly} onChange={(e) => setPinnedOnly(e.target.checked)} /> Pinned only
          </label>
          <div className="flex-1 flex gap-2 overflow-x-auto">
            {filePreviews.map((p) => (
              (p.type || '').startsWith('image/') ? (
                <img key={p.url} src={p.url} alt={p.name} className="h-10 rounded" />
              ) : (
                <span key={p.url} className="text-[10px] px-2 py-1 bg-gray-100 rounded">{p.name}</span>
              )
            ))}
          </div>
        </div>
        <div ref={scrollContainerRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-[var(--ag-muted)]">
          {(pinnedOnly ? messages.filter((m) => m.pinned) : messages).map((m, i) => (
            <motion.div
              key={`${m._id || ''}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-md px-3 py-2 rounded-2xl shadow-sm ${m.inbound ? 'bg-white border border-[var(--ag-border)]' : 'bg-[var(--ag-primary-500)] text-white ml-auto'}`}
            >
              <div className="text-xs opacity-70 mb-0.5">{m.inbound ? `${m.fromName || m.fromEmail}` : t.you}</div>
              {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
              {Array.isArray(m.attachments) && <AttachmentView atts={m.attachments} />}
              <div className={`text-[10px] mt-1 ${m.inbound ? 'text-gray-500' : 'text-white/80'} flex items-center justify-end gap-2`}>
                <button type="button" className="underline" onClick={async () => {
                  try {
                    if (!conversationId || !m._id) return;
                    const res = await chatApi.pinMessage(conversationId, m._id, !m.pinned);
                    if (res?.success) {
                      setMessages((arr) => arr.map((x) => (x._id === m._id ? { ...x, pinned: !m.pinned } : x)));
                    }
                  } catch (_) {}
                }}>{m.pinned ? 'Unpin' : 'Pin'}</button>
                <span>{formatTime(m.ts || m.createdAt)}</span>
                <MessageStatus m={m} />
                {m.pinned && <span className="ml-1">📌</span>}
              </div>
            </motion.div>
          ))}
          {searchResults.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-600 mb-1">Search results</div>
              {searchResults.map((m) => (
                <div key={m._id} className="text-xs p-2 border-b">
                  <div className="opacity-60">{new Date(m.createdAt).toLocaleString()}</div>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={send} className="p-3 border-t border-[var(--ag-border)] flex gap-2 lg:col-span-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.typeMsg}
            rows={1}
            className="flex-1 px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] resize-none"
            disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase()) || isRecording}
          />
          
          {/* Voice Recording Button */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1"
              disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase())}
              title={t.recordVoice}
            >
              🎤
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                title={t.stopRecording}
              >
                ⏹️
              </button>
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-1"
                title={t.cancelRecording}
              >
                ❌
              </button>
            </div>
          )}
          
          <button 
            type="submit"
            className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]" 
            disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase()) || isRecording}
          >
            {t.send}
          </button>
        </form>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="px-3 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{t.recording}</span>
            <span className="text-sm">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>
      {/* Simple toast area */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.slice(-3).map((t) => (
          <div key={t.id} className="bg-black/80 text-white text-xs px-3 py-2 rounded shadow">{t.text}</div>
        ))}
      </div>
    </div>
  );
};

export default Chatbox;


