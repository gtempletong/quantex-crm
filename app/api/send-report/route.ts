import { NextResponse } from 'next/server';

// POST /api/send-report - Enviar reporte masivo via modular agent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipients, report_html, subject } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de destinatarios requerida' },
        { status: 400 }
      );
    }

    if (!report_html) {
      return NextResponse.json(
        { success: false, error: 'Contenido HTML del reporte requerido' },
        { status: 400 }
      );
    }

    // Llamar al modular agent
    const modularAgentUrl = process.env.MODULAR_AGENT_URL || 'http://localhost:5003';
    const response = await fetch(`${modularAgentUrl}/api/send-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        report_html,
        subject: subject || 'Reporte Quantex'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Error del modular agent' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: unknown) {
    console.error('Error in /api/send-report POST:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

