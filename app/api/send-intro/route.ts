/**
 * API Route: /api/send-intro
 * Envía email de introducción usando el modular agent
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { contactId, contactName } = await request.json();

    if (!contactId || !contactName) {
      return NextResponse.json(
        { error: 'contactId y contactName son requeridos' },
        { status: 400 }
      );
    }

    // Query para el modular agent
    const query = `envía email intro a ${contactName} usando la plantilla`;
    
    console.log('Enviando query al modular agent:', query);

    // Llamar al modular agent
    const modularAgentResponse = await fetch('http://localhost:5003/api/modular-agent/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        context: {
          contact_id: contactId,
          contact_name: contactName
        }
      }),
    });

    if (!modularAgentResponse.ok) {
      throw new Error(`Modular agent error: ${modularAgentResponse.status}`);
    }

    const result = await modularAgentResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      result: result
    });

  } catch (error: unknown) {
    console.error('Error sending intro email:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error enviando email de introducción', 
        details: message 
      },
      { status: 500 }
    );
  }
}
