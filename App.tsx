
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
  FileCode,
  Github,
  Monitor,
  Trash2,
  FlaskConical,
  Sparkles
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
  const [activeTab, setActiveTab] = useState<'googlesites' | 'github' | 'test'>('test');
  const [copied, setCopied] = useState(false);
  
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
  }, [ghUser, ghRepo]);

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
      const welcome = { id: 'welcome', role: Role.ASSISTANT, content: t.welcome, timestamp: new Date() };
      setMessages([welcome]);
      localStorage.removeItem('vasstos_chat_history');
    }
  };

  const simulateTestResponse = () => {
    setIsLoading(true);
    setIsOpen(true);
    setShowInstallGuide(false);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.ASSISTANT,
        content: t.simulationMsg,
        timestamp: new Date(),
        sources: [
          { title: "Vasstos Cloud", uri: "https://www.vasstos.com/cloud" },
          { title: "Vasstos IA Solutions", uri: "https://www.vasstos.com/ai" }
        ]
      }]);
      setIsLoading(false);
    }, 1200);
  };

  const googleSitesSnippet = `<!-- Vasstos Chatbot Integration -->
<div id="vasstos-root"></div>
<style>
  #vasstos-root { position: fixed; bottom: 0; right: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999; }
  #vasstos-root > * { pointer-events: auto; }
</style>
<script type="module" src="${scriptUrl}"></script>`;

  const instantTestSnippet = `(function() {
  const root = document.createElement('div');
  root.id = 'vasstos-chat-test';
  document.body.appendChild(root);
  const script = document.createElement('script');
  script.type = 'module';
  script.src = '${scriptUrl}';
  document.head.appendChild(script);
  console.log('🚀 Chatbot Vasstos inicializado via console.');
})();`;

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-end p-4 md:p-6 z-[9999] overflow-hidden">
      
      {/* Simulation Frame */}
      <AnimatePresence>
        {isPreviewMode && (
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
        {showInstallGuide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-auto bg-slate-950/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20"><Terminal size={24} /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Setup de Integração Vasstos</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Versionamento & Deploy v3.0</p>
                  </div>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                  <button onClick={() => setActiveTab('test')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'test' ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <FlaskConical size={14} /> 1. Testar
                  </button>
                  <button onClick={() => setActiveTab('googlesites')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'googlesites' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <Layout size={14} /> 2. Publicar
                  </button>
                  <button onClick={() => setActiveTab('github')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'github' ? "bg-slate-700 text-white shadow-lg shadow-slate-900/40" : "text-slate-500 hover:text-slate-300")}>
                    <Github size={14} /> Repositório
                  </button>
                </div>

                {activeTab === 'test' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-purple-600/10 p-8 rounded-[2rem] border border-purple-500/20 text-center space-y-4">
                      <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto text-purple-400 border border-purple-500/30">
                        <FlaskConical size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-white">Teste Instantâneo no Site Real</h3>
                      <p className="text-sm text-slate-400 max-w-md mx-auto">Copie o código abaixo, abra o site da Vasstos, aperte F12 e cole no Console para ver o bot funcionando agora.</p>
                      <div className="relative group">
                        <pre className="bg-black/60 p-6 rounded-2xl border border-purple-500/30 font-mono text-[11px] text-purple-300 text-left overflow-x-auto">
                          {instantTestSnippet}
                        </pre>
                        <button onClick={() => copyToClipboard(instantTestSnippet)} className="absolute top-4 right-4 p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                          {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copiado' : 'Copiar Script'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'googlesites' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <Terminal size={16} className="text-blue-500" /> Snippet de Integração
                        </h4>
                        <div className="relative group">
                          <pre className="bg-black/60 p-6 rounded-2xl border border-white/5 font-mono text-[11px] text-blue-300 h-[220px] overflow-y-auto">
                            {googleSitesSnippet}
                          </pre>
                          <button onClick={() => copyToClipboard(googleSitesSnippet)} className="absolute top-4 right-4 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl transition-all">
                            {copied ? <Check size={16}/> : <Copy size={16}/>}
                          </button>
                        </div>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Passo a Passo</h4>
                        <ol className="space-y-3 text-[11px] text-slate-400">
                          <li className="flex gap-3"><span className="text-blue-500 font-bold">01.</span> No Google Sites, clique em 'Incorporar'.</li>
                          <li className="flex gap-3"><span className="text-blue-500 font-bold">02.</span> Escolha a aba 'Incorporar código'.</li>
                          <li className="flex gap-3"><span className="text-blue-500 font-bold">03.</span> Cole o snippet acima e salve.</li>
                          <li className="flex gap-3"><span className="text-blue-500 font-bold">04.</span> Redimensione o bloco para o tamanho total da página.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'github' && (
                  <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-500">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Proprietário GitHub</label>
                      <input type="text" value={ghUser} onChange={(e) => setGhUser(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome do Repositório</label>
                      <input type="text" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
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
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }} className="pointer-events-auto flex flex-col w-full max-w-[95vw] md:max-w-[420px] h-[85vh] max-h-[720px] bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden mb-20 md:mb-24">
            <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-900/40 text-white w-11 h-11 flex items-center justify-center transition-transform group-hover:scale-105">
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
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={cn("p-2.5 rounded-xl transition-all", isPreviewMode ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "hover:bg-white/5 text-slate-400")} title="Preview Live"><Monitor size={18} /></button>
                <button onClick={clearHistory} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-all" title="Limpar Conversa"><Trash2 size={18} /></button>
                <button onClick={() => setShowInstallGuide(true)} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Settings size={18} /></button>
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
              <p className="text-center text-[8px] text-slate-600 mt-5 font-black uppercase tracking-[0.3em]">{t.footer}</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)} className={cn("pointer-events-auto relative flex items-center justify-center w-16 h-16 rounded-[1.8rem] shadow-2xl transition-all duration-500 z-[100]", isOpen ? "bg-slate-800 text-white rotate-180" : "bg-blue-600 text-white shadow-blue-900/40")}>
        <AnimatePresence mode="wait">
          {isOpen ? <motion.div key="c"><X size={28} /></motion.div> : <motion.div key="o"><MessageSquare size={28} fill="currentColor" /></motion.div>}
        </AnimatePresence>
        {!isOpen && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-slate-950 rounded-full" />}
      </motion.button>
    </div>
  );
};

export default App;
