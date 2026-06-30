import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Send, Trash2 } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Avatar({ name, online }) {
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  return (
    <div className="relative">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-dark text-sm font-semibold text-white">
        {initial}
      </div>
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />}
    </div>
  );
}

const sameId = (a, b) => String(a) === String(b);

export default function Chat() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const meId = user?._id || user?.id;

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [online, setOnline] = useState(() => new Set());
  const [typingFrom, setTypingFrom] = useState(null);

  const selectedRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const loadConversations = useCallback(() => {
    api.get('/chat/conversations').then((res) => setConversations(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/chat/users').then((res) => setUsers(res.data)).catch(() => {});
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onNew = (msg) => {
      const otherId = sameId(msg.sender?._id, meId) ? msg.recipient?._id : msg.sender?._id;
      const cur = selectedRef.current;
      if (cur && sameId(otherId, cur._id)) {
        setMessages((prev) => (prev.some((m) => sameId(m._id, msg._id)) ? prev : [...prev, msg]));
        if (sameId(msg.recipient?._id, meId)) {
          socket.emit('message:read', { from: cur._id });
        }
      }
      loadConversations();
    };
    const onRead = () => {
      setMessages((prev) => prev.map((m) => (sameId(m.sender?._id, meId) ? { ...m, read: true } : m)));
    };
    const onDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => !sameId(m._id, messageId)));
      loadConversations();
    };
    const onTyping = ({ from, isTyping }) => {
      const cur = selectedRef.current;
      if (cur && sameId(from, cur._id)) setTypingFrom(isTyping ? from : null);
    };
    const onOnline = ({ userId }) => setOnline((s) => new Set(s).add(String(userId)));
    const onOffline = ({ userId }) => setOnline((s) => {
      const n = new Set(s);
      n.delete(String(userId));
      return n;
    });

    socket.on('message:new', onNew);
    socket.on('message:read', onRead);
    socket.on('message:deleted', onDeleted);
    socket.on('typing', onTyping);
    socket.on('presence:online', onOnline);
    socket.on('presence:offline', onOffline);

    return () => {
      socket.off('message:new', onNew);
      socket.off('message:read', onRead);
      socket.off('message:deleted', onDeleted);
      socket.off('typing', onTyping);
      socket.off('presence:online', onOnline);
      socket.off('presence:offline', onOffline);
    };
  }, [meId, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingFrom]);

  const openChat = (u) => {
    setSelected(u);
    selectedRef.current = u;
    setTypingFrom(null);
    api.get(`/chat/messages/${u._id}`).then((res) => setMessages(res.data)).catch(() => setMessages([]));
    api.patch(`/chat/messages/${u._id}/read`).then(loadConversations).catch(() => {});
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !selected) return;
    const socket = getSocket();
    socket?.emit('message:send', { to: selected._id, content });
    setInput('');
    socket?.emit('typing', { to: selected._id, isTyping: false });
  };

  const deleteMessage = (messageId) => {
    if (!window.confirm(t('chat.confirmDelete'))) return;
    getSocket()?.emit('message:delete', { messageId });
  };

  const handleTyping = (val) => {
    setInput(val);
    if (!selected) return;
    const socket = getSocket();
    socket?.emit('typing', { to: selected._id, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit('typing', { to: selected._id, isTyping: false });
    }, 1500);
  };

  const convoFor = (uid) => conversations.find((c) => sameId(c.user?._id, uid));
  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()));

  const timeFmt = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const dateTimeFmt = (d) => {
    const date = new Date(d);
    const now = new Date();
    const time = timeFmt(date);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round((startOfToday - startOfDate) / 86400000);
    if (dayDiff === 0) return time;
    if (dayDiff === 1) return `${t('chat.yesterday')} ${time}`;
    const opts = date.getFullYear() === now.getFullYear()
      ? { day: '2-digit', month: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' };
    return `${date.toLocaleDateString(locale, opts)} ${time}`;
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl bg-card shadow-soft">
      <aside className="flex w-72 shrink-0 flex-col border-r border-border/60">
        <div className="border-b border-border/60 p-4">
          <h2 className="mb-3 text-lg font-semibold text-heading">{t('chat.title')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('chat.searchUser')}
              className="input-field py-2 pl-9 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 && <p className="p-4 text-center text-sm text-muted">{t('chat.noUsers')}</p>}
          {filteredUsers.map((u) => {
            const c = convoFor(u._id);
            const isActive = selected && sameId(selected._id, u._id);
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => openChat(u)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-body-bg ${isActive ? 'bg-body-bg' : ''}`}
              >
                <Avatar name={u.name} online={online.has(String(u._id))} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-heading">{u.name}</p>
                    {c?.lastMessageAt && <span className="shrink-0 text-[11px] text-muted">{dateTimeFmt(c.lastMessageAt)}</span>}
                  </div>
                  <p className="truncate text-xs text-muted">{c?.lastMessage || u.email}</p>
                </div>
                {c?.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-muted">{t('chat.selectConversation')}</div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
              <Avatar name={selected.name} online={online.has(String(selected._id))} />
              <div>
                <p className="text-sm font-semibold text-heading">{selected.name}</p>
                <p className="text-xs text-muted">
                  {online.has(String(selected._id)) ? t('chat.online') : selected.email}
                </p>
              </div>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto bg-body-bg/50 p-5">
              {messages.length === 0 && <p className="text-center text-sm text-muted">{t('chat.noMessages')}</p>}
              {messages.map((m) => {
                const mine = sameId(m.sender?._id, meId);
                return (
                  <div key={m._id} className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-card text-body shadow-soft'}`}>
                      <p className="whitespace-pre-wrap wrap-break-word">{m.content}</p>
                      <div className={`mt-1 flex items-center gap-2 ${mine ? 'justify-end text-white/70' : 'text-muted'}`}>
                        <span className="text-[10px]">{dateTimeFmt(m.createdAt)}{mine && m.read ? ' · ✓✓' : ''}</span>
                        {mine && (
                          <button
                            type="button"
                            onClick={() => deleteMessage(m._id)}
                            title={t('chat.deleteMessage')}
                            className="opacity-0 transition group-hover:opacity-100 hover:text-white"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingFrom && <p className="text-xs italic text-muted">{t('chat.typing')}</p>}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-3 border-t border-border/60 p-4">
              <input
                value={input}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder={t('chat.messagePlaceholder')}
                className="input-field flex-1"
              />
              <button type="submit" disabled={!input.trim()} className="btn-primary px-4">
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
