import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Minimize2, RefreshCw } from 'lucide-react'
import { useChatbot } from '../../hooks/useChatbot'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const { messages, typing, sendMessage, clearChat } = useChatbot()
  const bottomRef = useRef()

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {open && (
        <div className="mb-3 w-80 sm:w-96 h-[500px] glass-card flex flex-col shadow-card-hover animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="text-slate-900 text-sm font-medium">CareMate AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-teal-400 text-xs">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="Clear chat">
                <RefreshCw size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {['Check my symptoms', 'Medication help', 'BP reading advice'].map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-full text-xs text-slate-600 hover:text-teal-700 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          <ChatInput onSend={sendMessage} disabled={typing} />
        </div>
      )}

      {/* Toggle Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(p => !p)}
          className={`w-14 h-14 rounded-2xl shadow-glow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${open ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gradient-to-br from-teal-500 to-teal-700'}`}
        >
          {open ? <X size={22} className="text-white" /> : <MessageSquare size={22} className="text-white" />}
        </button>
      </div>
    </div>
  )
}
