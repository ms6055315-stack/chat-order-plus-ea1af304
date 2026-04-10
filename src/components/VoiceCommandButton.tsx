import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface VoiceCommandButtonProps {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  onToggle: () => void;
}

export function VoiceCommandButton({ isListening, transcript, isSupported, onToggle }: VoiceCommandButtonProps) {
  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isListening ? 'destructive' : 'outline'}
        size="sm"
        onClick={onToggle}
        className={`gap-1.5 ${isListening ? 'animate-pulse-glow' : ''}`}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {isListening ? 'Stop' : 'Voice'}
      </Button>
      {isListening && transcript && (
        <span className="text-xs text-muted-foreground max-w-32 truncate">{transcript}</span>
      )}
    </div>
  );
}
