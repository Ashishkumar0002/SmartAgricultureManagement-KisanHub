import type { ActivityItem } from '../data/dashboardData';

type ActivityFeedProps = {
  activities: ActivityItem[];
};

function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Recent Activity</p>
          <h2 className="text-2xl font-semibold text-slate-900">Latest updates</h2>
        </div>
        <span className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Timeline view</span>
      </div>

      <div className="mt-6 space-y-4">
        {activities.map((item) => (
          <div key={`${item.label}-${item.time}`} className="rounded-3xl bg-slate-50 p-4 shadow-sm shadow-slate-100/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{item.sublabel}</p>
              </div>
              <span className="text-sm text-slate-500">{item.time}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${item.category === 'success' ? 'bg-emerald-500' : item.category === 'warning' ? 'bg-amber-500' : 'bg-sky-500'}`} />
              <p className="text-slate-500">{item.category === 'success' ? 'Success' : item.category === 'warning' ? 'Warning' : 'Info'} event</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;
