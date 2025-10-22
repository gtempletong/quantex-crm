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

    // Only update fields that are provided in the request
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.title !== undefined) updateData.title = body.title || null;
    if (body.linkedin_url !== undefined) updateData.linkedin_url = body.linkedin_url || null;
    if (body.company_name !== undefined) updateData.company_name = body.company_name || null;
    if (body.seniority !== undefined) updateData.seniority = body.seniority || null;
    if (body.ai_classification !== undefined) updateData.ai_classification = body.ai_classification || 'REVISAR';
    if (body.ai_score !== undefined) updateData.ai_score = body.ai_score || null;
    if (body.ai_justification !== undefined) updateData.ai_justification = body.ai_justification || null;
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

    // If website_company is provided, also update the company website
    if (body.website_company !== undefined && data?.company_id) {
      await supabase
        .from('apollo_companies')
        .update({ website: body.website_company || null })
        .eq('id', data.company_id);
    }

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
