'use client';

/**
 * Dashboard principal del CRM
 * Muestra tabla de contactos con filtros y búsqueda
 */

import { useState, useEffect, useCallback } from 'react';
import { Contact } from '@/lib/types';

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterEmail, setFilterEmail] = useState('');

  // Fetch contactos
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterEstado) params.append('estado', filterEstado);
      if (filterEmail) params.append('emailSent', filterEmail);

      const response = await fetch(`/api/contacts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterEstado, filterEmail]);

  // Cargar contactos al montar y cuando cambien filtros
  useEffect(() => {
    fetchContacts();
  }, [search, filterEstado, filterEmail, fetchContacts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              {/* Logo placeholder - puedes reemplazar con imagen real */}
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Quantex CRM
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gestión de contactos y empresas
                </p>
              </div>
            </div>
            
            {/* Stats básicas */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{contacts.length}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {contacts.filter(c => c.email_sent).length}
                </div>
                <div className="text-xs text-gray-500">Contactados</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Estado
              </label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="contactado">Contactado</option>
                <option value="negociacion">Negociación</option>
                <option value="cerrado">Cerrado</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>

            {/* Filtro Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email Enviado
              </label>
              <select
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{contacts.length}</span> contactos
            </p>
          </div>
        </div>

        {/* Tabla de contactos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              ⏳ Cargando contactos...
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron contactos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Enviado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.nombre_contacto}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.razon_social || contact.rut_empresa}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.email_contacto || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.cargo_contacto || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.estado === 'activo' ? 'bg-green-100 text-green-800' :
                          contact.estado === 'contactado' ? 'bg-blue-100 text-blue-800' :
                          contact.estado === 'negociacion' ? 'bg-yellow-100 text-yellow-800' :
                          contact.estado === 'cerrado' ? 'bg-purple-100 text-purple-800' :
                          contact.estado === 'descartado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.estado || 'Sin estado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.email_sent ? (
                          <span className="text-green-600 font-medium">✓ Sí</span>
                        ) : (
                          <span className="text-gray-400">✗ No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
