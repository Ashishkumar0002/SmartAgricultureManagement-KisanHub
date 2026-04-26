type KpiCardProps = {
  title: string;
  value: number;
  detail: string;
  icon: string;
  accent: string;
};

function KpiCard({ title, value, detail, icon, accent }: KpiCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-center justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${accent} text-2xl shadow-lg shadow-slate-200/40`}>{icon}</div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">{detail}</span>
      </div>
      <div className="mt-6">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default KpiCard;
