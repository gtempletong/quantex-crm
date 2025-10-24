/**
 * API Route: /api/send-contact-email
 * Envía email con formato HTML y attachments a un contacto activo desde el dashboard
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Parse FormData (para manejar archivos)
    const formData = await request.formData();
    
    const contactId = formData.get('contactId') as string;
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const body = formData.get('body') as string;
    
    // Obtener archivos adjuntos
    const attachmentFiles = formData.getAll('attachments') as File[];

    if (!contactId || !to || !subject || !body) {
      return NextResponse.json(
        { error: 'contactId, to, subject y body son requeridos' },
        { status: 400 }
      );
    }

    console.log(`📧 Enviando email a contacto: ${to} (ID: ${contactId})`);
    console.log(`📎 Attachments: ${attachmentFiles.length} archivo(s)`);

    // 1. Convertir archivos a base64
    const attachments = await Promise.all(
      attachmentFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          filename: file.name,
          content: base64,
          encoding: 'base64',
          type: file.type
        };
      })
    );

    // 2. Buscar company_id del contacto
    const supabase = getServerSupabase();
    
    const { data: contact } = await supabase
      .from('apollo_persons')
      .select('company_id')
      .eq('id', contactId)
      .single();

    const companyId = contact?.company_id || null;

    // 3. Enviar email usando script Python standalone
    const scriptPath = path.join(
      process.cwd(), '..', 'quantex', 'scripts', 'send_individual_email.py'
    );
    
    const pythonPath = path.join(
      process.cwd(), '..', 'venv', 'Scripts', 'python.exe'
    );

    const emailResult = await new Promise<any>((resolve) => {
      const pythonProcess = spawn(pythonPath, [scriptPath]);
      
      let outputData = '';
      let errorData = '';

      // Enviar datos al script
      pythonProcess.stdin.write(JSON.stringify({
        to,
        subject,
        html_body: body,
        attachments,
        contact_id: contactId,
        company_id: companyId
      }));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.log('[Python Script]:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Error ejecutando script Python:', errorData);
          resolve({ ok: false, error: 'Error enviando email' });
        } else {
          try {
            const lines = outputData.trim().split('\n');
            const jsonLine = lines[lines.length - 1];
            const result = JSON.parse(jsonLine);
            resolve(result);
          } catch (parseError) {
            console.error('Error parseando resultado:', parseError);
            console.error('Output completo:', outputData);
            resolve({ ok: false, error: 'Error procesando respuesta' });
          }
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Error spawnando proceso:', error);
        resolve({ ok: false, error: 'Error ejecutando script Python' });
      });
    });

    if (!emailResult.ok) {
      throw new Error(emailResult.error || 'Error al enviar el email');
    }

    console.log(`  ✅ Email enviado exitosamente a ${to}`);

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      result: {
        to,
        subject,
        message_id: emailResult.message_id
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error sending contact email:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error enviando email', 
        details: message 
      },
      { status: 500 }
    );
  }
}
