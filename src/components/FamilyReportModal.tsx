import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Clock, CheckCircle2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type RangeKey = 'week' | 'month' | 'year' | 'all';

interface FamilyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemberStat {
  userId: string;
  name: string;
  count: number;
  minutes: number;
}

// Parse strings like "30 min", "1 hour", "1.5 hours", "45 minutes", "2h"
const parseEstimatedMinutes = (val: string | null | undefined): number => {
  if (!val) return 0;
  const s = String(val).toLowerCase().trim();
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  if (/h/.test(s)) return Math.round(num * 60);
  return Math.round(num);
};

const formatMinutes = (mins: number): string => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const getRangeStart = (range: RangeKey): string | null => {
  if (range === 'all') return null;
  const d = new Date();
  if (range === 'week') d.setDate(d.getDate() - 7);
  else if (range === 'month') d.setMonth(d.getMonth() - 1);
  else if (range === 'year') d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

const FamilyReportModal = ({ isOpen, onClose }: FamilyReportModalProps) => {
  const { userProfile } = useAuth();
  const [range, setRange] = useState<RangeKey>('month');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Array<{ completed_by: string | null; estimated_time: string | null }>>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!isOpen || !userProfile?.family_id) return;
    const load = async () => {
      setLoading(true);
      try {
        const familyId = userProfile.family_id;
        const startDate = getRangeStart(range);

        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('family_id', familyId);

        setMembers(
          (usersData || []).map(u => ({
            id: u.id,
            name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
          }))
        );

        let query = supabase
          .from('user_tasks')
          .select('completed_by, estimated_time, completed_date')
          .eq('family_id', familyId)
          .eq('status', 'completed')
          .not('completed_date', 'is', null);

        if (startDate) query = query.gte('completed_date', startDate);

        const { data: tasksData } = await query;
        setTasks(tasksData || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, range, userProfile?.family_id]);

  const stats = useMemo<MemberStat[]>(() => {
    const map = new Map<string, MemberStat>();
    members.forEach(m =>
      map.set(m.id, { userId: m.id, name: m.name, count: 0, minutes: 0 })
    );
    tasks.forEach(t => {
      if (!t.completed_by) return;
      const entry = map.get(t.completed_by);
      if (!entry) return;
      entry.count += 1;
      entry.minutes += parseEstimatedMinutes(t.estimated_time);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [members, tasks]);

  const totals = useMemo(
    () => ({
      count: stats.reduce((s, m) => s + m.count, 0),
      minutes: stats.reduce((s, m) => s + m.minutes, 0),
    }),
    [stats]
  );

  const maxCount = Math.max(1, ...stats.map(s => s.count));

  const ranges: { key: RangeKey; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-sage" />
            Family Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Range filter */}
          <div className="flex gap-2 flex-wrap">
            {ranges.map(r => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r.key
                    ? 'bg-sage text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-sage/10 p-4 rounded-lg">
              <div className="flex items-center text-gray-600 text-xs mb-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Total Activities
              </div>
              <p className="text-2xl font-bold text-gray-800">{totals.count}</p>
            </div>
            <div className="bg-blue-soft/10 p-4 rounded-lg">
              <div className="flex items-center text-gray-600 text-xs mb-1">
                <Clock className="w-3 h-3 mr-1" />
                Total Effort
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatMinutes(totals.minutes)}</p>
            </div>
          </div>

          {/* Per-member breakdown */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              By Family Member
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : stats.length === 0 ? (
              <p className="text-sm text-gray-500">No family members found.</p>
            ) : (
              <div className="space-y-3">
                {stats.map(s => (
                  <div key={s.userId} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-600">
                        {s.count} {s.count === 1 ? 'task' : 'tasks'} · {formatMinutes(s.minutes)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-sage h-2 rounded-full transition-all"
                        style={{ width: `${(s.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyReportModal;
