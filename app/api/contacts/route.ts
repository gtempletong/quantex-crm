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
    const regionParam = searchParams.get('region') || '';

    // Debug: verificar variables de entorno
    console.log('Environment check:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_KEY,
      urlStart: process.env.SUPABASE_URL?.substring(0, 20) + '...'
    });

    const supabase = getServerSupabase();

    // Construir query - sin created_at que no existe
    // Consulta base solo a personas (sin join) para evitar filtros vaciando resultados
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
        tipo_empresa
      `)
      .order('id', { ascending: false })
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

    // Enriquecer con empresas en una segunda consulta por RUT
    const rutList = Array.from(new Set((data || []).map((r: any) => r.rut_empresa).filter(Boolean)));
    let companyMap: Record<string, { razon_social: string | null; region: number | null }> = {};
    if (rutList.length > 0) {
      const { data: companies, error: compErr } = await supabase
        .from('empresas')
        .select('rut_empresa, razon_social, region')
        .in('rut_empresa', rutList);
      if (!compErr && companies) {
        for (const c of companies) {
          const rawRegion = (c as any).region;
          const regionNum = rawRegion === null || rawRegion === undefined ? null : Number(rawRegion);
          companyMap[c.rut_empresa] = { razon_social: c.razon_social, region: Number.isNaN(regionNum as number) ? null : regionNum };
        }
      }
    }

    const REGION_MAP: Record<number, string> = { 13: 'Región Metropolitana' };

    let contacts = (data || []).map((row: any) => {
      const comp = companyMap[row.rut_empresa] || { razon_social: null, region: null };
      const regionNumber = comp.region ?? null;
      return {
        id: row.id,
        nombre_contacto: row.nombre_contacto,
        email_contacto: row.email_contacto,
        cargo_contacto: row.cargo_contacto,
        celular_contacto: row.celular_contacto,
        telefono_contacto: row.telefono_contacto,
        rut_empresa: row.rut_empresa,
        razon_social: comp.razon_social,
        region_number: regionNumber,
        region_label: regionNumber ? (REGION_MAP[regionNumber as number] || null) : null,
        email_sent: row.email_sent,
        email_sent_at: row.email_sent_at,
        estado: row.estado,
        tipo_empresa: row.tipo_empresa,
      };
    });

    // Filtro por región si se envía ?region=13
    if (regionParam) {
      const regionNumber = parseInt(regionParam, 10);
      if (!Number.isNaN(regionNumber)) {
        contacts = contacts.filter((c: any) => Number(c.region_number) === regionNumber);
      }
    }

    console.log('Contacts API filters:', { regionParam, afterFilterCount: contacts.length });

    return NextResponse.json({ success: true, count: contacts.length, contacts });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error inesperado', details: message },
      { status: 500 }
    );
  }
}

