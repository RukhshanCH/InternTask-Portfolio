import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../utils/supabase';

// ─── TYPES ───

export interface ContentType {
  id: string;
  name: string;
  label: string;
  icon: string;
  tableName: string;
  isSingle: boolean;
}

export interface ContentItem {
  id: string;
  [key: string]: unknown;
}

interface CMSContextType {
  contentTypes: ContentType[];
  refreshContentTypes: () => void;
  getContent: (tableName: string) => Promise<ContentItem[]>;
  getContentItem: (tableName: string, id: string) => Promise<ContentItem | null>;
  createContent: (tableName: string, data: Record<string, unknown>) => Promise<ContentItem | null>;
  updateContent: (tableName: string, id: string, data: Record<string, unknown>) => Promise<ContentItem | null>;
  deleteContent: (tableName: string, id: string) => Promise<void>;
  bulkDelete: (tableName: string, ids: string[]) => Promise<void>;
}

// ─── STATIC TABLE CONFIG (replaces API-driven content types) ───

const DEFAULT_CONTENT_TYPES: ContentType[] = [
  { id: '1', name: 'project', label: 'Projects', icon: '🚀', tableName: 'projects', isSingle: false },
  { id: '2', name: 'hero', label: 'Hero', icon: '📄', tableName: 'hero', isSingle: true },
  { id: '3', name: 'about', label: 'About', icon: '👨‍💻', tableName: 'about', isSingle: true },
  { id: '4', name: 'skill', label: 'Skills', icon: '⭐', tableName: 'skills', isSingle: false },
  { id: '5', name: 'contact', label: 'Contact', icon: '📧', tableName: 'contact', isSingle: true },
  { id: '6', name: 'theme', label: 'Themes', icon: '🎨', tableName: 'themes', isSingle: false },
];

// ─── CONTEXT ───

const CMSContext = createContext<CMSContextType | null>(null);

export function CMSProvider({ children }: { children: ReactNode }) {
  const [contentTypes] = useState<ContentType[]>(DEFAULT_CONTENT_TYPES);

  // No-op — content types are now static
  const refreshContentTypes = useCallback(() => {
    // Static config, nothing to refresh
  }, []);

  // ─── CRUD via Supabase ───

  const getContent = async (tableName: string): Promise<ContentItem[]> => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error(`getContent(${tableName}) error:`, error);
      return [];
    }
    return data || [];
  };

  const getContentItem = async (tableName: string, id: string): Promise<ContentItem | null> => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`getContentItem(${tableName}, ${id}) error:`, error);
      return null;
    }
    return data;
  };

  const createContent = async (tableName: string, payload: Record<string, unknown>): Promise<ContentItem | null> => {
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(`createContent(${tableName}) error:`, error);
      throw error;
    }
    return data;
  };

  const updateContent = async (tableName: string, id: string, payload: Record<string, unknown>): Promise<ContentItem | null> => {
    // Remove fields that shouldn't be updated
    const cleanPayload = { ...payload };
    delete cleanPayload.id;
    delete cleanPayload.created_at;

    const { data, error } = await supabase
      .from(tableName)
      .update(cleanPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`updateContent(${tableName}, ${id}) error:`, error);
      throw error;
    }
    return data;
  };

  const deleteContent = async (tableName: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`deleteContent(${tableName}, ${id}) error:`, error);
      throw error;
    }
  };

  const bulkDelete = async (tableName: string, ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .in('id', ids);

    if (error) {
      console.error(`bulkDelete(${tableName}) error:`, error);
      throw error;
    }
  };

  return (
    <CMSContext.Provider value={{
      contentTypes,
      refreshContentTypes,
      getContent,
      getContentItem,
      createContent,
      updateContent,
      deleteContent,
      bulkDelete,
    }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const ctx = useContext(CMSContext);
  if (!ctx) throw new Error('useCMS must be inside CMSProvider');
  return ctx;
}