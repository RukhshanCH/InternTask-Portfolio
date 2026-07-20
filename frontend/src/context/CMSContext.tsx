import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ContentType, ContentItem } from '../index';

interface CMSContextType {
  contentTypes: ContentType[];
  refreshContentTypes: () => Promise<void>;
  getContent: (typeName: string) => Promise<ContentItem[]>;
  getContentItem: (typeName: string, id: string) => Promise<ContentItem>;
  createContent: (typeName: string, data: Record<string, unknown>) => Promise<ContentItem>;
  updateContent: (typeName: string, id: string, data: Record<string, unknown>) => Promise<ContentItem>;
  deleteContent: (typeName: string, id: string) => Promise<void>;
  bulkDelete: (typeName: string, ids: string[]) => Promise<void>;
}

const API_BASE: string = (import.meta as any).env?.VITE_BACKEND_URL || 'password' + '/api';

const CMSContext = createContext<CMSContextType | null>(null);

export function CMSProvider({ children }: { children: ReactNode }) {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);

  const refreshContentTypes = useCallback(async () => {
    const res = await fetch(`${API_BASE}/content-types`);
    const data = await res.json();
    setContentTypes(data);
  }, []);

  const getContent = async (typeName: string): Promise<ContentItem[]> => {
    const res = await fetch(`${API_BASE}/content/${typeName}?status=all&sort=createdAt`);
    return res.json();
  };

  const getContentItem = async (typeName: string, id: string): Promise<ContentItem> => {
    const res = await fetch(`${API_BASE}/content/${typeName}/${id}`);
    return res.json();
  };

  const createContent = async (typeName: string, data: Record<string, unknown>): Promise<ContentItem> => {
    const res = await fetch(`${API_BASE}/content/${typeName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const updateContent = async (typeName: string, id: string, data: Record<string, unknown>): Promise<ContentItem> => {
    const res = await fetch(`${API_BASE}/content/${typeName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const deleteContent = async (typeName: string, id: string): Promise<void> => {
    await fetch(`${API_BASE}/content/${typeName}/${id}`, { method: 'DELETE' });
  };

  const bulkDelete = async (typeName: string, ids: string[]): Promise<void> => {
    await fetch(`${API_BASE}/content/${typeName}/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
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