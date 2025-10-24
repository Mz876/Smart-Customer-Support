

import React, { type ChangeEvent, type FormEvent, type JSX, useEffect, useRef, useState } from 'react';
import {
  PlusCircle,
  MagnifyingGlass,
  Trash,
  Gear,
  ArrowRight,
  PaperPlaneRight,
  ChatCircleDots,
  ClockClockwise,
  CaretLeft,
  CaretRight,
} from 'phosphor-react';

const STORAGE_KEY = 'cs_conversations_v1_ts';

type Sender = 'user' | 'agent';

interface Message {
  id: string;
  sender: Sender;
  text: string;
  time: number; // epoch ms
}

interface Conversation {
  id: string;
  title: string;
  lastUpdated: number;
  messages: Message[];
}

const seedConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Order #1234 — issue with delivery',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 6,
    messages: [
      { id: 'm1', sender: 'user', text: "Hi, my order hasn't arrived yet.", time: Date.now() - 1000 * 60 * 60 * 6 },
      { id: 'm2', sender: 'agent', text: 'Sorry to hear that — can you share your order number?', time: Date.now() - 1000 * 60 * 60 * 5.8 },
      { id: 'm3', sender: 'user', text: "Order 1234. Tracking shows delivered but I don't have it.", time: Date.now() - 1000 * 60 * 60 * 5.5 },
    ],
  },
  {
    id: 'conv-2',
    title: 'Feature request: dark mode',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 24 * 2,
    messages: [
      { id: 'm1', sender: 'user', text: 'I would love a dark theme for the dashboard.', time: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { id: 'm2', sender: 'agent', text: 'Thanks — this is on our roadmap!', time: Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30 },
    ],
  },
  {
    id: 'conv-3',
    title: 'Billing question',
    lastUpdated: Date.now() - 1000 * 60 * 60 * 24 * 7,
    messages: [
      { id: 'm1', sender: 'user', text: 'Why was I charged twice this month?', time: Date.now() - 1000 * 60 * 60 * 24 * 7 },
    ],
  },
];

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedConversations;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedConversations;
    return parsed as Conversation[];
  } catch (e) {
    console.warn('Failed to load conversations, using seed', e);
    return seedConversations;
  }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch (e) {
    console.warn('Failed to save conversations', e);
  }
}

