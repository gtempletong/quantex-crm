/**
 * Cliente Supabase simple y centralizado
 * Usa SUPABASE_URL y SUPABASE_KEY (nombres consistentes con Vercel)
 */

import { createClient } from '@supabase/supabase-js';

// Server-side (API routes): usar Service Role Key para permitir escrituras con RLS
const SERVER_SUPABASE_URL = process.env.SUPABASE_URL || '';
// Prefer SUPABASE_SERVICE_KEY, but support legacy name SUPABASE_KEY
const SERVER_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

if (!SERVER_SUPABASE_URL || !SERVER_SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de Supabase (server) NO configuradas');
  console.error(`SUPABASE_URL: ${SERVER_SUPABASE_URL ? '✅' : '❌'}`);
  console.error(`SERVICE/KEY: ${SERVER_SUPABASE_SERVICE_KEY ? '✅' : '❌'} (SUPABASE_SERVICE_KEY | SUPABASE_KEY)`);
}

/**
 * Helper para crear cliente en server-side (API routes)
 */
export function getServerSupabase() {
  return createClient(SERVER_SUPABASE_URL, SERVER_SUPABASE_SERVICE_KEY);
}

// Client-side factory to avoid evaluating at import time on server
export function getClientSupabase() {
  const CLIENT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const CLIENT_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(CLIENT_SUPABASE_URL, CLIENT_SUPABASE_ANON_KEY);
}

