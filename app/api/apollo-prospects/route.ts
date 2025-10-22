/**
 * API Route: /api/apollo-prospects
 * Obtiene prospects unificados desde apollo_persons (solo calificados)
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const linkedinStatusFilter = searchParams.get('linkedinStatus') || 'all';
    const emailStatusFilter = searchParams.get('emailStatus') || 'all';
    const channelFilter = searchParams.get('channel') || 'all';
    const limit = parseInt(searchParams.get('limit') || '1000');

    const supabase = getServerSupabase();

    // Construir query - solo personas calificadas (ai_classification = 'INCLUIR')
    let query = supabase
      .from('apollo_persons')
      .select(`
        id,
        full_name,
        email,
        phone,
        title,
        linkedin_url,
        company_id,
        company_name,
        seniority,
        linkedin_invite_sent,
        linkedin_invite_sent_at,
        email_sent,
        email_sent_at,
        phantom_status,
        connection_status,
        ai_classification,
        ai_score,
        ai_justification,
        ai_analyzed_at,
        created_at,
        updated_at
      `)
      .eq('ai_classification', 'INCLUIR')  // Solo calificados
      .order('created_at', { ascending: false })
      .limit(limit);

    // Aplicar búsqueda
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Filtro por estado LinkedIn
    if (linkedinStatusFilter === 'invite_sent') {
      query = query.eq('linkedin_invite_sent', true);
    } else if (linkedinStatusFilter === 'not_sent') {
      query = query.eq('linkedin_invite_sent', false);
    } else if (linkedinStatusFilter === 'connected') {
      query = query.eq('connection_status', 'conectado');
    }

    // Filtro por estado Email
    if (emailStatusFilter === 'sent') {
      query = query.eq('email_sent', true);
    } else if (emailStatusFilter === 'not_sent') {
      query = query.eq('email_sent', false);
    }

    // Filtro por canal disponible
    if (channelFilter === 'has_email') {
      query = query.not('email', 'is', null);
    } else if (channelFilter === 'has_phone') {
      query = query.not('phone', 'is', null);
    } else if (channelFilter === 'has_linkedin') {
      query = query.not('linkedin_url', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching apollo prospects:', error);
      return NextResponse.json(
        { error: 'Error al obtener prospects de Apollo', details: error.message },
        { status: 500 }
      );
    }

    // Estadísticas simplificadas
    const stats = {
      total: data?.length || 0,
    };

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      prospects: data || [],
      stats,
    });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
