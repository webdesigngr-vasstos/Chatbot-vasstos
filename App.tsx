
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Settings, 
  ChevronDown,
  Copy,
  Check,
  Terminal,
  Layout,
  Github,
  Monitor,
  Trash2,
  FlaskConical,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck
} from 'lucide-react';
import { Role, Message, Language } from './types';
import { geminiService } from './services/gemini';
import { VASSTOS_BRAND, I18N } from './constants';
import ChatMessage from './components/ChatMessage';
import { cn } from './lib/utils';

const VasstosLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={cn("fill-current", className)}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 20 L50 85 L80 20 H65 L50 60 L35 20 Z" />
    <path d="M45 20 L55 45 L65 20 Z" opacity="0.5" />
  </svg>
);

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('vasstos_admin_active') === 'true');
  const [activeTab, setActiveTab] = useState<'googlesites' | 'github' | 'test'>('googlesites');
  const [copied, setCopied] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  
  const [ghUser, setGhUser] = useState(() => localStorage.getItem('vasstos_gh_user') || 'vasstos-tech');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('vasstos_gh_repo') || 'Chatbot-vasstos');
  
  const [lang, setLang] = useState<Language>('pt');
  const t = I18N[lang];

  const scriptUrl = `https://${ghUser}.github.io/${ghRepo}/assets/index.js`;

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('vasstos_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [{ id: 'welcome', role: Role.ASSISTANT, content: t.welcome, timestamp: new Date() }];
      }
    }
    return [{ id: 'welcome', role: Role.ASSISTANT, content: t.welcome, timestamp: new Date() }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('vasstos_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('vasstos_gh_user', ghUser);
    localStorage.setItem('vasstos_gh_repo', ghRepo);
    localStorage.setItem('vasstos_admin_active', isAdmin.toString());
  }, [ghUser, ghRepo, isAdmin]);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 3) {
      setIsAdmin(!isAdmin);
      setLogoClicks(0);
      if (!isAdmin) setShowInstallGuide(true);
    }
    setTimeout(() => setLogoClicks(0), 2000);
  };

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isOpen, scrollToBottom]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const history = messages.map(m => ({
        role: m.role === Role.ASSISTANT ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }]
      }));
      const response = await geminiService.getChatResponse(text, history, lang);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        content: response.text,
        timestamp: new Date(),
        sources: response.sources
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        content: t.error,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm(lang === 'pt' ? 'Limpar histórico de conversa?' : 'Clear chat history?')) {
      setMessages([{ id: 'welcome', role: Role.ASSISTANT, content: t.welcome, timestamp: new Date() }]);
      localStorage.removeItem('vasstos_chat_history');
    }
  };

  const prodSnippet = `<!-- Vasstos Chatbot Public Integration -->
<script type="module">
  (function() {
    if (!document.getElementById('vasstos-chatbot-container')) {
      const container = document.createElement('div');
      container.id = 'root'; // O React monta no #root por padrão
      document.body.appendChild(container);
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '${scriptUrl}';
    document.head.appendChild(script);
  })();
</script>`;

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-end p-4 md:p-6 z-[9999] overflow-hidden">
      
      {/* Simulation Frame */}
      <AnimatePresence>
        {isPreviewMode && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-auto bg-slate-950 z-[-1]">
            <iframe src="https://www.vasstos.com" className="w-full h-full border-none opacity-40 blur-[1px]" title="Vasstos Live Preview" />
            <div className="absolute top-8 left-8 flex items-center gap-4 bg-blue-600/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-blue-500/30 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white font-bold text-xs uppercase tracking-widest">Modo Preview Ativo</span>
              <button onClick={() => setIsPreviewMode(false)} className="ml-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"><X size={14}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deployment Modal */}
      <AnimatePresence>
        {showInstallGuide && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-auto bg-slate-950/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20"><Terminal size={24} /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Console de Publicação Vasstos</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configuração de Produção</p>
                  </div>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                  <button onClick={() => setActiveTab('googlesites')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'googlesites' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <Layout size={14} /> 1. Código Público
                  </button>
                  <button onClick={() => setActiveTab('github')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'github' ? "bg-slate-700 text-white shadow-lg shadow-slate-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <Github size={14} /> Repositório
                  </button>
                </div>

                {activeTab === 'googlesites' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck size={16} className="text-green-500" /> Snippet de Produção
                        </h4>
                        <p className="text-[11px] text-slate-400">Este código funciona em qualquer site (Google Sites, WordPress, HTML Puro).</p>
                        <div className="relative group">
                          <pre className="bg-black/60 p-6 rounded-2xl border border-white/5 font-mono text-[11px] text-blue-300 h-[220px] overflow-y-auto">
                            {prodSnippet}
                          </pre>
                          <button onClick={() => copyToClipboard(prodSnippet)} className="absolute top-4 right-4 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl transition-all">
                            {copied ? <Check size={16}/> : <Copy size={16}/>}
                          </button>
                        </div>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Status Público</h4>
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 text-green-400 font-bold text-xs mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Bot Ativo em Produção
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">O script está apontando para o seu GitHub Pages. Qualquer alteração que você fizer aqui e der 'Push' no GitHub será refletida automaticamente em todos os sites que usam o snippet.</p>
                        </div>
                        <button onClick={() => setIsAdmin(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2">
                          <Lock size={14} /> Sair do Modo Admin
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'github' && (
                  <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-500">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usuário/Org GitHub</label>
                      <input type="text" value={ghUser} onChange={(e) => setGhUser(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Repositório</label>
                      <input type="text" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }} className="pointer-events-auto flex flex-col w-full max-w-[95vw] md:max-w-[420px] h-[85vh] max-h-[720px] bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden mb-20 md:mb-24 relative">
            <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={handleLogoClick}>
                  <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-900/40 text-white w-11 h-11 flex items-center justify-center transition-transform group-hover:scale-105 active:scale-90">
                    <VasstosLogo className="w-7 h-7" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-slate-900 rounded-full shadow-lg" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    {VASSTOS_BRAND.name} <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-black uppercase tracking-widest">IA</span>
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-0.5">{t.liveSupport}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <>
                    <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={cn("p-2.5 rounded-xl transition-all", isPreviewMode ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "hover:bg-white/5 text-slate-400")} title="Preview Live"><Monitor size={18} /></button>
                    <button onClick={() => setShowInstallGuide(true)} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Settings size={18} /></button>
                  </>
                )}
                <button onClick={clearHistory} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-all" title="Limpar Conversa"><Trash2 size={18} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400"><ChevronDown size={22} /></button>
              </div>
            </header>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} lang={lang} />
              ))}
              <AnimatePresence>
                {isLoading && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-2 items-start pl-2">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                        <VasstosLogo className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="bg-slate-800/60 backdrop-blur-md px-5 py-3 rounded-2xl rounded-tl-none border border-white/5">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-2 w-full" />
            </div>

            <footer className="p-6 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent shrink-0">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {t.quickPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => handleSend(prompt)} disabled={isLoading} className="whitespace-nowrap px-4 py-2 bg-white/5 hover:bg-blue-600/10 text-[11px] text-slate-400 hover:text-blue-300 font-bold rounded-full border border-white/5 hover:border-blue-500/40 transition-all uppercase tracking-wider">
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="relative group">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t.placeholder} className="w-full bg-slate-800/40 text-sm text-slate-100 pl-6 pr-14 py-4.5 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-600" />
                <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center">
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between px-2">
                 <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">{t.footer}</p>
                 <span className="text-[7px] text-slate-700 uppercase tracking-widest flex items-center gap-1 cursor-default hover:text-slate-500 transition-colors">
                   <ShieldCheck size={8} /> Privacidade & Termos
                 </span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={false}
        animate={isOpen ? { scale: 0.9, rotate: 0 } : { scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto relative flex items-center justify-center w-16 h-16 rounded-[1.8rem] shadow-2xl transition-all duration-500 z-[100] group",
          isOpen ? "bg-slate-800 text-white" : "bg-blue-600 text-white shadow-blue-900/40"
        )}
      >
        {!isOpen && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-blue-400 rounded-[1.8rem]"
          />
        )}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="c" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}><X size={28} /></motion.div>
          ) : (
            <motion.div key="o" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}><MessageSquare size={28} fill="currentColor" /></motion.div>
          )}
        </AnimatePresence>
        {!isOpen && isAdmin && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 border-4 border-slate-950 rounded-full flex items-center justify-center">
            <Unlock size={8} className="text-white" />
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default App;
