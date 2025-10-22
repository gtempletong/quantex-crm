import { NextResponse } from 'next/server';

// POST /api/send-report - Enviar reporte masivo via modular agent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipients, report_topic, subject } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de destinatarios requerida' },
        { status: 400 }
      );
    }

    if (!report_topic) {
      return NextResponse.json(
        { success: false, error: 'Tópico del reporte requerido' },
        { status: 400 }
      );
    }

    // Llamar al modular agent
    const modularAgentUrl = process.env.MODULAR_AGENT_URL;
    
    if (!modularAgentUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MODULAR_AGENT_URL no configurado en .env.local' 
        },
        { status: 500 }
      );
    }

    const response = await fetch(`${modularAgentUrl}/api/send-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        report_topic,
        subject: subject || 'Reporte Quantex'
      })
    });

    // Manejar respuestas que no sean JSON (e.g., HTML de un túnel/localtunnel)
    const rawText = await response.text();
    let result: any = null;
    try {
      result = rawText ? JSON.parse(rawText) : null;
    } catch {
      // No es JSON; devolver error detallado con fragmento de la respuesta
      const snippet = rawText?.slice(0, 200) || 'Respuesta vacía del servidor';
      return NextResponse.json(
        { success: false, error: `Respuesta no JSON del modular agent (${response.status}): ${snippet}` },
        { status: response.ok ? 502 : response.status }
      );
    }

    if (!response.ok || !result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || `Error del modular agent (${response.status})` },
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

