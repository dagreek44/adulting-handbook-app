import { useEffect, useState } from 'react';
import { Bell, BellOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceTokenService, type NotificationDiagnostics } from '@/services/DeviceTokenService';

const NotificationStatus = () => {
  const { user } = useAuth();
  const [diag, setDiag] = useState<NotificationDiagnostics | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      const d = await DeviceTokenService.getDiagnostics(user.id);
      if (mounted) setDiag(d);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  if (!diag) return null;
  if (!diag.isNative) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2">
        <BellOff className="w-3 h-3" />
        <span>Notifications: web (no push)</span>
      </div>
    );
  }

  const ok = diag.tokenRegistered && diag.permissionStatus === 'granted';
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  const tone = ok ? 'text-green-600' : 'text-orange-600';

  return (
    <div className="px-3 py-2 border-b border-border">
      <div className={`flex items-center gap-2 text-xs font-medium ${tone}`}>
        <Icon className="w-3 h-3" />
        <span>Notifications</span>
      </div>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Bell className="w-3 h-3" />
          <span>Permission: {diag.permissionStatus}</span>
        </div>
        <div>Token: {diag.tokenRegistered ? 'registered' : 'missing'}</div>
        <div>Platform: {diag.platform}</div>
        {diag.lastError && (
          <div className="text-destructive break-words">
            Last error: {diag.lastError}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationStatus;
