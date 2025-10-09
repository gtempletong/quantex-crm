import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

interface BulkReportRequest {
  contactIds: string[];
  reportType: string;
  reportContent?: string;
  subject?: string;
}

export async function POST(request: Request) {
  try {
    const body: BulkReportRequest = await request.json();
    const { contactIds, reportType, reportContent, subject } = body;

    if (!contactIds || contactIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos un contacto' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Obtener contactos con email
    const { data: contacts, error } = await supabase
      .from('active_contacts')
      .select('id, full_name, email, company_name, source')
      .in('id', contactIds)
      .not('email', 'is', null)
      .eq('can_receive_communications', true);

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo contactos' },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron contactos válidos con email' },
        { status: 400 }
      );
    }

    // Llamar al modular agent para enviar emails
    const modularAgentUrl = process.env.MODULAR_AGENT_URL || 'http://localhost:5003';
    const results = [];

    for (const contact of contacts) {
      try {
        // Construir query para el modular agent
        const query = `envía email ${reportType} a ${contact.full_name} (${contact.email}) de ${contact.company_name}. ${reportContent ? `Contenido: ${reportContent}` : ''}`;

        const agentResponse = await fetch(`${modularAgentUrl}/api/modular-agent/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            context: {
              recipient_name: contact.full_name,
              recipient_email: contact.email,
              company_name: contact.company_name,
              report_type: reportType,
              custom_subject: subject,
              is_bulk_send: true
            }
          })
        });

        const agentResult = await agentResponse.json();

        results.push({
          contact_id: contact.id,
          contact_name: contact.full_name,
          email: contact.email,
          success: agentResult.success || false,
          error: agentResult.error || null,
          message: agentResult.message || null
        });

        // Pequeña pausa entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error sending email to ${contact.email}:`, error);
        results.push({
          contact_id: contact.id,
          contact_name: contact.full_name,
          email: contact.email,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
          message: null
        });
      }
    }

    // Estadísticas del envío
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Envío completado: ${successful} exitosos, ${failed} fallidos`,
      summary: {
        total: contacts.length,
        successful,
        failed
      },
      results
    });

  } catch (error: unknown) {
    console.error('Error in /api/send-bulk-report:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

