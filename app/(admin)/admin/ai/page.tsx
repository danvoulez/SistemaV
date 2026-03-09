'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Trash2, Lightbulb, TrendingUp, ClipboardList, Package } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Resumo de vendas', prompt: 'Faça um resumo das vendas recentes e me dê insights sobre o desempenho.' },
  { icon: Package, label: 'Estoque crítico', prompt: 'Quais produtos estão com estoque crítico ou zerado? O que preciso fazer?' },
  { icon: ClipboardList, label: 'Tarefas urgentes', prompt: 'Quais são as tarefas mais urgentes que preciso resolver hoje?' },
  { icon: Lightbulb, label: 'Insights financeiros', prompt: 'Analise a situação financeira atual e sugira melhorias ou pontos de atenção.' },
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu assistente de negócios com IA. Tenho acesso aos dados do seu sistema — pedidos, entregas, finanças, estoque, e tarefas. Como posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content?: string) {
    const text = content ?? input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = [...messages, userMsg]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro desconhecido');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message, timestamp: new Date() }
      ]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao conectar com a IA.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Desculpe, ocorreu um erro: ${errorMsg}. Verifique se a chave ANTHROPIC_API_KEY está configurada.`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversa limpa. Como posso ajudar?',
        timestamp: new Date()
      }
    ]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">Assistente IA</h1>
            <p className="text-xs text-slate-500">Powered by Claude — acessa dados do seu negócio em tempo real</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
          Limpar
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 flex-wrap mb-4">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => sendMessage(qp.prompt)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-50"
          >
            <qp.icon size={12} />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'
            }`}>
              {msg.role === 'user'
                ? <User size={14} className="text-white" />
                : <Bot size={14} className="text-white" />
              }
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-slate-400 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Analisando dados do negócio...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t mt-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta... (Enter para enviar, Shift+Enter para nova linha)"
              rows={2}
              disabled={loading}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          IA tem acesso a dados em tempo real do seu negócio — pedidos, finanças, estoque e tarefas.
        </p>
      </div>
    </div>
  );
}
