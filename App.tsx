
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Settings, 
  Languages, 
  Zap, 
  Info,
  ChevronDown,
  Copy,
  Check,
  Terminal,
  Globe,
  Layout,
  FileCode,
  Sparkles,
  Github,
  Command
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
  const [activeTab, setActiveTab] = useState<'standard' | 'googlesites' | 'github'>('github');
  const [copied, setCopied] = useState(false);
  const [ghUser, setGhUser] = useState('vasstos-tech');
  const [ghRepo, setGhRepo] = useState('chatbot-ai');
  const [lang, setLang] = useState<Language>('pt');
  const t = I18N[lang];

  const scriptUrl = `https://${ghUser}.github.io/${ghRepo}/index.js`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.ASSISTANT,
      content: t.welcome,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([{
        id: 'welcome',
        role: Role.ASSISTANT,
        content: t.welcome,
        timestamp: new Date()
      }]);
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'pt' : 'en'));
  };

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
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        content: t.error,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const standardSnippet = `<!-- Vasstos Standard Integration -->
<div id="root"></div>
<script type="module" src="${scriptUrl}"></script>`;
  
  const googleSitesSnippet = `<!-- Vasstos Google Sites Integration -->
<div id="root"></div>
<style>
  body { margin: 0; background: transparent; overflow: hidden; }
  #root { 
    position: fixed; 
    bottom: 0; 
    right: 0; 
    width: 100%; 
    height: 100%; 
    display: flex; 
    align-items: flex-end; 
    justify-content: flex-end; 
  }
</style>
<script type="module" src="${scriptUrl}"></script>`;

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-end p-4 md:p-6 z-50 overflow-hidden">
      
      {/* Deployment Console Modal */}
      <AnimatePresence>
        {showInstallGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-auto bg-slate-950/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-500">
                    <Github size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Console de Deploy Vasstos</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hospedagem & Integração • v1.5</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInstallGuide(false)} 
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                  <button 
                    onClick={() => setActiveTab('github')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      activeTab === 'github' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <Github size={14} />
                    GitHub Pages
                  </button>
                  <button 
                    onClick={() => setActiveTab('googlesites')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      activeTab === 'googlesites' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <Layout size={14} />
                    Google Sites
                  </button>
                  <button 
                    onClick={() => setActiveTab('standard')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      activeTab === 'standard' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <Globe size={14} />
                    HTML Direto
                  </button>
                </div>

                {activeTab === 'github' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Usuário GitHub</label>
                          <input 
                            type="text" 
                            value={ghUser}
                            onChange={(e) => setGhUser(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="usuario"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nome Repositório</label>
                          <input 
                            type="text" 
                            value={ghRepo}
                            onChange={(e) => setGhRepo(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="chatbot-ai"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">3. Terminal: Comandos de Build & Push</label>
                        <div className="bg-black p-4 rounded-2xl border border-white/5 font-mono text-[11px] text-green-400 group relative">
                          <button 
                            onClick={() => copyToClipboard(`git init\ngit add .\ngit commit -m "deploy chatbot"\ngit remote add origin https://github.com/${ghUser}/${ghRepo}.git\ngit push -u origin main`)}
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 p-2 rounded-lg"
                          >
                            <Copy size={14} />
                          </button>
                          <p className="text-slate-500 mb-2"># Inicializar e enviar para o GitHub</p>
                          <p>git init</p>
                          <p>git add .</p>
                          <p>git commit -m "deploy vasstos ai"</p>
                          <p>git branch -M main</p>
                          <p>git remote add origin https://github.com/{ghUser}/{ghRepo}.git</p>
                          <p>git push -u origin main</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Info size={14} className="text-blue-400" />
                          Configuração no GitHub
                        </h4>
                        <ol className="space-y-4 text-[11px] text-slate-400">
                          <li className="flex gap-3">
                            <span className="text-blue-400 font-bold">1.</span>
                            No seu repositório, vá em <strong>Settings > Pages</strong>.
                          </li>
                          <li className="flex gap-3">
                            <span className="text-blue-400 font-bold">2.</span>
                            Em <strong>Build and deployment</strong>, escolha a branch <code>main</code> e a pasta <code>/ (root)</code>.
                          </li>
                          <li className="flex gap-3">
                            <span className="text-blue-400 font-bold">3.</span>
                            Salve e aguarde o GitHub gerar a URL <code>{ghUser}.github.io</code>.
                          </li>
                        </ol>
                      </div>
                      
                      <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">URL Final do Script</h4>
                        <code className="text-[10px] text-blue-400 block break-all bg-black/40 p-3 rounded-xl border border-white/5">
                          {scriptUrl}
                        </code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <div className="relative group">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Código para Incorporar</label>
                          <button 
                            onClick={() => copyToClipboard(activeTab === 'googlesites' ? googleSitesSnippet : standardSnippet)}
                            className="text-[10px] font-bold px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center gap-1.5"
                          >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <div className="bg-black/60 p-5 rounded-2xl border border-white/5 font-mono text-[10px] md:text-[11px] leading-relaxed text-blue-300 overflow-x-auto min-h-[150px]">
                          <pre>{activeTab === 'googlesites' ? googleSitesSnippet : standardSnippet}</pre>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-5 bg-white/5 border border-white/5 rounded-3xl">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Info size={14} className="text-blue-500" />
                          Instruções Rápidas
                        </h4>
                        <ul className="space-y-4 text-[11px] text-slate-400">
                          <li className="flex gap-3">
                            <span className="text-blue-500 font-bold">A.</span>
                            {activeTab === 'googlesites' ? 'No Google Sites, use "Incorporar Código".' : 'No seu HTML, cole antes de fechar a tag </body>.'}
                          </li>
                          <li className="flex gap-3">
                            <span className="text-blue-500 font-bold">B.</span>
                            Garanta que o script URL acima esteja online e acessível.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="pointer-events-auto flex flex-col w-full max-w-[95vw] md:max-w-[400px] h-[85vh] max-h-[680px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden mb-20 md:mb-24"
          >
            <header className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="bg-blue-600 p-1.5 rounded-2xl shadow-lg shadow-blue-900/40 text-white w-10 h-10 flex items-center justify-center">
                    <VasstosLogo className="w-6 h-6" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 block w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    {VASSTOS_BRAND.name} 
                    <span className="text-blue-500 font-medium px-1.5 py-0.5 bg-blue-500/10 rounded-md text-[10px] uppercase tracking-wider">
                      {t.concierge}
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
                    {t.liveSupport}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowInstallGuide(true)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                  title="Configurações de Deploy"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/50 transition-all text-slate-300"
                >
                  <Languages size={12} />
                  {lang.toUpperCase()}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide space-y-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} lang={lang} />
              ))}
              
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-1.5 items-start pl-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 overflow-hidden p-1">
                        <VasstosLogo className="w-full h-full" />
                      </div>
                      <div className="bg-slate-800/60 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex flex-col gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                y: [0, -4, 0],
                                backgroundColor: ['#3b82f6', '#1d4ed8', '#3b82f6']
                              }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 h-1.5 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-11">
                      {t.typing}...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} className="h-2" />
            </div>

            <footer className="p-5 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                {t.quickPrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-4 py-2 bg-white/5 hover:bg-blue-600/10 text-[11px] text-slate-300 font-medium rounded-full border border-white/5 hover:border-blue-500/40 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="relative group flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t.placeholder}
                  className="w-full bg-slate-800/50 text-sm text-slate-100 pl-5 pr-14 py-4 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-800/80 transition-all placeholder:text-slate-600"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-center text-[9px] text-slate-600 mt-4 font-bold uppercase tracking-[0.2em]">
                {t.footer}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto relative flex items-center justify-center w-16 h-16 rounded-3xl shadow-2xl transition-all duration-300 z-50",
          isOpen ? "bg-slate-800 text-white rotate-180" : "bg-blue-600 text-white"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MessageSquare size={28} fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-slate-950 rounded-full"></div>
        )}
      </motion.button>

      {!isOpen && (
        <div className="fixed inset-0 pointer-events-none -z-10 bg-black overflow-hidden flex items-center justify-center">
           <div className="opacity-[0.03] text-white text-[15vw] font-black rotate-6 select-none tracking-tighter">VASSTOS.COM</div>
           <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-indigo-600/10 rounded-full blur-[100px]"></div>
        </div>
      )}
    </div>
  );
};

export default App;
