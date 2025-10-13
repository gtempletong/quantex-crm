'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isQuantexExpanded, setIsQuantexExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const quantexActions = [
    { title: 'Pre-Informe Cobre', action: 'genera el pre informe del cobre' },
    { title: 'Pre-Informe CLP', action: 'generar pre informe para clp' },
    { title: 'Analizar Acción Individual', action: 'trigger_technical_analysis' },
    { title: 'Publicar Informe Final (Cobre)', action: 'publica el informe final del cobre' },
    { title: 'Publicar Informe Final (CLP)', action: 'publica el informe final del peso chileno' },
    { title: 'Cargar Datos del Cobre', action: 'carga los datos del cobre' },
    { title: 'Cargar Datos del CLP', action: 'cargar datos para clp' },
    { title: 'Alinear Tesis (CLP)', action: 'iniciar sesion de alineamiento para el clp' },
    { title: 'Alinear Tesis (Cobre)', action: 'iniciar sesion de alineamiento para el cobre' }
  ];

  const menuItems = [
    {
      title: 'Prospects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/prospects',
      active: pathname === '/prospects'
    },
    {
      title: 'Contactos Activos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: '/active-contacts',
      active: pathname === '/active-contacts'
    },
    {
      title: 'Charts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/charts',
      active: pathname === '/charts'
    },
    {
      title: 'Quantex',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: '/quantex',
      active: pathname === '/quantex',
      hasSubmenu: true
    }
  ];

  const handleQuantexAction = (action: string) => {
    // Toggle submenu closed first
    setIsQuantexExpanded(false);
    
    // Store the action to be executed when the page loads
    sessionStorage.setItem('quantexAction', action);
    
    // Reiniciar el monitoreo en la página Quantex si ya está cargada
    if (typeof window !== 'undefined' && window.startActionMonitoring) {
      window.startActionMonitoring();
    }
    
    // Navigate to quantex page
    router.push('/quantex');
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-bold text-lg">Quantex CRM</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-700"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        {menuItems.map((item) => (
          <div key={item.href}>
            {item.hasSubmenu ? (
              <div>
                <div className="flex">
                  <Link
                    href={item.href}
                    className={`flex-1 flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors ${
                      item.active ? 'bg-blue-600' : ''
                    }`}
                  >
                    <span className="text-gray-300">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="font-medium">{item.title}</span>
                    )}
                  </Link>
                  {!isCollapsed && (
                    <button
                      onClick={() => setIsQuantexExpanded(!isQuantexExpanded)}
                      className="px-2 hover:bg-gray-800 transition-colors"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${isQuantexExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Submenu */}
                {isQuantexExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {quantexActions.map((action) => (
                      <button
                        key={action.action}
                        onClick={() => handleQuantexAction(action.action)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
                      >
                        {action.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors ${
                  item.active ? 'bg-blue-600' : ''
                }`}
              >
                <span className="text-gray-300">{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-medium">{item.title}</span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

    </div>
  );
}


