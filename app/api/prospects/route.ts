/**
 * API Route: /api/prospects
 * CRUD operations for prospects
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// GET - List prospects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '1000');

    const supabase = getServerSupabase();

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
        linkedin_invite_sent,
        linkedin_invite_sent_at,
        email_sent,
        email_sent_at,
        ai_classification,
        ai_score,
        ai_justification,
        ai_analyzed_at,
        stage,
        created_at,
        updated_at,
        apollo_companies!left(
          name,
          website,
          ai_analysis_report,
          ai_score,
          ai_classification
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply search
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prospects:', error);
      return NextResponse.json(
        { error: 'Error al obtener prospects', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      prospects: data || [],
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

// POST - Create new prospect
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getServerSupabase();

    // Validate required fields
    if (!body.full_name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Step 1: Handle company creation/lookup if company_name is provided
    let companyId = null;
    
    if (body.company_name) {
      // Try to find existing company by name
      const { data: existingCompany } = await supabase
        .from('apollo_companies')
        .select('id')
        .ilike('name', body.company_name)
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
            name: body.company_name,
            website: body.website_company || null,
          }])
          .select()
          .single();

        if (newCompany) {
          companyId = newCompany.id;
        }
      }
    }

    // Step 2: Create person with company_id if we have one
    const prospectData: any = {
      full_name: body.full_name,
      email: body.email || null,
      phone: body.phone || null,
      title: body.title || null,
      company_id: companyId,
      company_name: body.company_name || null,
      ai_classification: body.ai_classification || 'REVISAR',
      ai_score: body.ai_score || null,
      ai_justification: body.ai_justification || null,
      email_sent: body.email_sent || false,
      email_sent_at: body.email_sent_at || null,
      linkedin_invite_sent: body.linkedin_invite_sent || false,
      linkedin_invite_sent_at: body.linkedin_invite_sent_at || null,
      stage: body.stage || 'prospect',
    };

    // Only include linkedin_url if it's not empty
    if (body.linkedin_url && body.linkedin_url.trim() !== '') {
      prospectData.linkedin_url = body.linkedin_url;
    }

    const { data, error } = await supabase
      .from('apollo_persons')
      .insert([prospectData])
      .select()
      .single();

    if (error) {
      console.error('Error creating prospect:', error);
      return NextResponse.json(
        { error: 'Error al crear prospect', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prospect: data,
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
