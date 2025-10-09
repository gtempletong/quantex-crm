import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('generated_artifacts')
      .select('*')
      .eq('report_keyword', 'cobre')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching Copper report:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data || !data.full_content) {
      return NextResponse.json({ success: false, error: 'No se encontró el último reporte de Cobre.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        report_keyword: 'cobre',
        full_content: data.full_content,
        created_at: data.created_at,
        display_title: 'Informe Diario del Cobre'
      }
    });

  } catch (error: any) {
    console.error('Error en /api/reports/copper:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
