import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// GET /api/reports/clp - Obtener el último reporte CLP
export async function GET() {
  try {
    const supabase = getServerSupabase();

    // Buscar el último reporte CLP en generated_artifacts
    const { data: reports, error } = await supabase
      .from('generated_artifacts')
      .select('*')
      .ilike('report_keyword', '%clp%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching CLP report:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo reporte CLP' },
        { status: 500 }
      );
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontró reporte CLP' },
        { status: 404 }
      );
    }

    const report = reports[0];

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        report_keyword: report.report_keyword,
        full_content: report.full_content,
        created_at: report.created_at,
        display_title: report.display_title || 'Informe Diario del Peso Chileno'
      }
    });

  } catch (error: unknown) {
    console.error('Error in /api/reports/clp GET:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

