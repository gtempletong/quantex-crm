/**
 * Cliente Supabase simple y centralizado
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Variables de Supabase no configuradas');
}

/**
 * Cliente Supabase para usar en el cliente (browser)
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper para crear cliente en server-side (API routes)
 * Usa variables de entorno del servidor
 */
export function getServerSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient(url, key);
}

