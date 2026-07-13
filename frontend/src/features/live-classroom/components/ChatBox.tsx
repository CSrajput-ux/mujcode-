import React, { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface ChatBoxProps {
  socket: Socket | null;
  currentUserId: string;
}

export function ChatBox({ socket, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;

    socket.emit('send-message', { text: inputValue.trim() });
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-slate-400 mb-1 px-1">{isMe ? 'You' : msg.senderName}</span>
                <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
                  isMe ? 'bg-[#FF7A00] text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF7A00] text-white placeholder-slate-500"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim()}
            className="bg-[#FF7A00] hover:bg-[#E66A00] disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
