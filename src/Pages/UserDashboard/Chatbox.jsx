import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '../../services/socket';
import authService from '../../services/authService';
import api from '../../services/api';

const Chatbox = () => {
  const user = authService.getCurrentUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [experts, setExperts] = useState([]);
  const [selectedExpertEmail, setSelectedExpertEmail] = useState('');

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

  // Load experts list
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/farmer/experts');
        if (res.data?.success) setExperts(res.data.data || []);
      } catch (_) {}
    })();
  }, []);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Experts list */}
      <div className="ag-card p-0 overflow-hidden">
        <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)] font-medium">Experts</div>
        <div className="max-h-80 overflow-y-auto divide-y divide-[var(--ag-border)]">
          {experts.map((e) => (
            <button key={e.email} onClick={() => setSelectedExpertEmail(e.email)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedExpertEmail === e.email ? 'bg-gray-50' : ''}`}>
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-gray-600">{e.email}</div>
            </button>
          ))}
          {experts.length === 0 && <div className="p-4 text-sm text-gray-500">No experts available.</div>}
        </div>
      </div>

      {/* Right: Conversation */}
      <div className="ag-card p-0 overflow-hidden lg:col-span-2">
        <div className="p-3 border-b border-[var(--ag-border)] bg-[var(--ag-muted)]">
          <div className="text-sm text-gray-600">Chatting with: <span className="font-medium">{selectedExpertEmail || '— Select an expert'}</span></div>
        </div>
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-[var(--ag-muted)]">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md px-4 py-2 rounded-lg ${m.inbound ? 'bg-white border border-[var(--ag-border)]' : 'bg-[var(--ag-primary-500)] text-white ml-auto'}`}>
            <div className="text-xs opacity-80 mb-1">{m.inbound ? `${m.fromName || m.fromEmail}` : 'You'}</div>
            {m.text}
          </motion.div>
        ))}
      </div>
      <form onSubmit={send} className="p-3 border-t border-[var(--ag-border)] flex gap-2 lg:col-span-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" disabled={!selectedExpertEmail} />
        <button className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]" disabled={!selectedExpertEmail}>Send</button>
      </form>
      </div>
    </div>
  );
};

export default Chatbox;


