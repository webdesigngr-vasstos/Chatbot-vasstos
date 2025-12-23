
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
  Lock,
  Unlock,
  ShieldCheck,
  Code2,
  Languages
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
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('vasstos_admin_active') === 'true');
  const [activeTab, setActiveTab] = useState<'googlesites' | 'github' | 'code'>('googlesites');
  const [copied, setCopied] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  
  const [ghUser, setGhUser] = useState(() => localStorage.getItem('vasstos_gh_user') || 'vasstos-tech');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('vasstos_gh_repo') || 'chatbot-ai');
  
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('vasstos_lang') as Language) || 'pt');
  const t = I18N[lang];

  const scriptUrl = `https://${ghUser}.github.io/${ghRepo}/assets/index.js`;

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`vasstos_chat_history_${lang}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        setMessages([{ id: 'welcome', role: Role.ASSISTANT, content: t.welcome, timestamp: new Date() }]);
      }
    } else {
      setMessages([{ id: 'welcome', role: Role.ASSISTANT, content: t.welcome, timestamp: new Date() }]);
    }
  }, [lang, t.welcome]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`vasstos_chat_history_${lang}`, JSON.stringify(messages));
    }
  }, [messages, lang]);

  useEffect(() => {
    localStorage.setItem('vasstos_gh_user', ghUser);
    localStorage.setItem('vasstos_gh_repo', ghRepo);
    localStorage.setItem('vasstos_admin_active', isAdmin.toString());
    localStorage.setItem('vasstos_lang', lang);
  }, [ghUser, ghRepo, isAdmin, lang]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'pt' ? 'en' : 'pt');
  };

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 3) {
      setIsAdmin(!isAdmin);
      setLogoClicks(0);
      if (!isAdmin) {
        setShowInstallGuide(true);
      }
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
      localStorage.removeItem(`vasstos_chat_history_${lang}`);
    }
  };

  const prodSnippet = `<!-- Vasstos Academy AI Chatbot -->
<div id="root"></div>
<script type="module">
  (function() {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = '${scriptUrl}';
    document.head.appendChild(s);
  })();
</script>
<style>
  #root { 
    position: fixed; 
    bottom: 0; 
    right: 0; 
    z-index: 999999; 
    pointer-events: none; 
  }
  #root > * { 
    pointer-events: auto; 
  }
