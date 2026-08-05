import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';

export interface PrintConfig {
  billWidth: number;
  billPrintWidth: number;
  billHeight: number;
  billAutoHeight: boolean;
  billLineHeight: number;
  billFontSize: number;
  billHeaderSize: number;
  billItemSize: number;
  billTotalSize: number;
  billShowTax: boolean;
  billTaxPercent: number;
  billShopName: string;
  billPhone1: string;
  billPhone2: string;
  billFooter: string;
  billBold: boolean;
  billItalic: boolean;
  billHeaderAlign: 'left' | 'center' | 'right';
  billItemAlign: 'left' | 'center' | 'right';
  billLogo: string;
  tokenWidth: number;
  tokenPrintWidth: number;
  tokenHeight: number;
  tokenAutoHeight: boolean;
  tokenLineHeight: number;
  tokenFontSize: number;
  tokenHeaderSize: number;
  tokenIdSize: number;
  tokenItemSize: number;
  tokenBold: boolean;
  tokenItalic: boolean;
  remotePrint: boolean;
  waMessageTemplate: string;
  waDeliveryTemplate: string;
}

const DEFAULT_CONFIG: PrintConfig = {
  billWidth: 80,
  billPrintWidth: 72.1,
  billHeight: 297,
  billAutoHeight: false,
  billLineHeight: 1.4,
  billFontSize: 13,
  billHeaderSize: 18,
  billItemSize: 12,
  billTotalSize: 16,
  billShowTax: false,
  billTaxPercent: 0,
  billShopName: 'RABBANI FAST FOOD',
  billPhone1: '0307-1203000',
  billPhone2: '0316-1203000',
  billFooter: 'Thank you! Visit again!',
  billBold: true,
  billItalic: false,
  billHeaderAlign: 'center',
  billItemAlign: 'left',
  billLogo: '',
  tokenWidth: 80,
  tokenPrintWidth: 72.1,
  tokenHeight: 120,
  tokenAutoHeight: false,
  tokenLineHeight: 1.4,
  tokenFontSize: 14,
  tokenHeaderSize: 18,
  tokenIdSize: 24,
  tokenItemSize: 13,
  tokenBold: true,
  tokenItalic: false,
  remotePrint: true,
  waMessageTemplate: '*RABBANI Fast Food* 🍔\n\nOrder: {orderId}\n\n{items}\n\n*Total: Rs.{total}*\n⏰ Estimated Time: 35-40 minutes\n\nThank you! 🙏',
  waDeliveryTemplate: '*RABBANI Fast Food* 🍔\n\nDelivery Order: {orderId}\nCustomer: {customerName}\nAddress: {address}\nPhone: {phone}\n\n{items}\n\nSubtotal: Rs.{subtotal}\nDelivery: Rs.{deliveryCharges}\n*Total: Rs.{total}*\n⏰ Estimated Time: 35-40 minutes\n\nThank you! 🙏',
};



const STORAGE_KEY = 'rabbani_print_config';

export function loadPrintConfig(): PrintConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

