import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Image, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SyncQRPanel } from '@/components/SyncQRPanel';

const POS_SETTINGS_KEY = 'rabbani_pos_settings';

export interface POSConfig {
  shopName: string;
  shopTagline: string;
  shopPhone: string;
  shopAddress: string;
  shopLogo: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
}

export function loadPOSConfig(): POSConfig {
  try {
    const d = localStorage.getItem(POS_SETTINGS_KEY);
    return d ? JSON.parse(d) : {
      shopName: 'RABBANI',
      shopTagline: 'Fast Food POS',
      shopPhone: '0307-1203000',
      shopAddress: '',
      shopLogo: '',
      currency: 'Rs.',
      taxRate: 0,
      receiptFooter: 'Thank you for visiting!',
    };
  } catch {
    return { shopName: 'RABBANI', shopTagline: 'Fast Food POS', shopPhone: '0307-1203000', shopAddress: '', shopLogo: '', currency: 'Rs.', taxRate: 0, receiptFooter: 'Thank you for visiting!' };
  }
}

export default function POSSettingsPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<POSConfig>(loadPOSConfig);

  const handleSave = () => {
    localStorage.setItem(POS_SETTINGS_KEY, JSON.stringify(config));
    toast({ title: 'POS Settings saved!' });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setConfig(prev => ({ ...prev, shopLogo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">POS System Settings</h1>
      </header>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        <SyncQRPanel />

        {/* Logo */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Store className="h-4 w-4" /> Shop Branding</h2>
          <div className="flex items-center gap-4">
            {config.shopLogo ? (
              <img src={config.shopLogo} alt="Logo" className="w-16 h-16 rounded-lg object-contain border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium">Shop Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs w-full" />
              <Input value={config.shopLogo} onChange={e => setConfig(p => ({ ...p, shopLogo: e.target.value }))} placeholder="Or paste logo URL" className="h-7 text-xs" />
              {config.shopLogo && <Button variant="outline" size="sm" onClick={() => setConfig(p => ({ ...p, shopLogo: '' }))} className="h-6 text-[10px]">Remove Logo</Button>}
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-bold">Shop Information</h2>
          {[
            { key: 'shopName' as const, label: 'Shop Name', placeholder: 'e.g. RABBANI' },
            { key: 'shopTagline' as const, label: 'Tagline', placeholder: 'e.g. Fast Food POS' },
            { key: 'shopPhone' as const, label: 'Phone Number', placeholder: 'e.g. 0307-1203000' },
            { key: 'shopAddress' as const, label: 'Address', placeholder: 'Shop address' },
            { key: 'currency' as const, label: 'Currency Symbol', placeholder: 'Rs.' },
            { key: 'receiptFooter' as const, label: 'Receipt Footer Message', placeholder: 'Thank you!' },
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-medium">{f.label}</label>
              <Input value={config[f.key]} onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="h-8 text-xs" />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs font-medium">Tax Rate (%)</label>
            <Input type="number" value={config.taxRate || ''} onChange={e => setConfig(p => ({ ...p, taxRate: Number(e.target.value) || 0 }))} placeholder="0" className="h-8 text-xs" />
          </div>
        </div>

        <Button onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
}
