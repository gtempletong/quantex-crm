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
      .from('active_contacts')
      .select('*')
      .eq('id', id)
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
        .from('active_contacts')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingContact) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro contacto activo con este email' },
          { status: 409 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email && email.trim() !== '' ? email : null; // Convertir string vacío a null
    if (phone !== undefined) updateData.phone = phone && phone.trim() !== '' ? phone : null; // Convertir string vacío a null
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (company_name !== undefined) updateData.company_name = company_name;
    if (region !== undefined) updateData.region = region ? parseInt(region) : null;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;
    if (can_receive_communications !== undefined) updateData.can_receive_communications = can_receive_communications;
    if (last_communication_sent_at !== undefined) updateData.last_communication_sent_at = last_communication_sent_at;

    // Actualizar contacto
    const { data: updatedContact, error } = await supabase
      .from('active_contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

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
      .from('active_contacts')
      .select('id, email')
      .eq('id', id)
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

    // Eliminar contacto
    const { error } = await supabase
      .from('active_contacts')
      .delete()
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
