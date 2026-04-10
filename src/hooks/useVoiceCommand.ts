import { useState, useCallback, useRef } from 'react';
import { MenuItem } from '@/lib/menu';

interface VoiceCommandOptions {
  menuItems: MenuItem[];
  onItemFound: (item: MenuItem) => void;
}

export function useVoiceCommand({ menuItems, onItemFound }: VoiceCommandOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const findMenuItem = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    // Try exact match first
    let found = menuItems.find(i => i.name.toLowerCase() === lower);
    if (!found) {
      // Try partial match
      found = menuItems.find(i => lower.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(lower));
    }
    return found;
  }, [menuItems]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        }
        setTranscript(t);
      }
      if (finalTranscript) {
        const item = findMenuItem(finalTranscript);
        if (item) onItemFound(item);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, isSupported, findMenuItem, onItemFound]);

  return { isListening, transcript, isSupported, toggleListening };
}
