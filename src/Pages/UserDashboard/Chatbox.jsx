import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '../../services/socket';
import authService from '../../services/authService';
import api, { chatApi } from '../../services/api';

const Chatbox = () => {
  const user = authService.getCurrentUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [experts, setExperts] = useState([]);
  const [selectedExpertEmail, setSelectedExpertEmail] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
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
      if (!isForThisChat) return;
      const inbound = fromEmail !== myEmail;
      setMessages((m) => [...m, { ...msg, inbound }]);
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
    return () => {
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
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

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase())) return;
    const socket = getSocket();
    const outgoing = { toEmail: selectedExpertEmail.trim(), text: text.trim() };
    socket.emit('send_message', outgoing, (ack) => {
      if (ack?.success) {
        setMessages((m) => [
          ...m,
          { fromUserId: user?.id, fromName: user?.name, fromEmail: user?.email, toEmail: selectedExpertEmail, text, ts: Date.now(), inbound: false }
        ]);
        setText('');
      }
    });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Experts list */}
      <div className="ag-card p-0 overflow-hidden">
        <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
          <div className="font-medium">Experts</div>
          <div className="mt-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search experts by name or email"
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
                        {time && <div className="text-[10px] text-gray-500 flex-shrink-0">{time}</div>}
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
                            Request Chat
                          </button>
                        )}
                        {status === 'pending' && <span className="text-[10px] text-amber-600">Pending approval</span>}
                        {status === 'rejected' && <span className="text-[10px] text-red-600">Rejected</span>}
                        {status === 'approved' && <span className="text-[10px] text-green-600">Approved</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          {experts.length === 0 && <div className="p-4 text-sm text-gray-500">No experts available.</div>}
        </div>
      </div>

      {/* Right: Conversation */}
      <div className="ag-card p-0 overflow-hidden lg:col-span-2">
        <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
          <div className="text-sm text-gray-600">Chatting with: <span className="font-medium">{selectedExpertEmail || '— Select an expert'}</span></div>
          {!selectedExpertEmail && <div className="text-xs text-gray-500 mt-1">Select an expert to start</div>}
          {selectedExpertEmail && !approvedEmails.has(selectedExpertEmail.toLowerCase()) && (
            <div className="text-xs text-amber-700 mt-1">Request approval from the expert to start chatting.</div>
          )}
          {isOtherTyping && selectedExpertEmail && approvedEmails.has(selectedExpertEmail.toLowerCase()) && (
            <div className="text-xs text-[var(--ag-primary-600)] mt-1">typing…</div>
          )}
        </div>
        <div ref={scrollContainerRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-[var(--ag-muted)]">
          {messages.map((m, i) => (
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
        </div>
        <form onSubmit={send} className="p-3 border-t border-[var(--ag-border)] flex gap-2 lg:col-span-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message"
            rows={1}
            className="flex-1 px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)] resize-none"
            disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase())}
          />
          <button className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]" disabled={!selectedExpertEmail || !approvedEmails.has(selectedExpertEmail.toLowerCase())}>Send</button>
        </form>
      </div>
    </div>
  );
};

export default Chatbox;


