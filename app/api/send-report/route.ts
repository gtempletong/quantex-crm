import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// POST /api/send-report - Enviar reporte masivo usando script Python standalone
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipients, report_topic } = body;

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

    // Path al script Python
    const scriptPath = path.join(
      process.cwd(), '..', 'quantex', 'scripts', 'send_report_emails.py'
    );
    
    // Path al Python del venv
    const pythonPath = path.join(
      process.cwd(), '..', 'venv', 'Scripts', 'python.exe'
    );

    return new Promise((resolve) => {
      const pythonProcess = spawn(pythonPath, [scriptPath]);
      
      let outputData = '';
      let errorData = '';

      // Enviar datos al script vía stdin
      pythonProcess.stdin.write(JSON.stringify({ recipients, report_topic }));
      pythonProcess.stdin.end();

      // Capturar output
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        // Stderr contiene los logs del script (mensajes informativos)
        console.log('[Python Script]:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Error ejecutando script Python:', errorData);
          resolve(NextResponse.json({
            success: false,
            error: 'Error enviando emails'
          }, { status: 500 }));
        } else {
          try {
            // Limpiar outputData: solo tomar la última línea que debería ser el JSON
            const lines = outputData.trim().split('\n');
            const jsonLine = lines[lines.length - 1];
            
            const result = JSON.parse(jsonLine);
            resolve(NextResponse.json({
              success: true,
              data: result
            }));
          } catch (parseError) {
            console.error('Error parseando resultado del script:', parseError);
            console.error('Output completo:', outputData);
            resolve(NextResponse.json({
              success: false,
              error: 'Error procesando respuesta del script'
            }, { status: 500 }));
          }
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Error spawnando proceso Python:', error);
        resolve(NextResponse.json({
          success: false,
          error: 'Error ejecutando script Python'
        }, { status: 500 }));
      });
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

