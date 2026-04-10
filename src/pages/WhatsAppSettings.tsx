import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const WA_SETTINGS_KEY = 'rabbani_whatsapp_settings';

interface WhatsAppSettings {
  phoneNumberId: string;
  whatsappBusinessId: string;
  accessToken: string;
  verifyToken: string;
  displayPhone: string;
}

function loadSettings(): WhatsAppSettings {
  try {
    const d = localStorage.getItem(WA_SETTINGS_KEY);
    return d ? JSON.parse(d) : { phoneNumberId: '', whatsappBusinessId: '', accessToken: '', verifyToken: '', displayPhone: '' };
  } catch { return { phoneNumberId: '', whatsappBusinessId: '', accessToken: '', verifyToken: '', displayPhone: '' }; }
}

export default function WhatsAppSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WhatsAppSettings>(loadSettings);

  const handleSave = () => {
    localStorage.setItem(WA_SETTINGS_KEY, JSON.stringify(settings));
    toast({ title: 'Settings saved!', description: 'WhatsApp integration settings updated.' });
  };

  const fields: { key: keyof WhatsAppSettings; label: string; placeholder: string; type?: string }[] = [
    { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: 'e.g. 1234567890' },
    { key: 'whatsappBusinessId', label: 'WhatsApp Business Account ID', placeholder: 'e.g. 9876543210' },
    { key: 'accessToken', label: 'Access Token', placeholder: 'EAAxxxxxxx...', type: 'password' },
    { key: 'verifyToken', label: 'Verify Token', placeholder: 'Your webhook verify token' },
    { key: 'displayPhone', label: 'Display Phone Number', placeholder: 'e.g. +92 307 1203000' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">WhatsApp Integration Settings</h1>
      </header>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-bold">WhatsApp Business API Configuration</h2>
          <p className="text-xs text-muted-foreground">
            Configure your WhatsApp Business API credentials. You can get these from the Meta Developer Console → WhatsApp → API Setup.
          </p>

          {fields.map(field => (
            <div key={field.key} className="space-y-1">
              <label className="text-xs font-medium">{field.label}</label>
              <Input
                type={field.type || 'text'}
                value={settings[field.key]}
                onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-bold">How to get credentials</h2>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to <span className="text-foreground">developers.facebook.com</span></li>
            <li>Create or select your app → WhatsApp → API Setup</li>
            <li>Copy the <span className="text-foreground">Phone Number ID</span></li>
            <li>Copy the <span className="text-foreground">WhatsApp Business Account ID</span></li>
            <li>Generate a permanent <span className="text-foreground">Access Token</span></li>
            <li>Set a custom <span className="text-foreground">Verify Token</span> for webhooks</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="gap-1.5">
            <X className="h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
