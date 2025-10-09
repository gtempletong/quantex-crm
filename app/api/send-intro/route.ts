/**
 * API Route: /api/send-intro
 * Envía email de introducción llamando directamente a las herramientas del modular agent
 * (sin usar el LLM planner para evitar problemas de paso de datos entre herramientas)
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { contactId, contactName } = await request.json();

    if (!contactId || !contactName) {
      return NextResponse.json(
        { error: 'contactId y contactName son requeridos' },
        { status: 400 }
      );
    }

    console.log(`📧 Enviando email intro a: ${contactName} (ID: ${contactId})`);
    console.log(`📋 Tipo de contactId: ${typeof contactId}`);

    // 1. Buscar datos del contacto en Supabase
    const supabase = getServerSupabase();
    console.log(`🔍 Buscando contacto con ID: ${contactId}`);
    
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', contactId)
      .single();
    
    console.log(`📊 Resultado de búsqueda:`, { persona, personaError });

    if (personaError || !persona) {
      throw new Error('No se encontró el contacto en la base de datos');
    }

    if (!persona.email_contacto) {
      throw new Error('El contacto no tiene email registrado');
    }

    console.log(`  ✅ Contacto encontrado: ${persona.nombre_contacto} - ${persona.email_contacto}`);

    // 1.1. Buscar datos de la empresa si existe
    let razonSocial = '';
    if (persona.rut_empresa) {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('razon_social')
        .eq('rut_empresa', persona.rut_empresa)
        .single();
      
      if (empresa) {
        razonSocial = empresa.razon_social;
      }
    }

    // 1.2. Extraer solo el primer nombre (manejar nombres compuestos)
    const extractFirstName = (fullName: string): string => {
      if (!fullName) return '';
      
      const name = fullName.trim();
      const words = name.split(/\s+/);
      
      if (words.length === 1) return words[0];
      
      // Nombres compuestos comunes en español
      const compoundNames = [
        'juan pablo', 'maría jesús', 'josé luis', 'maría elena', 'josé maría',
        'maría josé', 'josé antonio', 'maría carmen', 'josé carlos', 'maría teresa',
        'josé manuel', 'maría pilar', 'josé miguel', 'maría dolores', 'josé francisco',
        'maría ángeles', 'josé ramón', 'maría isabel', 'josé enrique', 'maría victoria',
        'josé ignacio', 'maría luisa', 'josé rafael', 'maría mercedes', 'josé vicente'
      ];
      
      const firstTwoWords = `${words[0].toLowerCase()} ${words[1].toLowerCase()}`;
      
      if (compoundNames.includes(firstTwoWords)) {
        return `${words[0]} ${words[1]}`;
      }
      
      return words[0];
    };

    const firstName = extractFirstName(persona.nombre_contacto || '');
    console.log(`📝 Nombre completo: "${persona.nombre_contacto}" → Primer nombre: "${firstName}"`);

    // 2. Llamar al modular agent para componer el email con plantilla
    const composeResponse = await fetch('http://localhost:5003/api/modular-agent/execute-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'llm.compose_email_template',
        params: {
          recipient_name: firstName,
          recipient_company: razonSocial,
          recipient_role: persona.cargo_contacto || ''
        }
      })
    });

    if (!composeResponse.ok) {
      throw new Error('Error al componer el email');
    }

    const composeResult = await composeResponse.json();
    
    console.log(`📋 Resultado de compose:`, composeResult);
    
    if (!composeResult.ok) {
      throw new Error(composeResult.error || 'Error al componer el email');
    }

    console.log(`  ✅ Email compuesto con plantilla`);
    console.log(`📧 Subject: ${composeResult.subject}`);
    console.log(`📧 HTML Content length: ${composeResult.html_content?.length || 'undefined'}`);

    // 3. Enviar el email usando Gmail
    const sendResponse = await fetch('http://localhost:5003/api/modular-agent/execute-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'gmail.send_email',
        params: {
          to: [persona.email_contacto],
          subject: composeResult.subject,
          html_body: composeResult.html_content  // Cambiado de html_body a html_content
        }
      })
    });

    if (!sendResponse.ok) {
      throw new Error('Error al enviar el email');
    }

    const sendResult = await sendResponse.json();

    if (!sendResult.ok) {
      throw new Error(sendResult.error || 'Error al enviar el email');
    }

    console.log(`  ✅ Email enviado exitosamente a ${persona.email_contacto}`);

    // 4. Actualizar el estado del contacto en Supabase
    const { error: updateError } = await supabase
      .from('personas')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('⚠️ Error actualizando estado del contacto:', updateError);
      // No fallar el proceso completo, solo logear el error
    } else {
      console.log(`  ✅ Estado actualizado: email_sent = true para contacto ${contactId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      result: {
        to: persona.email_contacto,
        subject: composeResult.subject,
        message_id: sendResult.message_id
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error sending intro email:', error);
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



