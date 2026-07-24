import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string;
  tags: string[];
  github_url: string;
  live_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  
  return data || [];
};

// Admin-only operations
export const createProject = async (project: Omit<Project, 'id' | 'created_at'>): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
};