</style>`;

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-end p-4 md:p-6 z-[9999] overflow-hidden">
      
      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showInstallGuide && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-auto bg-slate-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/10 rounded-[3rem] max-w-4xl w-full shadow-[0_0_100px_rgba(59,130,246,0.15)] max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-900/20"><Terminal size={28} /></div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Central de Integração Vasstos</h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Status: Conectado ao GitHub Pages</p>
                  </div>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="p-3 hover:bg-white/5 rounded-full text-slate-400 transition-colors"><X size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 w-fit">
                  <button onClick={() => setActiveTab('googlesites')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all", activeTab === 'googlesites' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <Layout size={14} /> Google Sites
                  </button>
                  <button onClick={() => setActiveTab('code')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all", activeTab === 'code' ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <Code2 size={14} /> Snippet de Código
                  </button>
                  <button onClick={() => setActiveTab('github')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all", activeTab === 'github' ? "bg-slate-700 text-white shadow-lg shadow-slate-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <Github size={14} /> Repositório
                  </button>
                </div>

                {activeTab === 'googlesites' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck size={18} className="text-green-500" /> Guia Google Sites
                        </h4>
                        <ol className="space-y-4 text-[12px] text-slate-400">
                          <li className="flex gap-4"><span className="bg-blue-600/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">01</span> Clique em 'Incorporar' > 'Incorporar código'.</li>
                          <li className="flex gap-4"><span className="bg-blue-600/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">02</span> Cole o código ao lado e insira na página.</li>
                          <li className="flex gap-4"><span className="bg-blue-600/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">03</span> <b>Dica:</b> Arraste o bloco para que ele tenha pelo menos 400x600px de área no canto inferior.</li>
                          <li className="flex gap-4"><span className="bg-blue-600/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">04</span> Publique o site para ver as alterações.</li>
                        </ol>
                        <div className="pt-4">
                           <button onClick={() => setIsAdmin(false)} className="w-full py-4 bg-slate-800 hover:bg-red-600/10 hover:text-red-400 text-white text-[10px] font-black uppercase rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2">
                            <Lock size={14} /> Desativar Modo Admin
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="relative group">
                          <pre className="bg-black/60 p-8 rounded-[2rem] border border-white/5 font-mono text-[11px] text-blue-300 h-[300px] overflow-y-auto scrollbar-hide">
                            {prodSnippet}
                          </pre>
                          <button onClick={() => copyToClipboard(prodSnippet)} className="absolute top-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center gap-2 text-[10px] font-bold uppercase">
                            {copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copiado' : 'Copiar Snippet'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-purple-600/10 p-10 rounded-[2.5rem] border border-purple-500/20 text-center space-y-6">
                      <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto text-purple-400 border border-purple-500/30">
                        <Code2 size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-white">Integração Direta</h3>
                      <p className="text-sm text-slate-400 max-w-xl mx-auto">Ideal para WordPress, Webflow ou sites estáticos.</p>
                      <div className="relative group text-left">
                        <pre className="bg-black/60 p-8 rounded-[2rem] border border-purple-500/30 font-mono text-[12px] text-purple-300 overflow-x-auto">
                          {`<script type="module" src="${scriptUrl}"></script>`}
                        </pre>
                        <button onClick={() => copyToClipboard(`<script type="module" src="${scriptUrl}"></script>`)} className="absolute top-6 right-6 p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl shadow-xl transition-all">
                          {copied ? <Check size={16}/> : <Copy size={16}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'github' && (
                  <div className="grid grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Caminho do GitHub</label>
                      <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-5 py-4">
                        <Github size={20} className="text-slate-500" />
                        <input type="text" value={ghUser} onChange={(e) => setGhUser(e.target.value)} className="bg-transparent border-none text-sm text-white outline-none w-full" placeholder="Usuário" />
                      </div>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Repositório Público</label>
                      <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-5 py-4">
                        <Monitor size={20} className="text-slate-500" />
                        <input type="text" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} className="bg-transparent border-none text-sm text-white outline-none w-full" placeholder="Repositório" />
                      </div>
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
            <header className="px-8 py-7 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={handleLogoClick}>
                  <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-900/40 text-white w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110 active:scale-90 duration-300">
                    <VasstosLogo className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-slate-900 rounded-full shadow-lg" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    {VASSTOS_BRAND.name} <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-black uppercase tracking-widest">ACADEMY</span>
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{t.liveSupport}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-black text-slate-300 transition-all uppercase tracking-widest"
                >
                  <Languages size={14} className="text-blue-500" />
                  {lang}
                </button>

                {isAdmin && (
                  <button onClick={() => setShowInstallGuide(true)} className="p-3 hover:bg-blue-600/10 rounded-xl text-blue-500 hover:text-blue-400 transition-all border border-blue-500/20" title="Configurar"><Settings size={20} /></button>
                )}
                <button onClick={clearHistory} className="p-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-all" title="Limpar"><Trash2 size={20} /></button>
                <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/5 rounded-xl text-slate-400"><ChevronDown size={24} /></button>
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

            <footer className="p-8 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent shrink-0">
              <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
                {t.quickPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => handleSend(prompt)} disabled={isLoading} className="whitespace-nowrap px-5 py-2.5 bg-white/5 hover:bg-blue-600/10 text-[10px] text-slate-400 hover:text-blue-300 font-black rounded-full border border-white/5 hover:border-blue-500/40 transition-all uppercase tracking-widest">
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="relative group">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t.placeholder} className="w-full bg-slate-800/40 text-sm text-slate-100 pl-7 pr-16 py-5 rounded-[2rem] border border-white/10 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-600 shadow-inner" />
                <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="absolute right-2.5 top-2.5 bottom-2.5 px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl transition-all shadow-xl active:scale-90 flex items-center justify-center">
                  <Send size={20} />
                </button>
              </div>
              <div className="mt-6 flex items-center justify-between px-3">
                 <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">{t.footer}</p>
                 <span className="text-[8px] text-slate-700 uppercase tracking-widest flex items-center gap-1.5 cursor-default hover:text-slate-500 transition-colors font-bold">
                   <ShieldCheck size={10} /> Segurança Vasstos
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
          "pointer-events-auto relative flex items-center justify-center w-16 h-16 rounded-[1.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500 z-[100] group overflow-hidden",
          isOpen ? "bg-slate-800 text-white" : "bg-blue-600 text-white shadow-blue-900/40"
        )}
      >
        {!isOpen && (
          <motion.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0, 0.3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-blue-400 rounded-full"
          />
        )}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="c" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><X size={30} /></motion.div>
          ) : (
            <motion.div key="o" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><MessageSquare size={30} fill="currentColor" /></motion.div>
          )}
        </AnimatePresence>
        {!isOpen && isAdmin && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 border-4 border-slate-950 rounded-full flex items-center justify-center shadow-lg">
            <Unlock size={8} className="text-white" />
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default App;
