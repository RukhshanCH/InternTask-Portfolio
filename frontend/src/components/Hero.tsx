import type { ContentItem } from '../index';

interface HeroButton {
  label: string;
  link: string;
  style: 'primary' | 'secondary';
}

interface HeroProps {
  data?: ContentItem | null;
}

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

export default function Hero({ data: heroProp }: HeroProps) {
  const d = heroProp?.data as Record<string, unknown> | undefined;

  const greeting = String(d?.greeting || 'Hello, I am');
  const title = String(d?.title || 'Alex Developer');
  const subtitle = String(
    d?.subtitle || 'Full-stack developer crafting modern web experiences with React, Node.js, and TypeScript.'
  );
  const buttons = parseButtons(d?.buttons);
  const backgroundImage = d?.backgroundImage
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