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

    // Construir query base para datos - AHORA USA apollo_persons con stage = 'active_contact'
    let dataQuery = supabase
      .from('apollo_persons')
      .select(`
        *,
        apollo_companies!left(
          website,
          ai_analysis_report,
          ai_score,
          ai_classification
        )
      `)
      .eq('stage', 'active_contact')
      .order('created_at', { ascending: false });

    // Construir query base para conteo
    let countQuery = supabase
      .from('apollo_persons')
      .select('*', { count: 'exact', head: true })
      .eq('stage', 'active_contact');

    // Aplicar filtros a ambas queries
    // Nota: source y region ya no existen en apollo_persons, se removieron
    
    if (canReceive && canReceive !== 'all') {
      if (canReceive === 'email') {
        // Solo contactos con email
        dataQuery = dataQuery.not('email', 'is', null).neq('email', '');
        countQuery = countQuery.not('email', 'is', null).neq('email', '');
      } else if (canReceive === 'linkedin') {
        // Solo contactos con LinkedIn
        dataQuery = dataQuery.not('linkedin_url', 'is', null).neq('linkedin_url', '');
        countQuery = countQuery.not('linkedin_url', 'is', null).neq('linkedin_url', '');
      } else if (canReceive === 'both') {
        // Contactos con email Y LinkedIn
        dataQuery = dataQuery
          .not('email', 'is', null).neq('email', '')
          .not('linkedin_url', 'is', null).neq('linkedin_url', '');
        countQuery = countQuery
          .not('email', 'is', null).neq('email', '')
          .not('linkedin_url', 'is', null).neq('linkedin_url', '');
      }
    }

    if (search) {
      dataQuery = dataQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Aplicar paginación solo a la query de datos
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Ejecutar ambas queries
    const [{ data: contacts, error }, { count, error: countError }] = await Promise.all([
      dataQuery,
      countQuery
    ]);

    if (error || countError) {
      console.error('Error fetching active contacts:', error || countError);
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
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
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
        .from('apollo_persons')
        .select('id')
        .eq('email', email)
        .eq('stage', 'active_contact')
        .single();

      if (existingContact) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un contacto activo con este email' },
          { status: 409 }
        );
      }
    }

    // Step 1: Handle company creation/lookup if company_name is provided
    let companyId = null;
    
    if (company_name) {
      // Try to find existing company by name
      const { data: existingCompany } = await supabase
        .from('apollo_companies')
        .select('id')
        .ilike('name', company_name)
        .limit(1)
        .single();

      if (existingCompany) {
        // Company exists, use its ID
        companyId = existingCompany.id;
        
        // Update website if provided
        if (body.website_company) {
          await supabase
            .from('apollo_companies')
            .update({ website: body.website_company })
            .eq('id', existingCompany.id);
        }
      } else {
        // Company doesn't exist, create it
        const { data: newCompany } = await supabase
          .from('apollo_companies')
          .insert([{
            name: company_name,
            website: body.website_company || null,
          }])
          .select()
          .single();

        if (newCompany) {
          companyId = newCompany.id;
        }
      }
    }

    // Step 2: Create person with company_id and stage = 'active_contact'
    const insertData: any = {
      full_name,
      email: email && email.trim() !== '' ? email : null,
      phone: phone && phone.trim() !== '' ? phone : null,
      title: body.title || null,
      company_id: companyId,
      company_name,
      stage: 'active_contact',
    };

    // Only include linkedin_url if it's not empty
    if (linkedin_url && linkedin_url.trim() !== '') {
      insertData.linkedin_url = linkedin_url;
    }

    const { data: newContact, error } = await supabase
      .from('apollo_persons')
      .insert(insertData)
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
