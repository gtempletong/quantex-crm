/**
 * Cliente Supabase simple y centralizado
 * Usa las mismas variables que el resto del proyecto Quantex
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Variables de Supabase no configuradas: SUPABASE_URL y SUPABASE_SERVICE_KEY');
}

/**
 * Helper para crear cliente en server-side (API routes)
 */
export function getServerSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Cliente Supabase para usar en el cliente (browser)
 * Nota: En Next.js 13+ con App Router, prefiere usar getServerSupabase en Server Components
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

