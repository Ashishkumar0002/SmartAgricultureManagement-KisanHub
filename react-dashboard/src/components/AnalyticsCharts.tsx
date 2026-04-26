import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type AnalyticsChartsProps = {
  lineData: { label: string; queries: number }[];
  categoryData: { name: string; value: number }[];
  regionData: { region: string; queries: number }[];
};

const categoryColors = ['#10b981', '#f59e0b', '#6366f1', '#14b8a6'];

function AnalyticsCharts({ lineData, categoryData, regionData }: AnalyticsChartsProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Analytics</p>
          <h2 className="text-2xl font-semibold text-slate-900">Performance Overview</h2>
        </div>
        <p className="max-w-xl text-sm text-slate-500">Actionable insights from query demand, category mix, and regional performance.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Query Trends</p>
              <p className="text-2xl font-semibold text-slate-900">Last 7 days</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 20, border: '1px solid #e2e8f0' }} />
                <Line
                  type="monotone"
                  dataKey="queries"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#16a34a' }}
                  activeDot={{ r: 6 }}
                  fill="url(#lineGreen)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Query Categories</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={84} paddingAngle={4}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 20, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {categoryData.map((category, idx) => (
                <div key={category.name} className="rounded-3xl bg-white p-3 shadow-sm shadow-slate-100/70">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} />
                    <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{category.value}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Region-wise queries</p>
              <p className="text-2xl font-semibold text-slate-900">By location</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="region" tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: 20, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="queries" radius={[12, 12, 0, 0]} fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsCharts;
