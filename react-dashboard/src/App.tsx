import { useMemo, useState } from 'react';
import AnalyticsCharts from './components/AnalyticsCharts';
import ActionCenter from './components/ActionCenter';
import ActivityFeed from './components/ActivityFeed';
import AlertsPanel from './components/AlertsPanel';
import KpiCard from './components/KpiCard';
import ManagementTabs from './components/ManagementTabs';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import {
  actions,
  activeExperts,
  aiInsight,
  alerts,
  categoryDistribution,
  criticalAlerts,
  managementTabs,
  pendingQueries,
  queryTrend,
  regionQueries,
  totalFarmers,
  totalQueries
} from './data/dashboardData';

const kpis = [
  {
    title: 'Total Farmers',
    value: totalFarmers,
    detail: '+8.4%',
    icon: '👨‍🌾',
    accent: 'from-emerald-500 to-lime-400'
  },
  {
    title: 'Active Experts',
    value: activeExperts,
    detail: '+4.7%',
    icon: '🧑‍🔬',
    accent: 'from-sky-500 to-cyan-400'
  },
  {
    title: 'Total Queries',
    value: totalQueries,
    detail: '+12.1%',
    icon: '❓',
    accent: 'from-violet-500 to-fuchsia-400'
  },
  {
    title: 'Pending Queries',
    value: pendingQueries,
    detail: '-3.8%',
    icon: '⏳',
    accent: 'from-amber-500 to-orange-400'
  },
  {
    title: 'Critical Alerts',
    value: criticalAlerts,
    detail: '+18.2%',
    icon: '⚠️',
    accent: 'from-rose-500 to-red-400'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('Overview Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeTabData = useMemo(
    () => managementTabs.find((item) => item.label === activeTab) ?? managementTabs[0],
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-5 lg:px-8">
        <TopNavbar onToggleSidebar={() => setSidebarOpen((open) => !open)} />

        <div className="flex flex-1 gap-6">
          <Sidebar
            activeTab={activeTab}
            isOpen={sidebarOpen}
            onTabChange={setActiveTab}
            onCollapse={() => setSidebarOpen((open) => !open)}
          />

          <main className="flex-1 space-y-6">
            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Admin Overview</p>
                    <h1 className="mt-2 text-3xl font-semibold text-slate-900">KisanHub Intelligence</h1>
                    <p className="mt-2 max-w-2xl text-slate-600">A modern decision center for your agricultural operations, powered by rich metrics and operational alerts.</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-emerald-700 shadow-md shadow-emerald-200/60">
                    <p className="text-sm font-medium">AI Summary</p>
                    <p className="mt-2 text-base leading-6">{aiInsight}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {kpis.map((item) => (
                    <KpiCard key={item.title} {...item} />
                  ))}
                </div>
              </div>

              <AlertsPanel alerts={alerts} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <AnalyticsCharts
                lineData={queryTrend}
                categoryData={categoryDistribution}
                regionData={regionQueries}
              />

              <ActionCenter actions={actions} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <ActivityFeed activities={activeTabData.activities} />
              <ManagementTabs activeTab={activeTab} onTabChange={setActiveTab} tabData={activeTabData} />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
