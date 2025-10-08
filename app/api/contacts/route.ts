/**
 * API Route: /api/contacts
 * Maneja operaciones CRUD de contactos
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

/**
 * GET /api/contacts
 * Obtiene lista de contactos con filtros opcionales
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const estado = searchParams.get('estado') || '';
    const emailSent = searchParams.get('emailSent') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Debug: verificar variables de entorno
    console.log('Environment check:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_KEY,
      urlStart: process.env.SUPABASE_URL?.substring(0, 20) + '...'
    });

    const supabase = getServerSupabase();

    // Construir query
    let query = supabase
      .from('personas')
      .select(`
        id,
        nombre_contacto,
        email_contacto,
        cargo_contacto,
        celular_contacto,
        telefono_contacto,
        rut_empresa,
        email_sent,
        email_sent_at,
        estado,
        tipo_empresa,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Aplicar filtros
    if (search) {
      query = query.or(`nombre_contacto.ilike.%${search}%,email_contacto.ilike.%${search}%`);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (emailSent === 'true') {
      query = query.eq('email_sent', true);
    } else if (emailSent === 'false') {
      query = query.eq('email_sent', false);
    }

    const { data, error } = await query;

    console.log('Query result:', { 
      dataLength: data?.length || 0, 
      error: error?.message || 'none',
      firstContact: data?.[0]?.nombre_contacto || 'none'
    });

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Error al obtener contactos', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      contacts: data || [],
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

