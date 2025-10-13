'use client';

import { useEffect, useState, useRef } from 'react';

export default function QuantexPage() {
  const [isClient, setIsClient] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || initializedRef.current) return;
    
    initializedRef.current = true;
    
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      // Check if elements exist
      const chatForm = document.getElementById('chat-form') as HTMLFormElement;
      const chatInput = document.getElementById('chat-input') as HTMLInputElement;
      const chatWindow = document.getElementById('chat-window') as HTMLDivElement;
      const panelContent = document.getElementById('panel-content') as HTMLDivElement;
      
      if (!chatForm || !chatInput || !chatWindow || !panelContent) {
        console.error('Quantex elements not found');
        return;
      }

      const submitButton = chatForm.querySelector('button') as HTMLButtonElement;
      
      // Esta variable guardará el estado de la sesión entre peticiones.
      let sessionState: any = {};
      
      // Cargar sessionState guardado
      const savedSessionState = sessionStorage.getItem('quantexSessionState');
      if (savedSessionState) {
        try {
          sessionState = JSON.parse(savedSessionState);
          console.log('🔄 SessionState cargado desde sessionStorage:', sessionState);
        } catch (e) {
          console.error('Error cargando sessionState:', e);
          sessionState = {};
        }
      }
      
      // Función para guardar el sessionState
      const saveSessionState = () => {
        sessionStorage.setItem('quantexSessionState', JSON.stringify(sessionState));
      };
      
      // Función para guardar el historial del chat
      const saveChatHistory = () => {
        const chatMessages = chatWindow.innerHTML;
        sessionStorage.setItem('quantexChatHistory', chatMessages);
      };
      
      // Función para cargar el historial del chat
      const loadChatHistory = () => {
        const savedHistory = sessionStorage.getItem('quantexChatHistory');
        if (savedHistory) {
          chatWindow.innerHTML = savedHistory;
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      };
      
      // Función para cargar el contenido del panel
      const loadPanelContent = () => {
        const savedPanelContent = sessionStorage.getItem('quantexPanelContent');
        if (savedPanelContent) {
          panelContent.innerHTML = savedPanelContent;
        }
      };
      
      // Cargar historial y panel al inicio
      loadChatHistory();
      loadPanelContent();

      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        if (userMessage) {
          (window as any).handleUserRequest(userMessage);
        }
      });

      // Make handleUserRequest available globally
      (window as any).handleUserRequest = async function(message: string) {
        console.log("✅ handleUserRequest llamado con mensaje:", message);
        addMessageToChat(message, 'user-message');
        chatInput.value = '';
        submitButton.disabled = true;

        try {
          const requestBody = { message: message, state: sessionState };
          console.log("🕵️ ESPÍA (Frontend): Enviando el siguiente estado al backend:", sessionState);
          
          const response = await fetch('http://127.0.0.1:5001/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          const data = await response.json();

          if (!response.ok || data.error) {
            throw new Error(data.error || 'Error del servidor: ' + response.statusText);
          }

          if (data.state) {
            sessionState = data.state;
            console.log("🕵️ ESPÍA (Frontend): Estado de la sesión sincronizado con el backend:", sessionState);
            saveSessionState();
          }
          
          if (data.artifact_id) {
            sessionState.artifact_id = data.artifact_id;
            console.log("🕵️ ESPÍA (Frontend): ID de artefacto recibido y guardado:", sessionState.artifact_id);
            saveSessionState();
          }

          if (data.response_blocks && data.response_blocks.length > 0) {
            let chatContent = '';
            let accumulatedPanelHtml = '';
            let consolidatedPanelHtml = '';

            const hasConsolidatedSignal = (typeof data.total_tickers === 'number' && data.total_tickers > 0)
              || (Array.isArray(data.tickers) && data.tickers.length > 0);

            data.response_blocks.forEach((block: any) => {
              if (block.display_target === 'chat') {
                chatContent += block.content + '\\n';
              } else if (block.display_target === 'panel' && block.type === 'html') {
                if (hasConsolidatedSignal) {
                  if (!consolidatedPanelHtml) {
                    consolidatedPanelHtml = block.content;
                  }
                } else {
                  accumulatedPanelHtml += block.content;
                }
              }
            });

            if (chatContent) {
              addMessageToChat(chatContent.trim(), 'quantex-message');
            }
            if (consolidatedPanelHtml) {
              panelContent.innerHTML = consolidatedPanelHtml;
              sessionStorage.setItem('quantexPanelContent', consolidatedPanelHtml);
            } else if (accumulatedPanelHtml) {
              panelContent.innerHTML = accumulatedPanelHtml;
              sessionStorage.setItem('quantexPanelContent', accumulatedPanelHtml);
            }
          }

        } catch (err: any) {
          addMessageToChat('Error en el flujo: ' + err.message, 'quantex-message');
        } finally {
          submitButton.disabled = false;
          chatInput.focus();
        }
      }

      function addMessageToChat(text: string, className: string) {
        const div = document.createElement('div');
        div.classList.add('message', className);
        div.innerHTML = text.replace(/\\n/g, '<br>');
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        saveChatHistory();
      }

      function renderToPanel(block: any) {
        panelContent.innerHTML = block.content;
        sessionStorage.setItem('quantexPanelContent', panelContent.innerHTML);
      }

      let actionInterval: NodeJS.Timeout | null = null;
      
      const checkForPendingAction = () => {
        const action = sessionStorage.getItem('quantexAction');
        
        if (action) {
          sessionStorage.removeItem('quantexAction');
            (window as any).handleUserRequest(action);
          
          if (actionInterval) {
            clearInterval(actionInterval);
            actionInterval = null;
          }
        }
      };
      
      const startActionMonitoring = () => {
        if (actionInterval) return;
        actionInterval = setInterval(checkForPendingAction, 500);
      };
      
      const stopActionMonitoring = () => {
        if (actionInterval) {
          clearInterval(actionInterval);
          actionInterval = null;
        }
      };
      
      checkForPendingAction();
      
      if (!sessionStorage.getItem('quantexAction')) {
        startActionMonitoring();
      }
      
      window.addEventListener('beforeunload', stopActionMonitoring);
      
      const clearQuantexHistory = () => {
        sessionStorage.removeItem('quantexChatHistory');
        sessionStorage.removeItem('quantexPanelContent');
        sessionStorage.removeItem('quantexSessionState');
        chatWindow.innerHTML = '';
        panelContent.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">Aquí se mostrarán los datos detallados.</p>';
        sessionState = {};
      };
      
      (window as any).startActionMonitoring = startActionMonitoring;
      (window as any).stopActionMonitoring = stopActionMonitoring;
      (window as any).clearQuantexHistory = clearQuantexHistory;
    }, 100);

    return () => {
      clearTimeout(timer);
      initializedRef.current = false;
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando Quantex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <link rel="stylesheet" href="/quantex-style.css" />
      <div id="app-container">
        <div id="chat-container" className="panel">
          <h2>Chat Quantex</h2>
          <div id="chat-window"></div>
          <form id="chat-form">
            <input type="text" id="chat-input" placeholder="Escribe tu pregunta..." autoComplete="off" />
            <button type="submit">Enviar</button>
          </form>
        </div>
        <div id="panel-container" className="panel">
          <h2>Visualización</h2>
          <div id="panel-content">
            <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>Aquí se mostrarán los datos detallados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
