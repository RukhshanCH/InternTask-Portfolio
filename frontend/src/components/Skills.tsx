import { useEffect, useState } from 'react';
import type { ContentItem } from '../index';

const API_URL = 'http://localhost:3001/api/content/skill?status=published&sort=order';

export default function Skills() {
  const [skills, setSkills] = useState<ContentItem[]>([]);

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((data: ContentItem[]) => setSkills(data))
      .catch(() => setSkills([]));
  }, []);

  return (
    <section id="skills" className="skills section">
      <div className="container">
        <h2 className="section-title">Skills & Technologies</h2>
        <div className="skills-grid">
          {skills.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', gridColumn: '1 / -1' }}>
              No skills added yet.
            </p>
          ) : (
            skills.map((skill) => {
              const d = skill.data as Record<string, unknown>;
              const name = String(d.name || d.title || 'Skill');
              const level = String(d.level || 'Intermediate');
              const percentage = Math.min(100, Math.max(0, Number(d.percentage || 75)));

              return (
                <div key={skill._id} className="skill-item">
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