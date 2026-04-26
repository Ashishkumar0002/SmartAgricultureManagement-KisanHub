export const totalFarmers = 8_421;
export const activeExperts = 142;
export const totalQueries = 18_274;
export const pendingQueries = 324;
export const criticalAlerts = 12;

export const aiInsight = 'High irrigation queries due to heatwave are trending in the northern regions. Recommend proactively sharing water-saving advisories.';

export const queryTrend = [
  { label: 'Mon', queries: 182 },
  { label: 'Tue', queries: 205 },
  { label: 'Wed', queries: 234 },
  { label: 'Thu', queries: 198 },
  { label: 'Fri', queries: 265 },
  { label: 'Sat', queries: 292 },
  { label: 'Sun', queries: 318 }
];

export const categoryDistribution = [
  { name: 'Soil', value: 38 },
  { name: 'Pest', value: 24 },
  { name: 'Weather', value: 21 },
  { name: 'Irrigation', value: 17 }
];

export const regionQueries = [
  { region: 'North', queries: 365 },
  { region: 'West', queries: 278 },
  { region: 'East', queries: 209 },
  { region: 'South', queries: 198 },
  { region: 'Central', queries: 154 }
];

export const alerts = [
  {
    title: 'High number of pending queries',
    description: '324 queries are waiting more than 8 hours.',
    level: 'critical'
  },
  {
    title: 'Pest-related query spike',
    description: 'Pest alerts rose 34% in the last 24h.',
    level: 'warning'
  },
  {
    title: 'Expert response time stable',
    description: 'Average response time is 1.2h, within target.',
    level: 'normal'
  }
];

export const actions = [
  { label: 'Add Expert', style: 'bg-emerald-600 text-white' },
  { label: 'Assign Queries', style: 'bg-slate-900 text-white' },
  { label: 'Send Announcement', style: 'bg-amber-500 text-slate-900' },
  { label: 'Export Reports', style: 'bg-sky-500 text-white' }
];

export type ActivityItem = {
  label: string;
  sublabel: string;
  time: string;
  category: 'success' | 'info' | 'warning';
};

export const activityFeed: ActivityItem[] = [
  { label: 'New farmer registered', sublabel: 'Ramesh Kumar from Punjab', time: '11m ago', category: 'success' },
  { label: 'Query submitted', sublabel: 'Weather risk for wheat crop', time: '32m ago', category: 'info' },
  { label: 'Expert responded', sublabel: 'Advice on pest control', time: '1h ago', category: 'success' },
  { label: 'New content approved', sublabel: 'Crop rotation guide', time: '2h ago', category: 'info' }
];

export const managementTabs = [
  {
    label: 'Overview Dashboard',
    subtitle: 'Quick insights and operations',
    searchPlaceholder: 'Search overview...',
    columns: ['Metric', 'Value', 'Status'],
    rows: [
      { metric: 'Farmer growth', value: '8.4%', status: 'Healthy' },
      { metric: 'Expert uptime', value: '99.1%', status: 'Stable' },
      { metric: 'Query response', value: '1.2h', status: 'On-track' }
    ],
    activities: activityFeed
  },
  {
    label: 'User Management',
    subtitle: 'Review farmer and expert accounts',
    searchPlaceholder: 'Search users...',
    columns: ['Name', 'Role', 'Region', 'Status'],
    rows: [
      { Name: 'Seema Patel', Role: 'Expert', Region: 'Rajasthan', Status: 'Active' },
      { Name: 'Amit Yadav', Role: 'Farmer', Region: 'Madhya Pradesh', Status: 'Pending' },
      { Name: 'Sunita R.', Role: 'Farmer', Region: 'Uttar Pradesh', Status: 'Active' },
      { Name: 'Dr. Nidhi', Role: 'Expert', Region: 'Karnataka', Status: 'Active' }
    ],
    activities: [
      ...activityFeed,
      { label: 'New expert approved', sublabel: 'Dr. Nidhi from Karnataka', time: '3h ago', category: 'success' }
    ]
  },
  {
    label: 'Content Management',
    subtitle: 'Manage knowledge articles and guides',
    searchPlaceholder: 'Search content...',
    columns: ['Title', 'Type', 'Author', 'Status'],
    rows: [
      { Title: 'Soil health checklist', Type: 'Article', Author: 'KisanHub', Status: 'Live' },
      { Title: 'Pest control webinar', Type: 'Video', Author: 'Dr. Meera', Status: 'Draft' },
      { Title: 'Monsoon planning', Type: 'Guide', Author: 'Team', Status: 'Review' }
    ],
    activities: activityFeed
  },
  {
    label: 'Equipment',
    subtitle: 'Track agricultural equipment requests',
    searchPlaceholder: 'Search equipment...',
    columns: ['Machine', 'Region', 'Status', 'Availability'],
    rows: [
      { Machine: 'Tractor', Region: 'Punjab', Status: 'Booked', Availability: '2d' },
      { Machine: 'Sprayer', Region: 'Gujarat', Status: 'Available', Availability: 'Now' },
      { Machine: 'Seeder', Region: 'Bihar', Status: 'Maintenance', Availability: '5d' }
    ],
    activities: activityFeed
  },
  {
    label: 'Employment',
    subtitle: 'Open job postings and hiring status',
    searchPlaceholder: 'Search jobs...',
    columns: ['Role', 'Region', 'Positions', 'Status'],
    rows: [
      { Role: 'Field Advisor', Region: 'Odisha', Positions: '6', Status: 'Open' },
      { Role: 'Soil Analyst', Region: 'Haryana', Positions: '2', Status: 'Closed' },
      { Role: 'Agri Trainer', Region: 'Maharashtra', Positions: '3', Status: 'Interviewing' }
    ],
    activities: activityFeed
  },
  {
    label: 'Analytics',
    subtitle: 'Deep dive metrics and adoption',
    searchPlaceholder: 'Search analytics...',
    columns: ['Segment', 'Change', 'Insight'],
    rows: [
      { Segment: 'Irrigation', Change: '+18%', Insight: 'Heatwave spike' },
      { Segment: 'Pest', Change: '+24%', Insight: 'Early advisory needed' },
      { Segment: 'Soil', Change: '+9%', Insight: 'Soil test demand rising' }
    ],
    activities: activityFeed
  },
  {
    label: 'Activity Logs',
    subtitle: 'Recent operational updates',
    searchPlaceholder: 'Search logs...',
    columns: ['Event', 'User', 'Time', 'Status'],
    rows: [
      { Event: 'Query assigned', User: 'Admin', Time: '15m ago', Status: 'Complete' },
      { Event: 'New registration', User: 'Farmer', Time: '22m ago', Status: 'Pending' },
      { Event: 'Report exported', User: 'Manager', Time: '45m ago', Status: 'Success' }
    ],
    activities: activityFeed
  }
];

