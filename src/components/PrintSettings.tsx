import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';

export interface PrintConfig {
  billWidth: number;
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
  tokenWidth: number;
  tokenFontSize: number;
  tokenHeaderSize: number;
  tokenIdSize: number;
  tokenItemSize: number;
  tokenBold: boolean;
  tokenItalic: boolean;
  waMessageTemplate: string;
  waDeliveryTemplate: string;
}

const DEFAULT_CONFIG: PrintConfig = {
  billWidth: 80,
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
  tokenWidth: 80,
  tokenFontSize: 14,
  tokenHeaderSize: 18,
  tokenIdSize: 24,
  tokenItemSize: 13,
  tokenBold: true,
  tokenItalic: false,
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
  const [tab, setTab] = useState<'bill' | 'token'>('bill');
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
            <DialogTitle>Print Settings</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 mb-3">
            <button onClick={() => setTab('bill')} className={`px-3 py-1.5 text-xs font-medium rounded ${tab === 'bill' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
              Bill Settings
            </button>
            <button onClick={() => setTab('token')} className={`px-3 py-1.5 text-xs font-medium rounded ${tab === 'token' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
              Token Settings
            </button>
          </div>

          {tab === 'bill' && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Paper Width (mm)</label>
                  <Input type="number" value={config.billWidth} onChange={e => update('billWidth', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Font Size (px)</label>
                  <Input type="number" value={config.billFontSize} onChange={e => update('billFontSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Header Size (px)</label>
                <Input type="number" value={config.billHeaderSize} onChange={e => update('billHeaderSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
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
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Paper Width (mm)</label>
                <Input type="number" value={config.tokenWidth} onChange={e => update('tokenWidth', Number(e.target.value))} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">Font Size (px)</label>
                <Input type="number" value={config.tokenFontSize} onChange={e => update('tokenFontSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">Header Size (px)</label>
                <Input type="number" value={config.tokenHeaderSize} onChange={e => update('tokenHeaderSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">Order ID Size (px)</label>
                <Input type="number" value={config.tokenIdSize} onChange={e => update('tokenIdSize', Number(e.target.value))} className="h-8 text-xs mt-1" />
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

          <DialogFooter className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleReset}>Reset Default</Button>
            <Button size="sm" onClick={handleSave}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
