'use client';

import React, { useState } from 'react';
import {
  SquarePen,
  Search,
  MessageSquare,
  Trash2,
  X,
  MapPin,
  AlertTriangle,
  PanelLeftClose,
} from 'lucide-react';
import { Conversation } from '@/lib/history/types';
import {
  groupConversationsChronologically,
  searchLocalConversations,
} from '@/lib/history/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isOpenDesktop?: boolean;
  onToggleDesktop?: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClearAll,
  isOpenMobile,
  onCloseMobile,
  isOpenDesktop = true,
  onToggleDesktop,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filtered = React.useMemo(() => {
    return searchLocalConversations(conversations, searchQuery);
  }, [conversations, searchQuery]);

  const grouped = React.useMemo(() => {
    return groupConversationsChronologically(filtered);
  }, [filtered]);

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="space-y-1 mt-1">
          {list.map((conv) => {
            const isActive = conv.id === activeId;
            const isDeleting = deletingId === conv.id;

            return (
              <div
                key={conv.id}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-indigo-600/30 text-blue-900 dark:text-white font-semibold border border-blue-200/80 dark:border-indigo-500/40 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                >
                  <MessageSquare
                    className={`h-3.5 w-3.5 flex-shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="truncate block">{conv.title}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                      <MapPin className="h-2.5 w-2.5 text-slate-400" />
                      {conv.location.name}
                    </span>
                  </div>
                </button>

                {/* Delete button or confirm */}
                {isDeleting ? (
                  <div className="flex items-center gap-1 ml-1 bg-white dark:bg-[#070b19] px-1.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900 shadow-sm animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                        setDeletingId(null);
                      }}
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 px-1"
                      title="Confirm Delete"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      title="Cancel"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 text-slate-400 transition-opacity rounded-md hover:bg-white dark:hover:bg-slate-800"
                    title={t.chat.deleteChat}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#070b19] border-r border-slate-200/80 dark:border-indigo-500/20 p-3 select-none">
      {/* Top action: New Chat button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          <SquarePen className="h-4 w-4" />
          <span>{t.chat.newChat}</span>
        </button>

        {/* Desktop collapse button */}
        {onToggleDesktop && (
          <button
            type="button"
            onClick={onToggleDesktop}
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Local Search Input */}
      <div className="pt-3 pb-2 relative">
        <Search className="absolute left-2.5 top-5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.chat.searchHistory}
          className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0e1834] border border-slate-200 dark:border-indigo-500/20 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Grouped conversations list */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            {searchQuery ? 'No conversations found' : t.chat.noHistory}
          </div>
        ) : (
          <>
            {renderGroup(t.chat.todayGroup, grouped.today)}
            {renderGroup(t.chat.yesterdayGroup, grouped.yesterday)}
            {renderGroup(t.chat.previous7DaysGroup, grouped.previous7Days)}
            {renderGroup(t.chat.olderGroup, grouped.older)}
          </>
        )}
      </div>

      {/* Bottom action: Clear All */}
      {conversations.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          {confirmClearAll ? (
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{t.chat.confirmDeleteTitle}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClearAll(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>{t.chat.clearChat}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      {isOpenDesktop && (
        <aside className="hidden md:block w-64 h-full flex-shrink-0 animate-in slide-in-from-left duration-200">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
