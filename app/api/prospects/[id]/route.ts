/**
 * API Route: /api/prospects/[id]
 * Individual prospect operations (PUT, DELETE)
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// PUT - Update prospect
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = getServerSupabase();

    // Prepare data for update (only update fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Get current person data to access company_id
    const { data: currentPerson, error: fetchError } = await supabase
      .from('apollo_persons')
      .select('company_id')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current person:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener datos del prospect', details: fetchError.message },
        { status: 500 }
      );
    }

    // ========== COMPANY DATA UPDATES (apollo_companies is source of truth) ==========
    
    // 1. COMPANY NAME: apollo_companies.name is the SINGLE source of truth
    if (body.company_name !== undefined && currentPerson?.company_id) {
      const newCompanyName = body.company_name || null;
      
      // Update apollo_companies.name (source of truth)
      const { error: companyUpdateError } = await supabase
        .from('apollo_companies')
        .update({ name: newCompanyName, updated_at: new Date().toISOString() })
        .eq('id', currentPerson.company_id);

      if (companyUpdateError) {
        console.error('Error updating company name:', companyUpdateError);
        return NextResponse.json(
          { error: 'Error al actualizar nombre de empresa', details: companyUpdateError.message },
          { status: 500 }
        );
      }

      // Sync company_name for ALL persons from this company (denormalization)
      const { error: syncError } = await supabase
        .from('apollo_persons')
        .update({ company_name: newCompanyName, updated_at: new Date().toISOString() })
        .eq('company_id', currentPerson.company_id);

      if (syncError) {
        console.error('Error syncing company_name for all persons:', syncError);
      }
      
      console.log(`✅ Updated company name to '${newCompanyName}' in apollo_companies and synced to all persons`);
    }

    // 2. WEBSITE: apollo_companies.website is the source of truth
    if (body.website_company !== undefined && currentPerson?.company_id) {
      await supabase
        .from('apollo_companies')
        .update({ website: body.website_company || null, updated_at: new Date().toISOString() })
        .eq('id', currentPerson.company_id);
    }

    // 3. COMPANY AI CLASSIFICATION: apollo_companies.ai_classification is the source of truth
    if (currentPerson?.company_id && (body.company_ai_classification !== undefined || body.company_ai_score !== undefined)) {
      const companyUpdateData: any = { updated_at: new Date().toISOString() };
      
      if (body.company_ai_classification !== undefined) {
        companyUpdateData.ai_classification = body.company_ai_classification;
      }
      if (body.company_ai_score !== undefined) {
        companyUpdateData.ai_score = body.company_ai_score;
      }
      
      await supabase
        .from('apollo_companies')
        .update(companyUpdateData)
        .eq('id', currentPerson.company_id);
      
      console.log(`✅ Updated company AI classification in apollo_companies`);
    }

    // ========== PERSON DATA UPDATES (apollo_persons) ==========
    
    // Only update fields that belong to the PERSON (not company fields)
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.title !== undefined) updateData.title = body.title || null;
    if (body.linkedin_url !== undefined) updateData.linkedin_url = body.linkedin_url || null;
    
    // Person-specific AI classification (independent from company classification)
    if (body.ai_classification !== undefined) updateData.ai_classification = body.ai_classification || 'REVISAR';
    if (body.ai_score !== undefined) updateData.ai_score = body.ai_score || null;
    if (body.ai_justification !== undefined) updateData.ai_justification = body.ai_justification || null;
    
    // Person-specific tracking fields
    if (body.email_sent !== undefined) updateData.email_sent = body.email_sent || false;
    if (body.email_sent_at !== undefined) updateData.email_sent_at = body.email_sent_at || null;
    if (body.linkedin_invite_sent !== undefined) updateData.linkedin_invite_sent = body.linkedin_invite_sent || false;
    if (body.linkedin_invite_sent_at !== undefined) updateData.linkedin_invite_sent_at = body.linkedin_invite_sent_at || null;
    if (body.stage !== undefined) updateData.stage = body.stage || 'prospect';

    // Update person data
    const { data, error } = await supabase
      .from('apollo_persons')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prospect:', error);
      return NextResponse.json(
        { error: 'Error al actualizar prospect', details: error.message },
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

// DELETE - Delete prospect
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServerSupabase();

    const { error } = await supabase
      .from('apollo_persons')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting prospect:', error);
      return NextResponse.json(
        { error: 'Error al eliminar prospect', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prospect eliminado correctamente',
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
