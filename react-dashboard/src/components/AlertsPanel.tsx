type AlertItem = {
  title: string;
  description: string;
  level: 'critical' | 'warning' | 'normal';
};

const badgeStyles = {
  critical: 'bg-rose-100 text-rose-700',
  warning: 'bg-amber-100 text-amber-700',
  normal: 'bg-emerald-100 text-emerald-700'
};

function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Alerts</p>
          <h2 className="text-2xl font-semibold text-slate-900">Operational health</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">3 items</span>
      </div>

      <div className="mt-6 space-y-4">
        {alerts.map((alert) => (
          <div key={alert.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm shadow-slate-100/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{alert.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{alert.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${badgeStyles[alert.level]}`}>
                {alert.level === 'critical' ? 'Critical' : alert.level === 'warning' ? 'Warning' : 'Normal'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsPanel;
