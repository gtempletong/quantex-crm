import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { ActiveContact } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/active-contacts/[id] - Obtener contacto activo por ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const { data: contact, error } = await supabase
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
      .eq('id', id)
      .eq('stage', 'active_contact')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Contacto activo no encontrado' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching active contact:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo contacto activo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact as ActiveContact
    });

  } catch (error: unknown) {
    console.error('Error in /api/active-contacts/[id] GET:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/active-contacts/[id] - Actualizar contacto activo
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

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
      can_receive_communications,
      last_communication_sent_at
    } = body;

    // Validaciones
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

    // Si se está actualizando el email, verificar que no exista otro contacto con el mismo email
    if (email) {
      const { data: existingContact } = await supabase
        .from('apollo_persons')
        .select('id')
        .eq('email', email)
        .eq('stage', 'active_contact')
        .neq('id', id)
        .single();

      if (existingContact) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro contacto activo con este email' },
          { status: 409 }
        );
      }
    }

    // Preparar datos de actualización (solo campos que existen en apollo_persons)
    const updateData: any = {};
    
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email && email.trim() !== '' ? email : null;
    if (phone !== undefined) updateData.phone = phone && phone.trim() !== '' ? phone : null;
    if (body.title !== undefined) updateData.title = body.title || null;
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (company_name !== undefined) updateData.company_name = company_name;
    // Nota: region, source, notes, tags, can_receive_communications, last_communication_sent_at ya no existen

    // Actualizar contacto
    const { data: updatedContact, error } = await supabase
      .from('apollo_persons')
      .update(updateData)
      .eq('id', id)
      .eq('stage', 'active_contact')
      .select()
      .single();

    // Si se proporciona website_company y el contacto tiene company_id, actualizar apollo_companies
    if (body.website_company !== undefined && updatedContact?.company_id) {
      await supabase
        .from('apollo_companies')
        .update({ website: body.website_company || null })
        .eq('id', updatedContact.company_id);
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Contacto activo no encontrado' },
          { status: 404 }
        );
      }
      
      console.error('Error updating active contact:', error);
      return NextResponse.json(
        { success: false, error: 'Error actualizando contacto activo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedContact as ActiveContact,
      message: 'Contacto activo actualizado exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error in /api/active-contacts/[id] PATCH:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/active-contacts/[id] - Eliminar contacto activo
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Verificar que el contacto existe antes de eliminarlo
    const { data: existingContact, error: fetchError } = await supabase
      .from('apollo_persons')
      .select('id, email')
      .eq('id', id)
      .eq('stage', 'active_contact')
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Contacto activo no encontrado' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching active contact for deletion:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Error verificando contacto activo' },
        { status: 500 }
      );
    }

    // Eliminar contacto (o mejor: mover de vuelta a prospects)
    const { error } = await supabase
      .from('apollo_persons')
      .update({ stage: 'prospect' })  // Mejor que eliminar, lo movemos de vuelta
      .eq('id', id);

    if (error) {
      console.error('Error deleting active contact:', error);
      return NextResponse.json(
        { success: false, error: 'Error eliminando contacto activo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Contacto activo ${existingContact.email} eliminado exitosamente`
    });

  } catch (error: unknown) {
    console.error('Error in /api/active-contacts/[id] DELETE:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