function timeAgo(ts: number) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ConversationPanel(): JSX.Element {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [query, setQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, conversations]);

  function createConversation() {
    const id = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: 'New conversation',
      lastUpdated: Date.now(),
      messages: [{ id: `${id}-m1`, sender: 'user', text: 'New conversation started', time: Date.now() }],
    };
    setConversations((c) => [newConv, ...c]);
    setActiveId(id);
  }

  function deleteConversation(id: string) {
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((x) => x.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  }

  function updateActiveTitle(id: string, title: string) {
    setConversations((c) => c.map((conv) => conv.id === id ? { ...conv, title } : conv));
  }

  function sendMessage(text: string) {
    if (!text.trim() || !activeId) return;
    const newMsg: Message = { id: `m-${Date.now()}`, sender: 'user', text: text.trim(), time: Date.now() };
    setConversations((c) => c.map((conv) => {
      if (conv.id !== activeId) return conv;
      const updated: Conversation = { ...conv, messages: [...conv.messages, newMsg], lastUpdated: Date.now() };
      return updated;
    }));
    setInput('');

    // simulate agent reply
    setTimeout(() => {
      const reply: Message = { id: `m-${Date.now()}-r`, sender: 'agent', text: mockBotReply(text), time: Date.now() };
      setConversations((c) => c.map((conv) => conv.id === activeId ? { ...conv, messages: [...conv.messages, reply], lastUpdated: Date.now() } : conv));
    }, 900 + Math.random() * 1200);
  }

  function mockBotReply(userText: string) {
    const t = userText.toLowerCase();
    if (t.includes('order')) return "I see — can you share your order number so I can check the delivery status?";
    if (t.includes('refund') || t.includes('charge')) return "We're reviewing your billing; please allow 24 hours for an update.";
    if (t.includes('dark')) return "Thanks — dark mode is on our roadmap. We'll keep you updated.";
    return "Thanks for the message! An agent will respond shortly. Meanwhile, can you add more details?";
  }

  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()) || c.messages.some(m => m.text.toLowerCase().includes(query.toLowerCase())));
  const activeConv = conversations.find((c) => c.id === activeId) ?? filtered[0] ?? null;

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-4">
        {/* Sidebar */}
        <aside className={`md:col-span-1 border-r border-orange-100 bg-gradient-to-b from-white to-orange-50 p-4 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => createConversation()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm">
                <PlusCircle size={16} /> New
              </button>
              <div className="hidden md:flex items-center text-sm text-slate-600">Conversations</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(s => !s)} className="md:hidden p-2 rounded hover:bg-orange-100">
                {sidebarOpen ? <CaretLeft size={18} /> : <CaretRight size={18} />}
              </button>
              <button className="p-2 rounded hover:bg-orange-100" title="Settings"><Gear size={16} /></button>
            </div>
          </div>

          <div className="relative mb-3">
            <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-orange-400"><MagnifyingGlass size={16} /></span>
            <input value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-300" />
          </div>

          <div className="overflow-auto h-[60vh] md:h-[72vh] pr-2">
            {filtered.length === 0 && <div className="text-sm text-slate-500 p-3">No conversations yet. Create one.</div>}
            <ul className="space-y-2">
              {filtered.map(conv => (
                <li key={conv.id} className={`p-3 rounded-lg cursor-pointer hover:bg-orange-50 ${conv.id === activeId ? 'bg-orange-50 ring-1 ring-orange-200' : ''}`} onClick={() => setActiveId(conv.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-800 truncate">{conv.title}</div>
                        <div className="text-xs text-slate-400">• {timeAgo(conv.lastUpdated)}</div>
                      </div>
                      <div className="text-sm text-slate-500 mt-1 line-clamp-2">{conv.messages[conv.messages.length - 1]?.text ?? ''}</div>
                    </div>
                    <div className="ml-2 flex flex-col items-end gap-2">
                      <button title="Delete" onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1 rounded hover:bg-orange-100 text-slate-500"><Trash size={14} /></button>
                      <div className="text-xs text-slate-400">{conv.messages.length}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2"><ChatCircleDots size={14} /> <span>Active: {conversations.length}</span></div>
            <div className="flex items-center gap-2"><ClockClockwise size={14} /> <span>Updated</span></div>
          </div>
        </aside>

        {/* Main panel */}
        <main className="md:col-span-3 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-800">{activeConv?.title ?? 'No conversation selected'}</h3>
              {activeConv && <div className="text-sm text-slate-500">• {timeAgo(activeConv.lastUpdated)}</div>}
            </div>

            <div className="flex items-center gap-2">
              <button className="text-sm text-slate-500 hover:underline" onClick={() => { if (activeConv) updateActiveTitle(activeConv.id, prompt('Set a title', activeConv.title) || activeConv.title); }}>Rename</button>
              <button className="p-2 rounded hover:bg-orange-50 text-slate-600" title="Conversation settings"><Gear size={18} /></button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden flex flex-col h-[60vh] md:h-[72vh]">
            <div className="flex-1 p-4 overflow-auto bg-gradient-to-b from-white to-orange-50">
              {activeConv ? (
                activeConv.messages.map(msg => (
                  <div key={msg.id} className={`mb-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                    <div className={`inline-block px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-orange-400 text-white' : 'bg-white ring-1 ring-orange-100 text-slate-800'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                    <div className={`text-xs text-slate-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{new Date(msg.time).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">Choose a conversation from the left or create a new one.</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t bg-white">
              <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-3">
                <input value={input} onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-orange-100 focus:border-orange-300" />
                <button type="button" onClick={() => sendMessage(input)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 shadow">
                  <PaperPlaneRight size={18} /> Send
                </button>

                <button type="button" className="p-2 rounded-full hover:bg-orange-50 text-slate-600" title="Quick reply" onClick={() => { setInput('Thanks! I received this.'); }}><ArrowRight size={18} /></button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


