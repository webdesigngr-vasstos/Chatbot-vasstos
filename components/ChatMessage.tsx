
import React from 'react';
import { Message, Role, Language } from '../types';
import { I18N } from '../constants';
import { cn } from '../lib/utils';
import { ExternalLink, User, Sparkles } from 'lucide-react';

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
      "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex max-w-[85%] group",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <div className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border mt-1 overflow-hidden p-1.5",
          isAssistant 
            ? "bg-blue-600 border-blue-500 text-white" 
            : "bg-slate-800 border-slate-700 text-slate-400"
        )}>
          {isAssistant ? <VasstosLogoSmall className="w-full h-full" /> : <User size={14} />}
        </div>
        
        <div className={cn(
          "mx-2 flex flex-col",
          isAssistant ? "items-start" : "items-end"
        )}>
          <div className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all",
            isAssistant 
              ? "bg-slate-800/80 backdrop-blur-sm text-slate-100 rounded-tl-none border border-white/10" 
              : "bg-blue-600 text-white rounded-tr-none shadow-blue-900/20"
          )}>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
              {message.content}
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                  <ExternalLink size={10} />
                  {t.sources}
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-blue-300 transition-colors flex items-center gap-1"
                    >
                      {source.title.length > 22 ? source.title.substring(0, 22) + '...' : source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <span className="text-[9px] mt-1 text-slate-500 font-medium px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
