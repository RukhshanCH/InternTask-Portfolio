import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

// ─── TYPES ───

interface TableStat {
  name: string;
  label: string;
  icon: string;
  color: string;
  count: number;
  activeCount: number;
}

interface RecentItem {
  id: string;
  title: string;
  table: string;
  tableLabel: string;
  isActive: boolean;
  updatedAt: string;
}

// ─── TABLE CONFIG ───

const TABLES = [
  { name: 'projects', label: 'Projects', icon: '🚀', color: '#3b82f6' },
  { name: 'hero', label: 'Hero', icon: '📄', color: '#8b5cf6' },
  { name: 'about', label: 'About', icon: '👨‍💻', color: '#22c55e' },
  { name: 'skills', label: 'Skills', icon: '⭐', color: '#f59e0b' },
  { name: 'contact', label: 'Contact', icon: '📧', color: '#ef4444' },
  { name: 'themes', label: 'Themes', icon: '🎨', color: '#db2777' },
];

// ─── COMPONENT ───

export default function AdminDashboard() {
  const [stats, setStats] = useState<TableStat[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    const tableStats: TableStat[] = [];
    const allRecent: RecentItem[] = [];

    for (const table of TABLES) {
      try {
        // Get total count
        const { count: totalCount, error: countError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Get active count
        const { count: activeCount, error: activeError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (activeError) throw activeError;

        tableStats.push({
          name: table.name,
          label: table.label,
          icon: table.icon,
          color: table.color,
          count: totalCount || 0,
          activeCount: activeCount || 0,
        });

        // Get recent items (last 2 per table)
        // Different tables have different title fields
        const titleField = table.name === 'skills' ? 'name' : 
                          table.name === 'themes' ? 'name' :
                          table.name === 'contact' ? 'heading' :
                          table.name === 'hero' ? 'title' :
                          table.name === 'about' ? 'heading' : 'title';

        const { data: recentData, error: recentError } = await supabase
          .from(table.name)
          .select(`id, ${titleField}, is_active, updated_at`)
          .order('updated_at', { ascending: false })
          .limit(2);

        if (recentError) throw recentError;

        if (recentData) {
          recentData.forEach((item: Record<string, unknown>) => {
            const title = String(
              item.title || item.name || item.heading || item.slug || 'Untitled'
            );
            allRecent.push({
              id: String(item.id),
              title,
              table: table.name,
              tableLabel: table.label,
              isActive: Boolean(item.is_active),
              updatedAt: String(item.updated_at),
            });
          });
        }
      } catch (err) {
        console.error(`Error loading ${table.name}:`, err);
        tableStats.push({
          name: table.name,
          label: table.label,
          icon: table.icon,
          color: table.color,
          count: 0,
          activeCount: 0,
        });
      }
    }

    // Sort recent by updated_at descending
    allRecent.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    setStats(tableStats);
    setRecentItems(allRecent.slice(0, 6));
    setLoading(false);
  };

  const totalContent = stats.reduce((sum, s) => sum + s.count, 0);
  const totalActive = stats.reduce((sum, s) => sum + s.activeCount, 0);

  const statCards = [
    { label: 'Tables', value: TABLES.length, icon: '🏗️', color: '#3b82f6' },
    { label: 'Total Items', value: totalContent, icon: '📄', color: '#8b5cf6' },
    { label: 'Active', value: totalActive, icon: '✅', color: '#22c55e' },
    { label: 'Inactive', value: totalContent - totalActive, icon: '📝', color: '#f59e0b' },
  ];

  return (
    <div className="cms-dashboard">
      <h1 className="cms-page-title">📊 Dashboard</h1>

      {loading ? (
        <p className="loading-text">Loading stats...</p>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((card) => (
              <div key={card.label} className="stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
                <div className="stat-icon">{card.icon}</div>
                <div className="stat-info">
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label-cms">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-sections">
            {/* Content Types */}
            <div className="dashboard-section">
              <h2>🏗️ Content Tables</h2>
              <div className="content-type-list">
                {stats.map((table) => (
                  <Link
                    key={table.name}
                    to={`/admin/content/${table.name === 'projects' ? 'project' : table.name === 'skills' ? 'skill' : table.name}`}
                    className="content-type-card"
                  >
                    <span className="ct-icon">{table.icon}</span>
                    <div className="ct-info">
                      <div className="ct-name">{table.label}</div>
                      <div className="ct-fields">
                        {table.activeCount} active / {table.count} total
                      </div>
                    </div>
                    <span className="ct-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-section">
              <h2>🕐 Recent Activity</h2>
              {recentItems.length === 0 ? (
                <p className="empty-state-small">No recent activity</p>
              ) : (
                <div className="recent-list">
                  {recentItems.map((item, idx) => (
                    <Link
                      key={`${item.table}-${item.id}-${idx}`}
                      to={`/admin/content/${item.table === 'projects' ? 'project' : item.table === 'skills' ? 'skill' : item.table}`}
                      className="recent-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <span className={`status-dot ${item.isActive ? 'status-published' : 'status-draft'}`} />
                      <div className="recent-info">
                        <div className="recent-title">{item.title}</div>
                        <div className="recent-meta">
                          {item.tableLabel} • {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}