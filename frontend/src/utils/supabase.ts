// ============================================
// supabase.ts — Multi-Tenant Portfolio Service (FIXED)
// Each invited user manages their own portfolio
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ─── TYPES ───

export interface Portfolio {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  owner_id: string;
  is_published: boolean;
  is_active: boolean;
  custom_domain: string | null;
  created_at: string;
}

export interface PortfolioMember {
  id: string;
  portfolio_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: string | null;
  invited_at: string;
}

export interface PortfolioMemberWithUser extends PortfolioMember {
  user_email?: string;
  user_name?: string;
}

export interface Invitation {
  id: string;
  email: string;
  portfolio_id: string;
  token: string;
  invited_by: string;
  expires_at: string;
  is_accepted: boolean;
  accepted_at: string | null;
  created_at: string;
}

export interface Theme {
  id: string;
  portfolio_id: string;
  name: string;
  slug?: string;
  is_active: boolean;
  is_featured?: boolean;
  order_index?: number;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_accent_soft: string;
  color_accent_bg: string;
  color_dark: string;
  color_light: string;
  color_gray: string;
  color_gray_warm: string;
  color_text: string;
  color_text_muted: string;
  color_success: string;
  color_warning: string;
  color_danger: string;
  color_featured: string;
  font_family: string;
  border_radius: number | string;
  max_width: number | string;
  gradient_direction: string;
  card_style: string;
  button_style: string;
  enable_animations: boolean;
  dark_mode: boolean;
}

export interface Hero {
  id: string;
  portfolio_id: string;
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
  portfolio_id: string;
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
  portfolio_id: string;
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
  portfolio_id: string;
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
  portfolio_id: string;
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
  portfolio_id: string;
  site_title: string;
  site_description: string;
  favicon_url: string;
  og_image_url: string;
  nav_order: string[];
}

export interface ContactSubmission {
  id: string;
  portfolio_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PortfolioData {
  portfolio: Portfolio | null;
  theme: Theme | null;
  hero: Hero | null;
  about: About | null;
  skills: Skill[];
  projects: Project[];
  contact: Contact | null;
  settings: SiteSettings | null;
}

// ─── AUTH ───

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── PROFILES (replaces direct auth.users queries) ───

export async function getProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  return data || [];
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

// ─── PORTFOLIOS ───

export async function getMyPortfolios(): Promise<Portfolio[]> {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
  return data || [];
}

export async function getPortfolioBySlug(slug: string): Promise<Portfolio | null> {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching portfolio:', error);
    return null;
  }
  return data;
}

export async function createPortfolio(title: string, slug: string, description?: string): Promise<Portfolio | null> {
  const cleanSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!cleanSlug) {
    console.error('Invalid slug');
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const { data, error } = await supabase
    .from('portfolios')
    .insert({ title, slug: cleanSlug, description })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating portfolio:', error);
    return null;
  }

  // FIX: Add creator as owner in portfolio_members (required for multi-tenant RLS)
  const { error: memberError } = await supabase
    .from('portfolio_members')
    .insert({
      portfolio_id: data.id,
      user_id: user.id,
      role: 'owner',
      invited_by: null,
    });

  if (memberError) {
    console.error('Error adding owner to portfolio_members:', memberError);
  }

  return data;
}

export async function updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<boolean> {
  const { error } = await supabase
    .from('portfolios')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating portfolio:', error);
    return false;
  }
  return true;
}

export async function deletePortfolio(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting portfolio:', error);
    return false;
  }
  return true;
}

// ─── INVITATIONS ───

export async function inviteUser(email: string, portfolioId: string): Promise<Invitation | null> {
  const user = await getCurrentUser();
  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      email,
      portfolio_id: portfolioId,
      invited_by: user.id,        // ← REQUIRED for RLS
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invitation:', JSON.stringify(error, null, 2)); // ← better logging
    return null;
  }
  return data;
}

export async function getMyInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*, portfolios(title, slug)')
    .eq('is_accepted', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
  return data || [];
}

// NEW: Fetch invitations with inviter profile info (uses profiles table, not auth.users)
export async function getInvitationsWithInviter(): Promise<(Invitation & { inviter_email?: string; inviter_name?: string })[]> {
  const invitations = await getMyInvitations();
  if (invitations.length === 0) return invitations;

  const inviterIds = [...new Set(invitations.map(i => i.invited_by).filter(Boolean))] as string[];
  const profiles = await getProfiles(inviterIds);
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return invitations.map(inv => ({
    ...inv,
    inviter_email: profileMap.get(inv.invited_by)?.email,
    inviter_name: profileMap.get(inv.invited_by)?.full_name,
  }));
}