function savePrintConfig(config: PrintConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function PrintSettings() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'bill' | 'token' | 'whatsapp'>('bill');
  const [config, setConfig] = useState<PrintConfig>(loadPrintConfig);

  const update = (key: keyof PrintConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    savePrintConfig(config);
    setOpen(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    savePrintConfig(DEFAULT_CONFIG);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1 h-8 text-xs">
        <Settings className="h-3.5 w-3.5" /> Print Settings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print & Message Settings</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 mb-3 flex-wrap">
            <button onClick={() => setTab('bill')} className={`px-3 py-1.5 text-xs font-medium rounded ${tab === 'bill' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
              Bill Settings
            </button>
            <button onClick={() => setTab('token')} className={`px-3 py-1.5 text-xs font-medium rounded ${tab === 'token' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
              Token Settings
            </button>
            <button onClick={() => setTab('whatsapp')} className={`px-3 py-1.5 text-xs font-medium rounded ${tab === 'whatsapp' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
              WhatsApp Messages
            </button>
          </div>

          {tab === 'bill' && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium">Shop Logo (URL or base64)</label>
                <Input value={config.billLogo} onChange={e => update('billLogo', e.target.value)} placeholder="https://... or paste base64" className="h-8 text-xs mt-1" />
                <input type="file" accept="image/*" className="mt-1 text-xs" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => update('billLogo', reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                {config.billLogo && <img src={config.billLogo} alt="Logo" className="h-12 mt-1 object-contain" />}
              </div>
              <div>
                <label className="text-xs font-medium">Shop Name</label>
                <Input value={config.billShopName} onChange={e => update('billShopName', e.target.value)} className="h-8 text-xs mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Phone 1</label>
                  <Input value={config.billPhone1} onChange={e => update('billPhone1', e.target.value)} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Phone 2</label>
                  <Input value={config.billPhone2} onChange={e => update('billPhone2', e.target.value)} className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium">Paper Width (mm)</label>
                  <Input type="number" step="0.1" value={config.billWidth} onChange={e => update('billWidth', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Print Width (mm)</label>
                  <Input type="number" step="0.1" value={config.billPrintWidth} onChange={e => update('billPrintWidth', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Paper Length (mm)</label>
                  <Input type="number" step="1" value={config.billHeight} onChange={e => update('billHeight', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Body Font Size (px)</label>
                <Input type="number" value={config.billFontSize} onChange={e => update('billFontSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium">Header Size (px)</label>
                  <Input type="number" value={config.billHeaderSize} onChange={e => update('billHeaderSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Item Size (px)</label>
                  <Input type="number" value={config.billItemSize} onChange={e => update('billItemSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Total Size (px)</label>
                  <Input type="number" value={config.billTotalSize} onChange={e => update('billTotalSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Header Align</label>
                  <select value={config.billHeaderAlign} onChange={e => update('billHeaderAlign', e.target.value)} className="w-full h-8 text-xs mt-1 border border-border rounded px-2 bg-background">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Item Align</label>
                  <select value={config.billItemAlign} onChange={e => update('billItemAlign', e.target.value)} className="w-full h-8 text-xs mt-1 border border-border rounded px-2 bg-background">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={config.billBold} onChange={e => update('billBold', e.target.checked)} id="billBold" />
                  <label htmlFor="billBold" className="text-xs font-bold">Bold</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={config.billItalic} onChange={e => update('billItalic', e.target.checked)} id="billItalic" />
                  <label htmlFor="billItalic" className="text-xs italic">Italic</label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={config.billShowTax} onChange={e => update('billShowTax', e.target.checked)} id="showTax" />
                <label htmlFor="showTax" className="text-xs font-medium">Show Tax</label>
                {config.billShowTax && (
                  <Input type="number" value={config.billTaxPercent} onChange={e => update('billTaxPercent', Number(e.target.value))} className="h-7 w-20 text-xs" placeholder="Tax %" />
                )}
              </div>
              <div>
                <label className="text-xs font-medium">Footer Text</label>
                <Input value={config.billFooter} onChange={e => update('billFooter', e.target.value)} className="h-8 text-xs mt-1" />
              </div>
            </div>
          )}

          {tab === 'token' && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium">Paper Width (mm)</label>
                  <Input type="number" step="0.1" value={config.tokenWidth} onChange={e => update('tokenWidth', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Print Width (mm)</label>
                  <Input type="number" step="0.1" value={config.tokenPrintWidth} onChange={e => update('tokenPrintWidth', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Paper Length (mm)</label>
                  <Input type="number" step="1" value={config.tokenHeight} onChange={e => update('tokenHeight', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Font Size (px)</label>
                  <Input type="number" value={config.tokenFontSize} onChange={e => update('tokenFontSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Item Size (px)</label>
                  <Input type="number" value={config.tokenItemSize} onChange={e => update('tokenItemSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Header Size (px)</label>
                  <Input type="number" value={config.tokenHeaderSize} onChange={e => update('tokenHeaderSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Order ID Size (px)</label>
                  <Input type="number" value={config.tokenIdSize} onChange={e => update('tokenIdSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={config.tokenBold} onChange={e => update('tokenBold', e.target.checked)} id="tokenBold" />
                  <label htmlFor="tokenBold" className="text-xs font-bold">Bold</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={config.tokenItalic} onChange={e => update('tokenItalic', e.target.checked)} id="tokenItalic" />
                  <label htmlFor="tokenItalic" className="text-xs italic">Italic</label>
                </div>
              </div>
            </div>
          )}

          {tab === 'whatsapp' && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium">Order Message Template</label>
                <p className="text-[10px] text-muted-foreground mb-1">Variables: {'{orderId}'}, {'{items}'}, {'{total}'}, {'{subtotal}'}</p>
                <textarea value={config.waMessageTemplate} onChange={e => update('waMessageTemplate', e.target.value)} className="w-full border border-border rounded p-2 text-xs h-28 bg-background resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium">Delivery Message Template</label>
                <p className="text-[10px] text-muted-foreground mb-1">Variables: {'{orderId}'}, {'{items}'}, {'{total}'}, {'{subtotal}'}, {'{customerName}'}, {'{address}'}, {'{phone}'}, {'{deliveryCharges}'}</p>
                <textarea value={config.waDeliveryTemplate} onChange={e => update('waDeliveryTemplate', e.target.value)} className="w-full border border-border rounded p-2 text-xs h-28 bg-background resize-none" />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleReset}>Reset Default</Button>
            <Button size="sm" onClick={handleSave}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
