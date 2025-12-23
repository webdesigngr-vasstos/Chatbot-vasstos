
import React from 'react';
import { Message, Role, Language } from '../types';
import { I18N } from '../constants';
import { cn } from '../lib/utils';
// Added Sparkles to the import list from lucide-react
import { ExternalLink, User, Share2, Globe, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  lang: Language;
}

const VasstosLogoSmall = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={cn("fill-current", className)}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 20 L50 85 L80 20 H65 L50 60 L35 20 Z" />
  </svg>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message, lang }) => {
  const isAssistant = message.role === Role.ASSISTANT;
  const t = I18N[lang];

  return (
    <div className={cn(
      "flex w-full animate-in fade-in slide-in-from-bottom-3 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex max-w-[88%] gap-3",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <div className={cn(
          "flex-shrink-0 h-9 w-9 rounded-2xl flex items-center justify-center shadow-md border mt-1 overflow-hidden p-2 transition-transform hover:scale-110",
          isAssistant 
            ? "bg-blue-600 border-blue-500 text-white" 
            : "bg-slate-800 border-slate-700 text-slate-400"
        )}>
          {isAssistant ? <VasstosLogoSmall className="w-full h-full" /> : <User size={18} />}
        </div>
        
        <div className={cn(
          "flex flex-col gap-1.5",
          isAssistant ? "items-start" : "items-end"
        )}>
          <div className={cn(
            "px-5 py-3.5 rounded-3xl text-[13px] md:text-[14px] leading-relaxed shadow-xl border transition-all",
            isAssistant 
              ? "bg-slate-800/90 backdrop-blur-xl text-slate-100 rounded-tl-none border-white/5" 
              : "bg-blue-600 text-white rounded-tr-none border-blue-500 shadow-blue-900/30"
          )}>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-medium">
              {message.content}
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black flex items-center gap-2">
                    <Globe size={10} className="text-blue-500" />
                    {t.sources}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group/link flex items-center gap-2 text-[10px] px-3 py-1.5 bg-white/5 hover:bg-blue-500/20 rounded-xl border border-white/5 hover:border-blue-500/30 text-blue-300 transition-all font-bold"
                    >
                      <span className="truncate max-w-[120px]">{source.title}</span>
                      <ExternalLink size={10} className="opacity-40 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 px-2 opacity-60">
             <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {/* Fix: Sparkles was referenced but not imported */}
             {isAssistant && <Sparkles size={10} className="text-blue-500 animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
