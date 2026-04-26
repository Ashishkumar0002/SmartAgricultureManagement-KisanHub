import { useMemo, useState } from 'react';

type TabData = {
  label: string;
  subtitle: string;
  searchPlaceholder: string;
  columns: string[];
  rows: Record<string, string>[];
  activities: { label: string; sublabel: string; time: string; category: string }[];
};

type ManagementTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabData: TabData;
};

function ManagementTabs({ activeTab, onTabChange, tabData }: ManagementTabsProps) {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(
    () =>
      tabData.rows.filter((row) =>
        Object.values(row).some((value) => value.toLowerCase().includes(search.toLowerCase()))
      ),
    [search, tabData.rows]
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Management</p>
          <h2 className="text-2xl font-semibold text-slate-900">{tabData.label}</h2>
          <p className="mt-2 text-sm text-slate-500">{tabData.subtitle}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tabData.searchPlaceholder}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
          />
          <button className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Filter
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
        <div className="grid grid-cols-3 gap-2 bg-slate-50 px-4 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 sm:grid-cols-4">
          {tabData.columns.map((column) => (
            <div key={column} className="py-2 sm:py-3">
              {column}
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100 bg-white">
          {filteredRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2 px-4 py-4 text-sm text-slate-700 sm:grid-cols-4 hover:bg-slate-50">
              {tabData.columns.map((column) => (
                <div key={`${rowIndex}-${column}`} className="truncate font-medium">
                  {row[column] ?? '-'}
                </div>
              ))}
            </div>
          ))}
          {filteredRows.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-500">No records found.</div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {['Overview Dashboard', 'User Management', 'Content Management', 'Equipment', 'Employment', 'Analytics', 'Activity Logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/40' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ManagementTabs;
