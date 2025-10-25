import React, { useState, useEffect, useRef, type ChangeEvent,type FormEvent } from 'react';
import { PlusCircle, Trash, Gear, PaperPlaneRight, CaretLeft, CaretRight, MagnifyingGlass } from 'phosphor-react';
import { useSearchParams } from 'react-router-dom';


interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: number;
}

interface Conversation {
  id: string;
  title: string;
  lastUpdated: number;
  messages: Message[];
}

export default function ChatPanel() {

  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId'); // string | null


  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeConv = conversations.find(c => c.id === activeId) ?? null;

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  function createConversation() {
    const id = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: `Conversation ${conversations.length + 1}`,
      lastUpdated: Date.now(),
      messages: []
    };
    setConversations([newConv, ...conversations]);
    setActiveId(id);
  }

  function deleteConversation(id: string) {
    setConversations(cvs => cvs.filter(c => c.id !== id));
    if (activeId === id) setActiveId(conversations[0]?.id ?? null);
  }

  function renameConversation(id: string) {
    const newTitle = prompt('Enter new title')?.trim();
    if (!newTitle) return;
    setConversations(cvs => cvs.map(c => c.id === id ? { ...c, title: newTitle } : c));
  }

  async function sendMessage() {
    if (!input.trim() || !activeConv) return;

    const userMsg: Message = { id: `m-${Date.now()}`, sender: 'user', text: input, time: Date.now() };
    setConversations(cvs => cvs.map(c => c.id === activeId ? { ...c, messages: [...c.messages, userMsg], lastUpdated: Date.now() } : c));
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
      const agentMsg: Message = { id: `m-${Date.now()}-r`, sender: 'agent', text: data.reply, time: Date.now() };
      setConversations(cvs => cvs.map(c => c.id === activeId ? { ...c, messages: [...c.messages, agentMsg], lastUpdated: Date.now() } : c));
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-4">
        {/* Sidebar */}
        <aside className={`md:col-span-1 border-r border-orange-100 p-4 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex justify-between items-center mb-3">
            <button onClick={createConversation} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm">
              <PlusCircle size={16} /> New
            </button>
            <button className="md:hidden" onClick={() => setSidebarOpen(s => !s)}>{sidebarOpen ? <CaretLeft size={18} /> : <CaretRight size={18} />}</button>
          </div>

          <div className="relative mb-3">
            <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-orange-400"><MagnifyingGlass size={16} /></span>
            <input
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
            />
          </div>

          <ul className="overflow-auto h-[70vh] space-y-2">
            {filtered.map(conv => (
              <li key={conv.id} className={`p-3 rounded-lg cursor-pointer ${conv.id === activeId ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-orange-50'}`} onClick={() => setActiveId(conv.id)}>
                <div className="flex justify-between">
                  <span>{conv.title}</span>
                  <span className="text-xs text-slate-400">{conv.messages.length}</span>
                </div>
                {conv.messages[conv.messages.length - 1] && <div className="text-sm text-slate-500 truncate">{conv.messages[conv.messages.length - 1].text}</div>}
                <div className="flex gap-2 mt-1">
                  <button onClick={(e) => { e.stopPropagation(); renameConversation(conv.id); }} className="text-xs text-blue-500">Rename</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="text-xs text-red-500">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main panel */}
        <main className="md:col-span-3 p-4 flex flex-col">
          <div className="flex-1 overflow-auto bg-white p-4 rounded-lg mb-4">
            {activeConv ? (
              activeConv.messages.map(m => (
                <div key={m.id} className={`mb-2 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 py-1 rounded ${m.sender === 'user' ? 'bg-orange-400 text-white' : 'bg-gray-100'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400">Select a conversation or create a new one</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {activeConv && (
            <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button type="submit" className="bg-orange-400 text-white px-4 py-2 rounded flex items-center gap-1">
                <PaperPlaneRight size={16} /> Send
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
