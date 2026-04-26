type SidebarProps = {
  activeTab: string;
  isOpen: boolean;
  onTabChange: (tab: string) => void;
  onCollapse: () => void;
};

const items = [
  'Overview Dashboard',
  'User Management',
  'Content Management',
  'Equipment',
  'Employment',
  'Analytics',
  'Activity Logs'
];

const groups = [
  { label: 'Dashboard', items: ['Overview Dashboard'] },
  { label: 'Management', items: ['User Management', 'Content Management', 'Equipment', 'Employment'] },
  { label: 'Insights', items: ['Analytics', 'Activity Logs'] }
];

function Sidebar({ activeTab, isOpen, onTabChange, onCollapse }: SidebarProps) {
  return (
    <aside className={`flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60 transition-all duration-300 ${isOpen ? 'w-72' : 'w-20'} shrink-0`}>
      <div className="flex items-center justify-between gap-3 px-2 py-2">
        <div className={`flex items-center gap-3 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-2xl text-white shadow-md shadow-emerald-200/80">K</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">KisanHub</p>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <div className="space-y-2 px-1">
        {groups.map((group) => (
          <div key={group.label} className="rounded-3xl bg-slate-50 p-3">
            {isOpen && <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{group.label}</p>}
            <div className="mt-3 space-y-2">
              {group.items.map((item) => {
                const active = activeTab === item;
                return (
                  <button
                    key={item}
                    onClick={() => onTabChange(item)}
                    className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${
                      active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/60' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">{item === 'Overview Dashboard' ? '🏠' : item === 'User Management' ? '👥' : item === 'Content Management' ? '📄' : item === 'Equipment' ? '🛠️' : item === 'Employment' ? '💼' : item === 'Analytics' ? '📈' : '📝'}</span>
                    <span className={`${isOpen ? 'max-w-full opacity-100' : 'max-w-0 opacity-0'} overflow-hidden transition-all duration-300`}>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto hidden p-4 md:block">
        <div className="rounded-3xl bg-emerald-500 p-4 text-white shadow-lg shadow-emerald-400/20">
          <p className="text-sm uppercase tracking-[0.22em]">Live score</p>
          <p className="mt-3 text-3xl font-semibold">92.4%</p>
          <p className="mt-2 text-sm text-emerald-100">Operational health and response efficiency</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
