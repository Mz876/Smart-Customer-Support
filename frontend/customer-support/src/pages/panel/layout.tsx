import React, { useState } from 'react';
import type { Conversation } from '../../types/panel/panelTypes';
import Sidebar from '../../components/Sidebar';
interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function createConversation() {
    const id = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: `Conversation ${conversations.length + 1}`,
      lastUpdated: Date.now(),
      messages: []
    };
    setConversations(prev => {
      const next = [newConv, ...prev];
      setActiveId(id);
      return next;
    });
  }

  function deleteConversation(id: string) {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  function renameConversation(id: string) {
    const newTitle = prompt('Enter new title')?.trim();
    if (!newTitle) return;
    setConversations(cvs => cvs.map(c => c.id === id ? { ...c, title: newTitle } : c));
  }

  return (
    <div className="min-h-screen bg-red-500">
      <div className="mx-auto bg-white shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-4 h-[100vh]">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          setActiveId={setActiveId}
          createConversation={createConversation}
          deleteConversation={deleteConversation}
          renameConversation={renameConversation}
          query={query}
          setQuery={setQuery}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content area */}
        <div className="md:col-span-3 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}