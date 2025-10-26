import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import { PaperPlaneRight } from 'phosphor-react';
import { useSearchParams } from 'react-router-dom';
 import type { Message } from '../../types/panel/panelTypes';
 import MainLayout from './layout';

export default function ChatPanel() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: input,
      time: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const payload = {
      message: userMsg.text,
      user_id: userId ? Number(userId) : null
    };

    try {
      const res = await fetch('http://127.0.0.1:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log("Chatbot response data:", data);
      
      const agentMsg: Message = {
        id: `m-${Date.now()}-r`,
        sender: 'agent',
        text: data.reply,
        time: Date.now()
      };
      
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <MainLayout>
      <main className="flex flex-col h-full">
        {/* Messages container - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {messages.length > 0 ? (
            <div className="flex flex-col space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-lg ${m.sender === 'user' ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-gray-400">
              Start a conversation by typing a message below
            </div>
          )}
        </div>

        {/* Input form - fixed at bottom */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button type="submit" className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <PaperPlaneRight size={18} weight="fill" />
              Send
            </button>
          </form>
        </div>
      </main>
    </MainLayout>
  );
}