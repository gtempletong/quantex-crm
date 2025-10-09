import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { ActiveContact } from '@/lib/types';

// GET /api/active-contacts - Obtener lista de contactos activos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const region = searchParams.get('region');
    const canReceive = searchParams.get('can_receive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getServerSupabase();

    // Construir query base
    let query = supabase
      .from('active_contacts')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    if (region && region !== 'all') {
      query = query.eq('region', parseInt(region));
    }

    if (canReceive && canReceive !== 'all') {
      query = query.eq('can_receive_communications', canReceive === 'true');
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('Error fetching active contacts:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo contactos activos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contacts as ActiveContact[],
      total: count || 0,
      limit,
      offset
    });

  } catch (error: unknown) {
    console.error('Error in /api/active-contacts GET:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/active-contacts - Crear nuevo contacto activo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      full_name,
      email,
      phone,
      linkedin_url,
      company_name,
      region,
      source,
      notes,
      tags,
      can_receive_communications = true
    } = body;

    // Validaciones básicas - email ahora es opcional
    // if (!email) {
    //   return NextResponse.json(
    //     { success: false, error: 'Email es requerido' },
    //     { status: 400 }
    //   );
    // }

    if (source && !['cliente', 'prospecto', 'otro'].includes(source)) {
      return NextResponse.json(
        { success: false, error: 'Source debe ser: cliente, prospecto, o otro' },
        { status: 400 }
      );
    }

    if (region && (region < 1 || region > 16)) {
      return NextResponse.json(
        { success: false, error: 'Region debe estar entre 1 y 16' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Verificar si el email ya existe (solo si email no es null)
    if (email) {
      const { data: existingContact } = await supabase
        .from('active_contacts')
        .select('id')
        .eq('email', email)
        .single();

      if (existingContact) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un contacto activo con este email' },
          { status: 409 }
        );
      }
    }

    // Crear nuevo contacto
    const { data: newContact, error } = await supabase
      .from('active_contacts')
      .insert({
        full_name,
        email: email && email.trim() !== '' ? email : null, // Convertir string vacío a null
        phone: phone && phone.trim() !== '' ? phone : null, // Convertir string vacío a null
        linkedin_url,
        company_name,
        region: region ? parseInt(region) : null,
        source: source || 'prospecto',
        notes,
        tags: tags || [],
        can_receive_communications
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating active contact:', error);
      return NextResponse.json(
        { success: false, error: 'Error creando contacto activo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newContact as ActiveContact,
      message: 'Contacto activo creado exitosamente'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error in /api/active-contacts POST:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
