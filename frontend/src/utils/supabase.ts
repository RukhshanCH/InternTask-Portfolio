// ============================================
// supabase.ts — Supabase Client & Data Service
// Replace all fetch('/api/...') calls with these functions
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ─── TYPES (match your React component props) ───

export interface Theme {
  id: string;
  name: string;
  is_active: boolean;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_surface: string;
  color_text: string;
  color_text_muted: string;
  color_success: string;
  color_warning: string;
  color_danger: string;
  color_featured: string;
  font_family: string;
  border_radius: string;
  max_width: string;
  card_style: string;
  button_style: string;
  enable_animations: boolean;
  dark_mode: boolean;
}

export interface Hero {
  id: string;
  is_active: boolean;
  greeting: string;
  name: string;
  headline: string;
  subheadline: string;
  description: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  background_image_url: string;
  social_links: { platform: string; url: string }[];
}

export interface About {
  id: string;
  is_active: boolean;
  title: string;
  content: string;
  short_bio: string;
  image_url: string;
  resume_url: string;
  details: { label: string; value: string }[];
}

export interface Skill {
  id: string;
  is_active: boolean;
  name: string;
  category: string;
  proficiency: number;
  icon: string;
  color: string;
  display_order: number;
}

export interface Project {
  id: string;
  is_active: boolean;
  is_featured: boolean;
  title: string;
  slug: string;
  description: string;
  long_description: string;
  thumbnail_url: string;
  gallery: string[];
  live_url: string;
  repo_url: string;
  tech_stack: string[];
  start_date: string;
  end_date: string;
  status: 'in_progress' | 'completed' | 'archived' | 'planned';
  display_order: number;
}

export interface Contact {
  id: string;
  is_active: boolean;
  email: string;
  phone: string;
  location: string;
  whatsapp_number: string;
  whatsapp_default_message: string;
  social_links: { platform: string; url: string }[];
  form_enabled: boolean;
  form_success_message: string;
}

export interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  favicon_url: string;
  og_image_url: string;
  nav_order: string[];
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── THEME ───

export async function getActiveTheme(): Promise<Theme | null> {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching active theme:', error);
    return null;
  }
  return data;
}

export async function getAllThemes(): Promise<Theme[]> {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching themes:', error);
    return [];
  }
  return data || [];
}

export async function setActiveTheme(themeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('themes')
    .update({ is_active: true })
    .eq('id', themeId);

  if (error) {
    console.error('Error setting active theme:', error);
    return false;
  }
  return true;
}

// ─── HERO ───

export async function getHero(): Promise<Hero | null> {
  const { data, error } = await supabase
    .from('hero')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching hero:', error);
    return null;
  }
  return data;
}

// ─── ABOUT ───

export async function getAbout(): Promise<About | null> {
  const { data, error } = await supabase
    .from('about')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching about:', error);
    return null;
  }
  return data;
}

// ─── SKILLS ───

export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
  return data || [];
}

export async function getSkillsByCategory(): Promise<Record<string, Skill[]>> {
  const skills = await getSkills();
  return skills.reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);
}

// ─── PROJECTS ───

export async function getProjects(options?: { 
  featuredOnly?: boolean; 
  limit?: number;
}): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (options?.featuredOnly) {
    query = query.eq('is_featured', true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data || [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching project by slug:', error);
    return null;
  }
  return data;
}

// ─── CONTACT ───

export async function getContact(): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contact')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching contact:', error);
    return null;
  }
  return data;
}

export function getWhatsAppLink(number: string, message?: string): string {
  const cleanNumber = number.replace(/\D/g, '');
  const msg = encodeURIComponent(message || '');
  return `https://wa.me/${cleanNumber}${msg ? `?text=${msg}` : ''}`;
}

export async function submitContactForm(
  name: string, 
  email: string, 
  message: string, 
  subject?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('contact_submissions')
    .insert({ name, email, message, subject: subject || null });

  if (error) {
    console.error('Error submitting contact form:', error);
    return false;
  }
  return true;
}

// ─── SITE SETTINGS ───

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
  return data;
}

// ─── ADMIN ───

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
  return data || [];
}

export async function markSubmissionAsRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('contact_submissions')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking submission as read:', error);
    return false;
  }
  return true;
}

// ─── BULK FETCH (for App.tsx initial load) ───

export interface PortfolioData {
  theme: Theme | null;
  hero: Hero | null;
  about: About | null;
  skills: Skill[];
  projects: Project[];
  contact: Contact | null;
  settings: SiteSettings | null;
}

export async function fetchAllPortfolioData(): Promise<PortfolioData> {
  const [
    theme,
    hero,
    about,
    skills,
    projects,
    contact,
    settings,
  ] = await Promise.all([
    getActiveTheme(),
    getHero(),
    getAbout(),
    getSkills(),
    getProjects(),
    getContact(),
    getSiteSettings(),
  ]);

  return { theme, hero, about, skills, projects, contact, settings };
}

// ─── REALTIME SUBSCRIPTION (optional — live updates) ───

export function subscribeToTable(
  table: string, 
  callback: (payload: any) => void
) {
  return supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();
}