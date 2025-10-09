'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      href: '/',
      active: pathname === '/'
    },
    {
      title: 'Prospects',
      icon: '🎯',
      href: '/prospects',
      active: pathname === '/prospects'
    },
    {
      title: 'Clientes',
      icon: '💼',
      href: '/clients',
      active: pathname === '/clients'
    },
    {
      title: 'Contactos Activos',
      icon: '👥',
      href: '/active-contacts',
      active: pathname === '/active-contacts'
    },
    {
      title: 'Charts',
      icon: '📊',
      href: '/charts',
      active: pathname === '/charts'
    },
    {
      title: 'Email',
      icon: '📧',
      href: '/emails',
      active: pathname === '/emails'
    },
    {
      title: 'Analytics',
      icon: '📈',
      href: '/analytics',
      active: pathname === '/analytics'
    },
    {
      title: 'Configuración',
      icon: '⚙️',
      href: '/settings',
      active: pathname === '/settings'
    }
  ];

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
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors ${
              item.active ? 'bg-blue-600' : ''
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {!isCollapsed && (
              <span className="font-medium">{item.title}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Stats */}
      {!isCollapsed && (
        <div className="mt-8 p-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Resumen</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Prospects</span>
              <span className="text-green-400">0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Clientes</span>
              <span className="text-blue-400">0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Emails</span>
              <span className="text-yellow-400">0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