export async function getPortfolioInvitations(portfolioId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching portfolio invitations:', error);
    return [];
  }
  return data || [];
}

export async function acceptInvitation(token: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('accept_invitation', { invite_token: token });

  if (error) {
    console.error('Error accepting invitation:', error);
    return false;
  }
  return data || false;
}

// ─── PORTFOLIO MEMBERS (FIXED — uses profiles table, not auth.users) ───

export async function getPortfolioMembers(portfolioId: string): Promise<PortfolioMember[]> {
  const { data: members, error } = await supabase
    .from('portfolio_members')
    .select('*')
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  return members || [];
}

// FIXED: Fetches emails from public.profiles instead of auth.users
export async function getPortfolioMembersWithEmails(portfolioId: string): Promise<PortfolioMemberWithUser[]> {
  const { data: members, error: membersError } = await supabase
    .from('portfolio_members')
    .select('*')
    .eq('portfolio_id', portfolioId);

  if (membersError || !members) {
    console.error('Error fetching members:', membersError);
    return [];
  }

  if (members.length === 0) return [];

  const userIds = [...new Set(members.map(m => m.user_id).filter(Boolean))] as string[];
  const profiles = await getProfiles(userIds);
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return members.map(m => ({
    ...m,
    user_email: profileMap.get(m.user_id)?.email,
    user_name: profileMap.get(m.user_id)?.full_name,
  }));
}

export async function removeMember(portfolioId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('portfolio_members')
    .delete()
    .eq('portfolio_id', portfolioId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing member:', error);
    return false;
  }
  return true;
}

// ─── THEMES ───

export async function getActiveTheme(portfolioId: string): Promise<Theme | null> {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching active theme:', error);
    return null;
  }
  return data;
}

export async function getAllThemes(portfolioId: string): Promise<Theme[]> {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching themes:', error);
    return [];
  }
  return data || [];
}

export async function setActiveTheme(portfolioId: string, themeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('themes')
    .update({ is_active: true })
    .eq('id', themeId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error setting active theme:', error);
    return false;
  }
  return true;
}

export async function createTheme(portfolioId: string, theme: Partial<Theme>): Promise<Theme | null> {
  const themeData = {
    ...theme,
    portfolio_id: portfolioId,
    slug: theme.slug || theme.name?.toLowerCase().replace(/\s+/g, '-') || 'custom-theme'
  };
  const { data, error } = await supabase
    .from('themes')
    .insert(themeData)
    .select()
    .single();

  if (error) {
    console.error('Error creating theme:', error);
    return null;
  }
  return data;
}

export async function updateTheme(portfolioId: string, themeId: string, updates: Partial<Theme>): Promise<boolean> {
  const { error } = await supabase
    .from('themes')
    .update(updates)
    .eq('id', themeId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error updating theme:', error);
    return false;
  }
  return true;
}

// ─── HERO ───

export async function getHero(portfolioId: string): Promise<Hero | null> {
  const { data, error } = await supabase
    .from('hero')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching hero:', error);
    return null;
  }
  return data;
}

export async function updateHero(portfolioId: string, heroId: string, updates: Partial<Hero>): Promise<boolean> {
  const { error } = await supabase
    .from('hero')
    .update(updates)
    .eq('id', heroId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error updating hero:', error);
    return false;
  }
  return true;
}

// ─── ABOUT ───

export async function getAbout(portfolioId: string): Promise<About | null> {
  const { data, error } = await supabase
    .from('about')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching about:', error);
    return null;
  }
  return data;
}

export async function updateAbout(portfolioId: string, aboutId: string, updates: Partial<About>): Promise<boolean> {
  const { error } = await supabase
    .from('about')
    .update(updates)
    .eq('id', aboutId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error updating about:', error);
    return false;
  }
  return true;
}

// ─── SKILLS ───

export async function getSkills(portfolioId: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
  return data || [];
}

export async function createSkill(portfolioId: string, skill: Partial<Skill>): Promise<Skill | null> {
  const { data, error } = await supabase
    .from('skills')
    .insert({ ...skill, portfolio_id: portfolioId })
    .select()
    .single();

  if (error) {
    console.error('Error creating skill:', error);
    return null;
  }
  return data;
}

export async function updateSkill(portfolioId: string, skillId: string, updates: Partial<Skill>): Promise<boolean> {
  const { error } = await supabase
    .from('skills')
    .update(updates)
    .eq('id', skillId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error updating skill:', error);
    return false;
  }
  return true;
}

