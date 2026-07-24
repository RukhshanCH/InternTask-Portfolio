import type { ContentItem } from '../index';

// ─── TYPES ───

// Supabase flat schema (snake_case)
export interface SupabaseHero {
  id: string;
  greeting?: string;
  title?: string;
  subtitle?: string;
  buttons?: HeroButton[] | string[];
  background_image?: string;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
  [key: string]: unknown;
}

interface HeroButton {
  label: string;
  link: string;
  style: 'primary' | 'secondary';
}

interface HeroProps {
  data?: ContentItem | SupabaseHero | null;
}

// ─── HELPER: Normalize hero data ───
function normalizeHeroData(item: ContentItem | SupabaseHero | null | undefined): Record<string, unknown> | null {
  if (!item) return null;

  // If it has a `data` property → legacy ContentItem wrapper
  if ('data' in item && item.data && typeof item.data === 'object') {
    return item.data as Record<string, unknown>;
  }

  // Otherwise → flat Supabase object
  return item as Record<string, unknown>;
}

// ─── HELPER: Parse buttons ───
function parseButtons(buttonsData: unknown): HeroButton[] {
  if (Array.isArray(buttonsData) && buttonsData.length > 0 && typeof buttonsData[0] !== 'string') {
    return buttonsData as HeroButton[];
  }

  if (Array.isArray(buttonsData)) {
    return buttonsData.map((btn: string) => {
      const parts = btn.split('|').map((s) => s.trim());
      return {
        label: parts[0] || 'Button',
        link: parts[1] || '#',
        style: (parts[2] as 'primary' | 'secondary') || 'primary',
      };
    });
  }

  return [
    { label: 'View My Work', link: '#projects', style: 'primary' },
    { label: 'Contact Me', link: '#contact', style: 'secondary' },
  ];
}

// ─── COMPONENT ───

export default function Hero({ data: heroProp }: HeroProps) {
  const d = normalizeHeroData(heroProp);

  const greeting = String(d?.greeting || 'Hello, I am');
  const title = String(d?.title || 'Alex Developer');
  const subtitle = String(
    d?.subtitle || 'Full-stack developer crafting modern web experiences with React, Node.js, and TypeScript.'
  );
  const buttons = parseButtons(d?.buttons);

  // Support both snake_case (Supabase) and camelCase (legacy)
  const backgroundImage = d?.background_image
    ? String(d.background_image)
    : d?.backgroundImage
      ? String(d.backgroundImage)
      : d?.backgroundimage
        ? String(d.backgroundimage)
        : null;

  return (
    <section
      className="hero"
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {backgroundImage && <div className="hero-banner" />}

      <div className="hero-container">
        <p className="hero-greeting">{greeting}</p>
        <h1 className={`hero-title ${backgroundImage ? 'bg-title' : ''}`}>{title}</h1>
        <p className={`hero-subtitle ${backgroundImage ? 'bg-subtitle' : ''}`}>{subtitle}</p>

        <div className="hero-buttons">
          {buttons.map((btn, i) => (
            <a
              key={i}
              href={btn.link}
              className={
                btn.style === 'primary'
                  ? 'btn btn-primary'
                  : `btn btn-secondary ${backgroundImage ? 'bg-text' : ''}`
              }
            >
              {btn.label}
            </a>
          ))}
        </div>

        <div className="hero-scroll">
          <span />
        </div>
      </div>
    </section>
  );
}