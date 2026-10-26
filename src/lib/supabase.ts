import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let activeUrl: string | null = null;
let activeKey: string | null = null;

export interface SupabaseConfigInfo {
  url: string;
  key: string;
  source: 'env' | 'custom' | null;
  isConfigured: boolean;
}

export function getSupabaseCredentials(): SupabaseConfigInfo {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (envUrl && envKey) {
    return {
      url: envUrl,
      key: envKey,
      source: 'env',
      isConfigured: true,
    };
  }

  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('tj_supabase_url')?.trim();
    const customKey = localStorage.getItem('tj_supabase_anon_key')?.trim();
    if (customUrl && customKey) {
      return {
        url: customUrl,
        key: customKey,
        source: 'custom',
        isConfigured: true,
      };
    }
  }

  return {
    url: '',
    key: '',
    source: null,
    isConfigured: false,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().isConfigured;
}

export function getSupabase(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (!creds.isConfigured) {
    supabaseInstance = null;
    activeUrl = null;
    activeKey = null;
    return null;
  }

  if (!supabaseInstance || activeUrl !== creds.url || activeKey !== creds.key) {
    activeUrl = creds.url;
    activeKey = creds.key;
    supabaseInstance = createClient(creds.url, creds.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseInstance;
}

export function setCustomSupabaseCredentials(url: string, key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tj_supabase_url', url.trim());
  localStorage.setItem('tj_supabase_anon_key', key.trim());
  // reset instance so next getSupabase uses the new credentials
  supabaseInstance = null;
  activeUrl = null;
  activeKey = null;
}

export function clearCustomSupabaseCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tj_supabase_url');
  localStorage.removeItem('tj_supabase_anon_key');
  supabaseInstance = null;
  activeUrl = null;
  activeKey = null;
}

export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = testUrl?.trim() || getSupabaseCredentials().url;
    const key = testKey?.trim() || getSupabaseCredentials().key;

    if (!url || !key) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }

    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Test query on app_state or trades table
    const { error } = await testClient.from('trades').select('id').limit(1);

    if (error) {
      return {
        success: false,
        message: `Connected to Supabase, but query failed: ${error.message}. (Did you run supabase-schema.sql in SQL Editor?)`,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect to Supabase.',
    };
  }
}