export async function deleteSkill(portfolioId: string, skillId: string): Promise<boolean> {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', skillId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error deleting skill:', error);
    return false;
  }
  return true;
}

// ─── PROJECTS ───

export async function getProjects(portfolioId: string, options?: { featuredOnly?: boolean; limit?: number }): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (options?.featuredOnly) query = query.eq('is_featured', true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data || [];
}

export async function getProjectBySlug(portfolioId: string, slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching project by slug:', error);
    return null;
  }
  return data;
}

export async function createProject(portfolioId: string, project: Partial<Project>): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, portfolio_id: portfolioId })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }
  return data;
}

export async function updateProject(portfolioId: string, projectId: string, updates: Partial<Project>): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error updating project:', error);
    return false;
  }
  return true;
}

export async function deleteProject(portfolioId: string, projectId: string): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }
  return true;
}

// ─── CONTACT ───

export async function getContact(portfolioId: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contact')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching contact:', error);
    return null;
  }
  return data;
}

export async function updateContact(portfolioId: string, contactId: string, updates: Partial<Contact>): Promise<boolean> {
  const { error } = await supabase
    .from('contact')
    .update(updates)
    .eq('id', contactId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error updating contact:', error);
    return false;
  }
  return true;
}

export function getWhatsAppLink(number: string, message?: string): string {
  const cleanNumber = number.replace(/\D/g, '');
  const msg = encodeURIComponent(message || '');
  return `https://wa.me/${cleanNumber}${msg ? `?text=${msg}` : ''}`;
}

export async function submitContactForm(
  portfolioId: string,
  name: string,
  email: string,
  message: string,
  subject?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('contact_submissions')
    .insert({ portfolio_id: portfolioId, name, email, message, subject: subject || null });

  if (error) {
    console.error('Error submitting contact form:', error);
    return false;
  }
  return true;
}

// ─── SITE SETTINGS ───

export async function getSiteSettings(portfolioId: string): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .single();

  if (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
  return data;
}

export async function updateSiteSettings(portfolioId: string, settingsId: string, updates: Partial<SiteSettings>): Promise<boolean> {
  const { error } = await supabase
    .from('site_settings')
    .update(updates)
    .eq('id', settingsId)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error updating site settings:', error);
    return false;
  }
  return true;
}

// ─── CONTACT SUBMISSIONS ───

export async function getContactSubmissions(portfolioId: string): Promise<ContactSubmission[]> {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
  return data || [];
}

export async function markSubmissionAsRead(portfolioId: string, id: string): Promise<boolean> {
  const { error } = await supabase
    .from('contact_submissions')
    .update({ is_read: true })
    .eq('id', id)
    .eq('portfolio_id', portfolioId);

  if (error) {
    console.error('Error marking submission as read:', error);
    return false;
  }
  return true;
}

// ─── BULK FETCH (for App.tsx initial load) ───

export async function fetchAllPortfolioData(portfolioId: string): Promise<PortfolioData> {
  const [
    { data: portfolio },
    { data: theme },
    { data: hero },
    { data: about },
    { data: skills },
    { data: projects },
    { data: contact },
    { data: settings },
  ] = await Promise.all([
    supabase.from('portfolios').select('*').eq('id', portfolioId).single(),
    supabase.from('themes').select('*').eq('portfolio_id', portfolioId).eq('is_active', true).single(),
    supabase.from('hero').select('*').eq('portfolio_id', portfolioId).eq('is_active', true).single(),
    supabase.from('about').select('*').eq('portfolio_id', portfolioId).eq('is_active', true).single(),
    supabase.from('skills').select('*').eq('portfolio_id', portfolioId).eq('is_active', true).order('display_order'),
    supabase.from('projects').select('*').eq('portfolio_id', portfolioId).eq('is_active', true).order('display_order'),
    supabase.from('contact').select('*').eq('portfolio_id', portfolioId).eq('is_active', true).single(),
    supabase.from('site_settings').select('*').eq('portfolio_id', portfolioId).single(),
  ]);

  return {
    portfolio,
    theme,
    hero,
    about,
    skills: skills || [],
    projects: projects || [],
    contact,
    settings,
  };
}

// ─── REALTIME SUBSCRIPTIONS ───

export function subscribeToPortfolioTable(
  portfolioId: string,
  table: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`${table}-${portfolioId}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `portfolio_id=eq.${portfolioId}`
      },
      callback
    )
    .subscribe();
}

// ─── PUBLIC READ (No auth required) ───

export async function getPublicPortfolio(slug: string): Promise<PortfolioData | null> {
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!portfolio) return null;

  return fetchAllPortfolioData(portfolio.id);
}