/**
 * API Route: /api/linkedin-leads
 * Obtiene prospects de LinkedIn desde Supabase
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const phantomFilter = searchParams.get('phantomFilter') || 'all';
    const connectionFilter = searchParams.get('connectionFilter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '1000');

    const supabase = getServerSupabase();

    // Construir query
    let query = supabase
      .from('linkedin_leads')
      .select(`
        id,
        full_name,
        company_name,
        title,
        industry,
        location,
        ai_classification,
        ai_score,
        ai_justification,
        linkedin_profile_url,
        airtable_synced,
        airtable_synced_at,
        phantom_status,
        connection_status,
        prospect_stage,
        dm_sent_at,
        connection_accepted_at,
        last_activity_at,
        created_at
      `)
      .order('last_activity_at', { ascending: false })
      .limit(limit);

    // Aplicar filtros
    if (filter !== 'all') {
      query = query.eq('ai_classification', filter);
    }
    if (phantomFilter !== 'all') {
      query = query.eq('phantom_status', phantomFilter);
    }
    if (connectionFilter !== 'all') {
      query = query.eq('connection_status', connectionFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching LinkedIn leads:', error);
      return NextResponse.json(
        { error: 'Error al obtener prospects de LinkedIn', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      leads: data || [],
    });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error inesperado', details: message },
      { status: 500 }
    );
  }
}
