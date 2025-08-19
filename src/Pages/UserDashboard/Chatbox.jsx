import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Chatbox = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! Ask me anything about crops and soil.' }
  ]);
  const [text, setText] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const userMsg = { from: 'user', text };
    const botMsg = { from: 'bot', text: `You said: ${text}. (This is a mock reply.)` };
    setMessages((m) => [...m, userMsg, botMsg]);
    setText('');
  };

  return (
    <div className="ag-card p-0 overflow-hidden">
      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-[var(--ag-muted)]">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md px-4 py-2 rounded-lg ${m.from === 'user' ? 'bg-[var(--ag-primary-500)] text-white ml-auto' : 'bg-white border border-[var(--ag-border)]'}`}>
            {m.text}
          </motion.div>
        ))}
      </div>
      <form onSubmit={send} className="p-3 border-t border-[var(--ag-border)] flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-lg border-[var(--ag-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-primary-500)]" />
        <button className="px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]">Send</button>
      </form>
    </div>
  );
};

export default Chatbox;


