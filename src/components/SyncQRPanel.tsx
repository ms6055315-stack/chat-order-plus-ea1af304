import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, RefreshCw, Link2Off } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createSyncCode, getSyncCode, getSyncUrl, setSyncCode, stopSync } from '@/lib/posSync';

export function SyncQRPanel() {
  const [code, setCode] = useState<string | null>(() => getSyncCode());
  const [qr, setQr] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!code) {
      setQr('');
      return;
    }
    QRCode.toDataURL(getSyncUrl(code), { width: 320, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [code]);

  const handleEnable = () => {
    setCode(createSyncCode());
    toast({ title: 'Device sync enabled', description: 'Scan the QR on another device.' });
    setTimeout(() => window.location.reload(), 600);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    setSyncCode(joinCode);
    window.location.href = getSyncUrl(joinCode.trim().toUpperCase());
  };

  const handleStop = () => {
    stopSync();
    setCode(null);
    toast({ title: 'Device sync turned off' });
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h2 className="text-sm font-bold flex items-center gap-2">
        <QrCode className="h-4 w-4" /> Device Sync (QR)
      </h2>
      <p className="text-xs text-muted-foreground">
        Scan this QR on a phone or tablet to open the same POS in its browser. Orders, menu and settings stay in sync
        across every connected device. Share the code with staff only.
      </p>

      {code ? (
        <div className="space-y-3">
          {qr && <img src={qr} alt="POS sync QR code" width={200} height={200} className="w-48 h-48 rounded bg-white p-2" />}
          <div className="text-xs">
            Sync code: <span className="font-mono font-bold text-primary">{code}</span>
          </div>
          <div className="text-[10px] text-muted-foreground break-all">{getSyncUrl(code)}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleEnable}>
              <RefreshCw className="h-3.5 w-3.5" /> New Code
            </Button>
            <Button variant="destructive" size="sm" className="gap-1" onClick={handleStop}>
              <Link2Off className="h-3.5 w-3.5" /> Turn Off
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button size="sm" className="gap-1" onClick={handleEnable}>
            <QrCode className="h-3.5 w-3.5" /> Enable Sync & Show QR
          </Button>
          <div className="flex gap-2 items-center">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter existing code"
              className="h-8 text-xs"
            />
            <Button variant="outline" size="sm" onClick={handleJoin}>
              Join
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
