import type { ContentItem } from '../index';

// ─── TYPES ───

// Supabase flat schema (snake_case)
export interface SupabaseSkill {
  id: string;
  name?: string;
  title?: string;
  level?: string;
  percentage?: number;
  category?: string;
  icon?: string;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
  [key: string]: unknown;
}

interface SkillsProps {
  items?: (ContentItem | SupabaseSkill | null)[];
}

// ─── HELPER: Normalize skill data ───
function normalizeSkillData(item: ContentItem | SupabaseSkill | null): Record<string, unknown> | null {
  if (!item) return null;

  // If it has a `data` property → legacy ContentItem wrapper
  if ('data' in item && item.data && typeof item.data === 'object') {
    return item.data as Record<string, unknown>;
  }

  // Otherwise → flat Supabase object
  return item as Record<string, unknown>;
}

// ─── COMPONENT ───

export default function Skills({ items = [] }: SkillsProps) {
  // Normalize all items to flat data objects
  const normalizedItems = items
    .map(normalizeSkillData)
    .filter((d): d is Record<string, unknown> => d !== null);

  return (
    <section id="skills" className="skills section">
      <div className="container">
        <h2 className="section-title">Skills & Technologies</h2>
        <div className="skills-grid">
          {normalizedItems.length === 0 ? (
            <p className="empty-state" style={{ gridColumn: '1 / -1' }}>
              No skills added yet.
            </p>
          ) : (
            normalizedItems.map((d, index) => {
              const id = String(d.id || index);
              // Support both `name` (Supabase) and `title` (legacy)
              const name = String(d.name || d.title || 'Skill');
              const level = String(d.level || 'Intermediate');
              const percentage = Math.min(100, Math.max(0, Number(d.percentage || d.level || 75)));

              return (
                <div key={id} className="skill-item">
                  <div className="skill-header">
                    <span className="skill-name">{name}</span>
                    <span className="skill-level">{level}</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}