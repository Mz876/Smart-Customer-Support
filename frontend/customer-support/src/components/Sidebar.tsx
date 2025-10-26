import React, {type ChangeEvent } from 'react';
import { PlusCircle, CaretLeft, CaretRight, MagnifyingGlass } from 'phosphor-react';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: number;
}

export interface Conversation {
  id: string;
  title: string;
  lastUpdated: number;
  messages: Message[];
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  createConversation: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string) => void;
  query: string;
  setQuery: (q: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  setActiveId,
  createConversation,
  deleteConversation,
  renameConversation,
  query,
  setQuery,
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <aside className={`md:col-span-1 border-r border-orange-100 p-4 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={createConversation}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm"
        >
          <PlusCircle size={16} /> New
        </button>
        <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <CaretLeft size={18} /> : <CaretRight size={18} />}
        </button>
      </div>

      <div className="relative mb-3">
        <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-orange-400">
          <MagnifyingGlass size={16} />
        </span>
        <input
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
        />
      </div>

      <ul className="overflow-auto h-[70vh] space-y-2">
        {filtered.map(conv => (
          <li
            key={conv.id}
            className={`p-3 rounded-lg cursor-pointer ${conv.id === activeId ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-orange-50'}`}
            onClick={() => setActiveId(conv.id)}
          >
            <div className="flex justify-between">
              <span className="font-medium">{conv.title}</span>
              <span className="text-xs text-slate-400">{conv.messages.length}</span>
            </div>

            {conv.messages[conv.messages.length - 1] && (
              <div className="text-sm text-slate-500 truncate">{conv.messages[conv.messages.length - 1].text}</div>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); renameConversation(conv.id); }}
                className="text-xs text-blue-500"
              >
                Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="text-xs text-red-500"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
