import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServerSupabase();
    
    // Test básico de conexión
    const { data, error } = await supabase
      .from('active_contacts')
      .select('count(*)')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a Supabase exitosa',
      supabase_connected: !!supabase,
      table_exists: !error,
      error: error?.message || null,
      count: data?.[0]?.count || 0
    });
    
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      supabase_connected: false
    }, { status: 500 });
  }
}



