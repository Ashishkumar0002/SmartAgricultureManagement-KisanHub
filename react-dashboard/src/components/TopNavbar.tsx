type TopNavbarProps = {
  onToggleSidebar: () => void;
};

function TopNavbar({ onToggleSidebar }: TopNavbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm shadow-slate-200/50 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 sm:hidden"
        >
          ☰
        </button>
        <div className="flex items-center gap-3 rounded-3xl bg-slate-50 px-4 py-3 shadow-sm shadow-slate-200/40">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-2xl text-white">K</div>
          <div>
            <p className="text-sm text-slate-500">Welcome back,</p>
            <p className="text-lg font-semibold text-slate-900">Admin</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200">
          🔔
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] text-white">3</span>
        </button>
        <button className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-300/30">
          👤
        </button>
      </div>
    </header>
  );
}

export default TopNavbar;
