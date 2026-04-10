import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AIMessage } from '@/hooks/useAIAgent';
import { Bot, Mic, MicOff, Send, Trash2, X } from 'lucide-react';

interface AIAgentPanelProps {
  messages: AIMessage[];
  isLoading: boolean;
  isListening: boolean;
  isVoiceSupported: boolean;
  onSendMessage: (text: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onClear: () => void;
  onClose: () => void;
}

export function AIAgentPanel({
  messages, isLoading, isListening, isVoiceSupported,
  onSendMessage, onStartVoice, onStopVoice, onClear, onClose,
}: AIAgentPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-2xl flex flex-col max-h-96 z-50">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Agent</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onClear} className="p-1 hover:bg-accent rounded"><Trash2 className="h-3.5 w-3.5" /></button>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">Say an item name to add it to cart, or type a command.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`text-xs p-2 rounded-lg max-w-[90%] ${
            msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-accent text-accent-foreground'
          }`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="text-xs text-muted-foreground">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-border flex gap-1">
        {isVoiceSupported && (
          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="sm"
            onClick={isListening ? onStopVoice : onStartVoice}
            className="h-8 w-8 p-0"
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type command..."
          className="h-8 text-xs"
        />
        <Button size="sm" onClick={handleSend} className="h-8 w-8 p-0">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface AIAgentButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export function AIAgentButton({ isActive, onClick }: AIAgentButtonProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="gap-1.5"
    >
      <Bot className="h-4 w-4" />
      AI Agent
    </Button>
  );
}
