import { useState, useCallback, useRef } from 'react';
import { MenuItem } from '@/lib/menu';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AICallbacks {
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setOrderType: (type: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerAddress: (addr: string) => void;
  setTableNumber: (n: string) => void;
  setRiderName: (n: string) => void;
  setWaiterName: (n: string) => void;
  setDiscount: (d: number) => void;
  setDiscountType: (t: 'percent' | 'amount') => void;
  setDeliveryCharges: (c: number) => void;
  setPaymentStatus: (s: string) => void;
  closeOrder: () => void;
  menuItems: MenuItem[];
  cartItems: any[];
  orderType: string;
}

export function useAIAgent() {
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const callbacksRef = useRef<AICallbacks | null>(null);
  const recognitionRef = useRef<any>(null);

  const isVoiceSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const setCallbacks = useCallback((cb: AICallbacks) => {
    callbacksRef.current = cb;
  }, []);

  const processCommand = useCallback((text: string) => {
    const cb = callbacksRef.current;
    if (!cb) return 'System not ready';

    const lower = text.toLowerCase();

    // Try to find and add menu item
    const item = cb.menuItems.find(m =>
      lower.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(lower)
    );

    if (item) {
      // Check for quantity
      const qtyMatch = lower.match(/(\d+)\s*/);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      for (let i = 0; i < qty; i++) cb.addItem(item);
      return `Added ${qty}x ${item.name} (Rs.${item.price}) to cart`;
    }

    if (lower.includes('clear')) {
      cb.clearCart();
      return 'Cart cleared';
    }

    if (lower.includes('close order') || lower.includes('place order')) {
      cb.closeOrder();
      return 'Order closed!';
    }

    if (lower.includes('delivery')) {
      cb.setOrderType('delivery');
      return 'Order type set to Delivery';
    }
    if (lower.includes('takeout') || lower.includes('take out')) {
      cb.setOrderType('takeout');
      return 'Order type set to Takeout';
    }
    if (lower.includes('dine in') || lower.includes('dine-in')) {
      cb.setOrderType('dine-in');
      return 'Order type set to Dine-In';
    }
    if (lower.includes('car')) {
      cb.setOrderType('car');
      return 'Order type set to Car Order';
    }

    return `I couldn't find "${text}" in the menu. Try saying the exact item name.`;
  }, []);

  const sendMessage = useCallback((text: string) => {
    const userMsg: AIMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    setTimeout(() => {
      const response = processCommand(text);
      const assistantMsg: AIMessage = { id: `a-${Date.now()}`, role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 300);
  }, [processCommand]);

  const startVoiceInput = useCallback(() => {
    if (!isVoiceSupported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setIsListening(false);
      sendMessage(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isVoiceSupported, sendMessage]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    isAgentMode, setIsAgentMode, messages, isLoading, isListening,
    isVoiceSupported, setCallbacks, sendMessage, startVoiceInput,
    stopVoiceInput, clearMessages,
  };
}
