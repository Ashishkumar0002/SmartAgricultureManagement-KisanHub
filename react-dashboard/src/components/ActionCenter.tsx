type ActionCenterProps = {
  actions: { label: string; style: string }[];
};

function ActionCenter({ actions }: ActionCenterProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Action Center</p>
          <h2 className="text-2xl font-semibold text-slate-900">Quick Operations</h2>
        </div>
        <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-emerald-700">
          <p className="text-sm font-medium">Recommended</p>
          <p className="mt-1 text-xs text-emerald-600">Assign most urgent queries first</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {actions.map((action) => (
          <button key={action.label} className={`rounded-3xl px-5 py-4 text-left text-sm font-semibold transition hover:shadow-lg ${action.style}`}>
            {action.label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-slate-50 p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Latest summary</p>
        <p className="mt-3 text-base text-slate-700">Use the action center to route urgent queries, onboard advisors, and publish reports without leaving the dashboard.</p>
      </div>
    </div>
  );
}

export default ActionCenter;
