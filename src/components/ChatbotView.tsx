import { useEffect, useState } from 'react';
import { AlertTriangle, MessageSquarePlus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { ChatMessage, ChatSession, PetProfile } from '../types/pawheal';

interface ChatbotViewProps {
  pets: PetProfile[];
  onOpenNearbyVets: () => void;
}

const SUGGESTED_QUESTIONS = [
  'What warning signs mean vomiting requires an emergency vet visit?',
  'How should I safely clean dirt from a dog’s paw pad at home?',
  'Which common household foods and plants are toxic to cats and dogs?',
  'How can I tell if my pet is dehydrated or overheating?',
];

export function ChatbotView({ pets, onOpenNearbyVets }: ChatbotViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id ?? '');
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const res = await apiRequest<{ sessions: ChatSession[] }>('/api/chat/sessions');
      setSessions(res.sessions);
      if (res.sessions.length > 0 && !activeSessionId) {
        await selectSession(res.sessions[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load chat history.');
    } finally {
      setLoadingSessions(false);
    }
  }

  async function selectSession(sessionId: string) {
    setError(null);
    setActiveSessionId(sessionId);
    try {
      const res = await apiRequest<{ session: ChatSession; messages: ChatMessage[] }>(
        `/api/chat/sessions/${sessionId}/messages`,
      );
      setMessages(res.messages);
      if (res.session.petId) setSelectedPetId(res.session.petId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load conversation.');
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  function startNewSession() {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setLastFailedPrompt(null);
  }

  async function sendMessage(textToSend: string) {
    const clean = textToSend.trim();
    if (!clean || sending) return;
    setError(null);
    setLastFailedPrompt(null);
    setSending(true);

    try {
      const res = await apiRequest<{
        session: ChatSession;
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSessionId,
          petId: selectedPetId || null,
          message: clean,
        }),
      });

      setActiveSessionId(res.session.id);
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
      setInput('');
      setSessions((prev) => {
        const without = prev.filter((s) => s.id !== res.session.id);
        return [res.session, ...without];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach AI assistant.');
      setLastFailedPrompt(clean);
    } finally {
      setSending(false);
    }
  }

  async function deleteSession(id: string) {
    await apiRequest(`/api/chat/sessions/${id}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      startNewSession();
    }
  }

  const hasUrgentAlert = messages.some((m) => m.urgencyFlag === 'urgent_vet');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8E2]">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#111817]">
            AI Pet-Care Assistant
          </h1>
          <p className="text-sm text-[#4A5553] mt-1">
            Ask symptom, nutrition, or first-aid questions grounded in your selected pet&apos;s profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            aria-label="Pet context"
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#D4DDD4] bg-white text-sm"
          >
            <option value="">General pet advice</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                Context: {p.name} ({p.species})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={startNewSession}
            className="h-10 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 bg-white rounded-xl border border-[#E2E8E2] p-4 space-y-3">
          <h2 className="font-display text-sm font-semibold text-[#111817]">Conversations</h2>
          {loadingSessions ? (
            <p className="text-xs text-[#4A5553]">Loading conversations...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-[#4A5553]">
              Your conversation history will appear here once you ask a question.
            </p>
          ) : (
            <div className="space-y-1.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm border ${
                    activeSessionId === s.id
                      ? 'border-[#0F766E] bg-[#0F766E]/5 text-[#111817]'
                      : 'border-transparent hover:bg-[#F3F5F3] text-[#4A5553]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void selectSession(s.id)}
                    className="text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="font-medium text-[#111817] truncate">{s.title}</p>
                    <p className="text-xs text-[#64716E] truncate">
                      {s.petName ? `${s.petName} · ` : ''}
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSession(s.id)}
                    aria-label="Delete conversation"
                    className="p-1.5 text-[#64716E] hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8E2] flex flex-col min-h-[540px]">
          {hasUrgentAlert && (
            <div className="p-4 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-sm text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>
                  Emergency warning detected. Contact an emergency veterinarian immediately rather than waiting.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenNearbyVets}
                className="h-9 px-3 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Find Nearby Vets
              </button>
            </div>
          )}

          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[460px]">
            {messages.length === 0 ? (
              <div className="space-y-4 py-4">
                <p className="text-sm text-[#4A5553]">
                  Start a conversation or choose a common pet-care question below:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="text-left p-3.5 rounded-xl border border-[#E2E8E2] hover:border-[#0F766E] text-xs sm:text-sm text-[#111817] transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#F3F5F3] text-[#111817] border border-[#E2E8E2]'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && msg.suggestedFollowUps.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                      {msg.suggestedFollowUps.map((followUp) => (
                        <button
                          key={followUp}
                          type="button"
                          onClick={() => void sendMessage(followUp)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#D4DDD4] bg-white hover:border-[#0F766E] text-[#111817] cursor-pointer"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-[#4A5553]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F766E]" />
                <span>PawHeal assistant is reviewing your pet&apos;s context...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800 flex items-center justify-between gap-3">
              <span>{error}</span>
              {lastFailedPrompt && (
                <button
                  type="button"
                  onClick={() => void sendMessage(lastFailedPrompt)}
                  className="px-3 py-1 rounded-md bg-red-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="p-4 border-t border-[#E2E8E2] flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, wound care, toxins, or recovery..."
              className="flex-1 h-11 px-4 rounded-lg border border-[#D4DDD4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="h-11 px-4 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
