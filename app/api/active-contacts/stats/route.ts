import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// GET /api/active-contacts/stats - Obtener estadísticas generales
export async function GET() {
  try {
    const supabase = getServerSupabase();

    // Obtener estadísticas generales - AHORA USA apollo_persons con stage = 'active_contact'
    const [
      { count: totalContacts },
      { count: withEmailCount },
      { count: withLinkedInCount },
      { count: withBothCount }
    ] = await Promise.all([
      // Total contactos activos
      supabase
        .from('apollo_persons')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'active_contact'),
      
      // Con email
      supabase
        .from('apollo_persons')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'active_contact')
        .not('email', 'is', null)
        .neq('email', ''),
      
      // Con LinkedIn
      supabase
        .from('apollo_persons')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'active_contact')
        .not('linkedin_url', 'is', null)
        .neq('linkedin_url', ''),
      
      // Con email Y LinkedIn
      supabase
        .from('apollo_persons')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'active_contact')
        .not('email', 'is', null)
        .neq('email', '')
        .not('linkedin_url', 'is', null)
        .neq('linkedin_url', '')
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalContacts: totalContacts || 0,
        // Campos removidos: canReceive, clients, prospects (ya no existen en apollo_persons)
        withEmail: withEmailCount || 0,
        withLinkedIn: withLinkedInCount || 0,
        withBoth: withBothCount || 0
      }
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error: unknown) {
    console.error('Error in /api/active-contacts/stats GET:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}


