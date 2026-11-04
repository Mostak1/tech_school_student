'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExamItem = { exam_date: string; name: string; grade: string; obtained: number; total: number | null; };
export type OnlineExamItem = { name: string; obtained: number; total: number | null };

// ── Constants ─────────────────────────────────────────────────────────────────

export const CATEGORY_BAR_COLORS = ['#1B3A5F', '#EF4444', '#F59E0B', '#3B82F6', '#3DBCA3'];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function gradeColor(grade: string): { bg: string; text: string } {
  if (['A+', 'A'].includes(grade)) return { bg: '#E6F7F5', text: '#3DBCA3' };
  if (['B+', 'B'].includes(grade)) return { bg: '#E8EEF2', text: '#22577A' };
  if (['C+', 'C'].includes(grade)) return { bg: '#FDF8EC', text: '#DB9305' };
  return { bg: '#FFF3F3', text: '#FF6769' };
}

// ── CardSkeleton ──────────────────────────────────────────────────────────────

export function CardSkeleton() {
  return <div className="h-full w-full rounded-xl bg-gray-100 animate-pulse min-h-16" />;
}

// ── RadialCircle ──────────────────────────────────────────────────────────────

export function RadialCircle({
  value, max, color, trailColor, label, displayValue, size,
}: {
  value: number; max: number; color: string; trailColor: string;
  label: string; displayValue: string; size?: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const trailBarSize = size ? Math.round(5 * (size / 144)) : 8;
  const progressBarSize = size ? Math.round(12 * (size / 144)) : 20;
  const containerStyle = size ? { width: size, height: size } : undefined;
  const containerClass = size ? 'relative' : 'relative w-full h-full';
  return (
    <div className={containerClass} style={containerStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="95%"
          barSize={trailBarSize} data={[{ value: 100, fill: trailColor }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" background={false} isAnimationActive={false} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%"
            barSize={progressBarSize} data={[{ value: pct, fill: color }]} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={10} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 overflow-hidden">
        <span className="text-2xl font-bold text-gray-900 leading-tight" dir="ltr">{displayValue}</span>
        <span className="text-xs text-gray-500 text-center line-clamp-2 leading-tight">{label}</span>
      </div>
    </div>
  );
}

// ── DiaryDonut ────────────────────────────────────────────────────────────────

export function DiaryDonut({ positive, negative, total, label }: {
  positive: number; negative: number; total: number; label: string;
}) {
  const data =
    total > 0
      ? [{ value: positive, fill: '#83B807' }, { value: negative, fill: '#FF6769' }].filter(s => s.value > 0)
      : [{ value: 1, fill: '#E5E7EB' }];
  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" startAngle={90} endAngle={-270}
            innerRadius="80%" outerRadius="95%" dataKey="value" stroke="none"
            cornerRadius={14} paddingAngle={4}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-gray-900 leading-tight">{total}</span>
        <span className="text-[16px] text-gray-900 text-center leading-tight">{label}</span>
      </div>
    </div>
  );
}

// ── OnlineExamDonut ───────────────────────────────────────────────────────────

export function OnlineExamDonut({ total, completed, missed }: {
  total: number; completed: number; missed: number;
}) {
  const data =
    total > 0
      ? [{ value: completed, fill: '#22577A' }, { value: missed, fill: '#FF6769' }].filter(s => s.value > 0)
      : [{ value: 1, fill: '#E5E7EB' }];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" startAngle={90} endAngle={-270}
          innerRadius="70%" outerRadius="95%"  dataKey="value" stroke="none"
          cornerRadius={14} paddingAngle={4}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── AssignmentDonut ───────────────────────────────────────────────────────────

export function AssignmentDonut({ accepted, submitted, pending, rejected, total }: {
  accepted: number; submitted: number; pending: number; rejected: number; total: number;
}) {
  const safe = (v: number) =>
    total > 0 ? [{ value: v }, { value: Math.max(total - v, 0) }] : [{ value: 0 }, { value: 1 }];
  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={safe(accepted)} cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius="80%" outerRadius="92%" dataKey="value" stroke="none" cornerRadius={5}>
            <Cell fill="#57CC99" /><Cell fill="#E5E7EB" />
          </Pie>
          <Pie data={safe(submitted)} cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius="60%" outerRadius="72%" dataKey="value" stroke="none" cornerRadius={5}>
            <Cell fill="#22577A" /><Cell fill="#E5E7EB" />
          </Pie>
          <Pie data={safe(pending)} cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius="40%" outerRadius="52%" dataKey="value" stroke="none" cornerRadius={5}>
            <Cell fill="#DB9305" /><Cell fill="#E5E7EB" />
          </Pie>
          <Pie data={safe(rejected)} cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius="20%" outerRadius="32%" dataKey="value" stroke="none" cornerRadius={5}>
            <Cell fill="#FF6769" /><Cell fill="#E5E7EB" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── ExamPerformanceSection ────────────────────────────────────────────────────

export function ExamPerformanceSection({ title, items, marksColor = '#57CC99' }: {
  title: string; items: ExamItem[]; emptyLabel?: string; marksColor?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 text-start">
      <p className="text-sm font-medium text-gray-700 h-5.25 flex items-center text-start">{title}</p>
      <div className="flex flex-col 2xl:flex-row gap-3">
          {items.map((exam, i) => (
            <div key={i} className="flex-1 min-w-0 h-17.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded p-2 flex items-center gap-4">
              <div className="flex flex-col gap-1 flex-1 min-w-0 text-start">
                <span className="text-xs font-medium text-gray-800 truncate leading-tight text-start">{exam.name}</span>
                <span className="text-xs text-gray-500 truncate leading-tight text-start">{exam.exam_date}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center justify-center text-xs font-bold text-white rounded"
                  style={{ width: 35, height: 35, backgroundColor: '#22577A' }}>{exam.grade}</span>
                <span className="flex items-center justify-center text-xs font-bold text-white rounded shrink-0"
                  style={{ width: 78, height: 35, backgroundColor: marksColor }}>
                  <span dir="ltr">{exam.obtained}/{exam.total ?? '—'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}

// ── OnlineExamPerformanceSection ──────────────────────────────────────────────

export function OnlineExamPerformanceSection({ title, items, badgeColor }: {
  title: string; items: OnlineExamItem[]; badgeColor: string; emptyLabel?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 text-start">
      <p className="text-sm font-normal text-black h-5.25 flex items-center text-start">{title}</p>
      <div className="flex flex-col 2xl:flex-row gap-3">
          {items.map((exam, i) => (
            <div key={i} className="flex-1 min-w-0 h-14.75 bg-[#F7F7F7] border border-[#EAEAEA] rounded p-2 flex items-center gap-4">
              <span className="text-sm font-normal text-black flex-1 min-w-0 truncate text-start">{exam.name}</span>
              <span className="text-xs font-bold text-white rounded px-2 py-1 shrink-0 whitespace-nowrap"
                style={{ backgroundColor: badgeColor }}>
                <span dir="ltr">{exam.obtained} / {exam.total ?? '—'}</span>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
