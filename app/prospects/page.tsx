'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Contact } from '@/lib/types';

interface LinkedInLead {
  id: number;
  full_name: string;
  company_name: string;
  title: string;
  industry: string;
  location: string;
  ai_classification: string;
  ai_score: number;
  ai_justification: string;
  linkedin_profile_url: string;
  airtable_synced: boolean;
  phantom_status: string;
  connection_status: string;
  prospect_stage: string;
  dm_sent_at: string | null;
  connection_accepted_at: string | null;
  last_activity_at: string;
  created_at: string;
}

// Componente para Email Prospects
function EmailProspectsTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch contactos
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterEstado) params.append('estado', filterEstado);
      if (filterEmail) params.append('emailSent', filterEmail);
      if (filterRegion) params.append('region', filterRegion);

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
  }, [search, filterEstado, filterEmail, filterRegion]);

  // Función para enviar email intro
  const handleSendIntro = async (contactId: number, contactName: string) => {
    setSendingEmail(contactId);
    try {
      const response = await fetch('/api/send-intro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          contactName
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchContacts();
        alert('Email enviado exitosamente!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending intro:', error);
      alert('Error enviando email');
    } finally {
      setSendingEmail(null);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Selección de filas
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c.id));
    }
  };

  const handleSendIntroSelected = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const c = contacts.find(ct => ct.id === id);
      if (!c || c.email_sent) continue;
      await handleSendIntro(c.id, c.nombre_contacto || '');
    }
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="contactado">Contactado</option>
            <option value="negociacion">Negociación</option>
            <option value="cerrado">Cerrado</option>
            <option value="descartado">Descartado</option>
          </select>
          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
          >
            <option value="">Emails: Todos</option>
            <option value="true">Emails: Enviados</option>
            <option value="false">Emails: No Enviados</option>
          </select>
          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="">Región: Todas</option>
            <option value="13">Región Metropolitana</option>
          </select>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Total: <span className="font-semibold">{contacts.length}</span> contactos
        </div>
      </div>

      {/* Acciones masivas */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Seleccionados: <span className="font-semibold">{selectedIds.length}</span></div>
        <div className="space-x-2">
          <button
            onClick={handleSendIntroSelected}
            disabled={selectedIds.length === 0 || sendingEmail !== null}
            className={`px-3 py-2 text-sm font-medium rounded-md ${selectedIds.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            Enviar Intro a seleccionados
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Limpiar selección
          </button>
        </div>
      </div>

      {/* Table */}
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
                  <th className="px-4 py-3">
                    <input type="checkbox" aria-label="Seleccionar todos" checked={contacts.length>0 && selectedIds.length===contacts.length} onChange={toggleSelectAll} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Región
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
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleSelect(contact.id)} aria-label={`Seleccionar ${contact.nombre_contacto}`} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contact.nombre_contacto}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.razon_social || contact.rut_empresa}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words max-w-[220px]">
                      <div className="text-sm text-gray-900" title={contact.email_contacto || ''}>
                        {contact.email_contacto || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words max-w-[220px]">
                      <div className="text-sm text-gray-900" title={contact.razon_social || contact.rut_empresa}>
                        {contact.razon_social || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {contact.region_label || (contact.region_number === 13 ? 'Región Metropolitana' : contact.region_number || '-')}
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
    </div>
  );
}

export default function ProspectsPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'linkedin'>('email');
         const [linkedinLeads, setLinkedinLeads] = useState<LinkedInLead[]>([]);
         const [loading, setLoading] = useState(true);
         const [filter, setFilter] = useState<'all' | 'INCLUIR' | 'DESCARTAR'>('all');
         const [phantomFilter, setPhantomFilter] = useState<'all' | 'En Cola' | 'Solicitud Enviada' | 'Completado'>('all');
         const [connectionFilter, setConnectionFilter] = useState<'all' | 'No Conectado' | 'Conectado' | 'Perdido'>('all');

  // Fetch LinkedIn leads
  const fetchLinkedinLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('filter', filter);
      }
      if (phantomFilter !== 'all') {
        params.append('phantomFilter', phantomFilter);
      }
      if (connectionFilter !== 'all') {
        params.append('connectionFilter', connectionFilter);
      }
      const response = await fetch(`/api/linkedin-leads?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setLinkedinLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching LinkedIn leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'linkedin') {
      fetchLinkedinLeads();
    }
  }, [activeTab, filter, phantomFilter, connectionFilter]);

  const filteredLeads = linkedinLeads.filter(lead => {
    if (filter !== 'all' && lead.ai_classification !== filter) return false;
    if (phantomFilter !== 'all' && lead.phantom_status !== phantomFilter) return false;
    if (connectionFilter !== 'all' && lead.connection_status !== connectionFilter) return false;
    return true;
  });

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'INCLUIR': return 'bg-green-100 text-green-800';
      case 'DESCARTAR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPhantomStatusColor = (status: string) => {
    switch (status) {
      case 'Solicitud Enviada': return 'bg-green-100 text-green-800';
      case 'En Cola': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'Conectado': return 'bg-green-100 text-green-800';
      case 'No Conectado': return 'bg-gray-100 text-gray-800';
      case 'Perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prospects</h1>
        <p className="text-gray-600">Gestiona tus prospects de email y LinkedIn</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('email')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'email'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📧 Prospects Email
            </button>
            <button
              onClick={() => setActiveTab('linkedin')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'linkedin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔗 Prospects LinkedIn
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'email' ? (
        <EmailProspectsTab />
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Clasificación IA */}
              <div>
                <label htmlFor="classification-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Clasificación IA
                </label>
                <select
                  id="classification-filter"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'INCLUIR' | 'DESCARTAR')}
                >
                  <option value="all">Todas las clasificaciones</option>
                  <option value="INCLUIR">INCLUIR</option>
                  <option value="DESCARTAR">DESCARTAR</option>
                </select>
              </div>

              {/* Phantom Status */}
              <div>
                <label htmlFor="phantom-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Phantom Status
                </label>
                <select
                  id="phantom-filter"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={phantomFilter}
                  onChange={(e) => setPhantomFilter(e.target.value as 'all' | 'En Cola' | 'Solicitud Enviada' | 'Completado')}
                >
                  <option value="all">Todos los estados</option>
                  <option value="En Cola">En Cola</option>
                  <option value="Solicitud Enviada">Solicitud Enviada</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>

              {/* Connection Status */}
              <div>
                <label htmlFor="connection-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado Conexión
                </label>
                <select
                  id="connection-filter"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={connectionFilter}
                  onChange={(e) => setConnectionFilter(e.target.value as 'all' | 'No Conectado' | 'Conectado' | 'Perdido')}
                >
                  <option value="all">Todos los estados</option>
                  <option value="No Conectado">No Conectado</option>
                  <option value="Conectado">Conectado</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Mostrando: <span className="font-semibold">{filteredLeads.length}</span> de <span className="font-semibold">{linkedinLeads.length}</span> leads
              </div>
              <button
                onClick={() => {
                  setFilter('all');
                  setPhantomFilter('all');
                  setConnectionFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* LinkedIn Leads Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                ⏳ Cargando prospects de LinkedIn...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No se encontraron prospects de LinkedIn
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
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IA Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clasificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phantom Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conexión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {lead.company_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.industry}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-bold ${getScoreColor(lead.ai_score)}`}>
                            {lead.ai_score}/5
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassificationColor(lead.ai_classification)}`}>
                            {lead.ai_classification}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPhantomStatusColor(lead.phantom_status)}`}>
                            {lead.phantom_status || 'En Cola'}
                          </span>
                          {lead.dm_sent_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(lead.dm_sent_at).toLocaleDateString('es-CL')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConnectionStatusColor(lead.connection_status)}`}>
                            {lead.connection_status || 'No Conectado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <a
                              href={lead.linkedin_profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Ver LinkedIn
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
