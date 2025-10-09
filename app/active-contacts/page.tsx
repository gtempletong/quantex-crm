'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Mail, Eye, Users, X } from 'lucide-react';
import { ActiveContact } from '@/lib/types';

interface ActiveContactsResponse {
  success: boolean;
  data: ActiveContact[];
  total: number;
  limit: number;
  offset: number;
}

const REGION_MAP: { [key: number]: string } = {
  1: 'Tarapacá',
  2: 'Antofagasta',
  3: 'Atacama',
  4: 'Coquimbo',
  5: 'Valparaíso',
  6: 'O\'Higgins',
  7: 'Maule',
  8: 'Biobío',
  9: 'La Araucanía',
  10: 'Los Lagos',
  11: 'Aysén',
  12: 'Magallanes',
  13: 'Metropolitana',
  14: 'Los Ríos',
  15: 'Arica y Parinacota',
  16: 'Ñuble'
};

export default function ActiveContactsPage() {
  const [contacts, setContacts] = useState<ActiveContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [canReceiveFilter, setCanReceiveFilter] = useState('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);
  
  // Estados para envío de reportes
  const [sendingReport, setSendingReport] = useState(false);
  const [selectedForReport, setSelectedForReport] = useState<string[]>([]);
  const [reportType, setReportType] = useState<'clp' | 'copper'>('clp');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ActiveContact | null>(null);
  const [modalForm, setModalForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    company_name: '',
    region: '',
    source: 'prospecto' as 'cliente' | 'prospecto' | 'otro',
    notes: '',
    tags: '',
    can_receive_communications: true
  });

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString()
      });

      if (search) params.append('search', search);
      if (sourceFilter !== 'all') params.append('source', sourceFilter);
      if (regionFilter !== 'all') params.append('region', regionFilter);
      if (canReceiveFilter !== 'all') params.append('can_receive', canReceiveFilter);

      const response = await fetch(`/api/active-contacts?${params}`);
      const result: ActiveContactsResponse = await response.json();

      if (result.success) {
        setContacts(result.data);
        setTotal(result.total);
      } else {
        setError('Error obteniendo contactos activos');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, regionFilter, canReceiveFilter, currentPage, limit]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: string, value: string) => {
    switch (filter) {
      case 'source':
        setSourceFilter(value);
        break;
      case 'region':
        setRegionFilter(value);
        break;
      case 'canReceive':
        setCanReceiveFilter(value);
        break;
    }
    setCurrentPage(1);
  };

  const openModal = (contact?: ActiveContact) => {
    if (contact) {
      setEditingContact(contact);
      setModalForm({
        full_name: contact.full_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        linkedin_url: contact.linkedin_url || '',
        company_name: contact.company_name || '',
        region: contact.region?.toString() || '',
        source: contact.source,
        notes: contact.notes || '',
        tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
        can_receive_communications: contact.can_receive_communications
      });
    } else {
      setEditingContact(null);
      setModalForm({
        full_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        company_name: '',
        region: '',
        source: 'prospecto',
        notes: '',
        tags: '',
        can_receive_communications: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = {
        ...modalForm,
        region: modalForm.region ? parseInt(modalForm.region) : null,
        tags: modalForm.tags ? modalForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      const url = editingContact 
        ? `/api/active-contacts/${editingContact.id}`
        : '/api/active-contacts';
      
      const method = editingContact ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        await fetchContacts();
        closeModal();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error saving contact:', err);
      alert('Error guardando contacto');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar el contacto ${email}?`)) return;

    try {
      const response = await fetch(`/api/active-contacts/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchContacts();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert('Error eliminando contacto');
    }
  };

  const toggleReportSelection = (contactId: string) => {
    setSelectedForReport(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllForReport = () => {
    const contactsWithEmail = contacts.filter(contact => 
      contact.email && contact.can_receive_communications
    );
    setSelectedForReport(contactsWithEmail.map(c => c.id));
  };

  const clearReportSelection = () => {
    setSelectedForReport([]);
  };

  const handleSendReport = async () => {
    if (selectedForReport.length === 0) {
      alert('Selecciona al menos un contacto para enviar el reporte');
      return;
    }

    // Filtrar solo los contactos seleccionados que tienen email
    const selectedContacts = contacts.filter(contact => 
      selectedForReport.includes(contact.id) && 
      contact.email && 
      contact.can_receive_communications
    );
    
    if (selectedContacts.length === 0) {
      alert('Los contactos seleccionados no tienen email válido');
      return;
    }

    const reportTypeLabel = reportType === 'clp' ? 'CLP' : 'Cobre';
    if (!confirm(`¿Enviar reporte de ${reportTypeLabel} a ${selectedContacts.length} contactos seleccionados?`)) return;

    try {
      setSendingReport(true);

      // Obtener el último reporte según el tipo seleccionado
      const reportEndpoint = reportType === 'clp' ? '/api/reports/clp' : '/api/reports/copper';
      const reportResponse = await fetch(reportEndpoint);
      const reportResult = await reportResponse.json();

      if (!reportResult.success) {
        throw new Error(reportResult.error || `Error obteniendo reporte de ${reportTypeLabel}`);
      }

      const report = reportResult.data;
      const recipients = selectedContacts.map(contact => contact.email!);

      // Enviar reporte
      const sendResponse = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          report_html: report.full_content,
          subject: report.display_title
        })
      });

      const sendResult = await sendResponse.json();

      if (sendResult.success) {
        const { successful_sends, failed_sends } = sendResult.data;
        alert(`Reporte enviado: ${successful_sends} exitosos, ${failed_sends} fallidos`);
        clearReportSelection(); // Limpiar selección después del envío exitoso
      } else {
        throw new Error(sendResult.error || 'Error enviando reporte');
      }

    } catch (err) {
      console.error('Error sending report:', err);
      alert(`Error enviando reporte: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSendingReport(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contactos Activos</h1>
            <p className="text-gray-600 mt-2">
              Gestiona clientes y prospectos que pueden recibir comunicaciones
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            {/* Selector de tipo de reporte */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Reporte:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'clp' | 'copper')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={sendingReport}
              >
                <option value="clp">Reporte CLP</option>
                <option value="copper">Reporte Cobre</option>
              </select>
            </div>
            
            <button
              onClick={handleSendReport}
              disabled={sendingReport || selectedForReport.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sendingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Mail size={20} />
                  Enviar Reporte {reportType === 'clp' ? 'CLP' : 'Cobre'} {selectedForReport.length > 0 && `(${selectedForReport.length})`}
                </>
              )}
            </button>
            <button
              onClick={selectAllForReport}
              disabled={sendingReport}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Users size={20} />
              Seleccionar Todos
            </button>
            <button
              onClick={clearReportSelection}
              disabled={sendingReport || selectedForReport.length === 0}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <X size={20} />
              Limpiar Selección
            </button>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Nuevo Contacto
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de selección */}
      {selectedForReport.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-blue-800 font-medium">
                {selectedForReport.length} contacto{selectedForReport.length !== 1 ? 's' : ''} seleccionado{selectedForReport.length !== 1 ? 's' : ''} para envío de reporte
              </span>
            </div>
            <button
              onClick={clearReportSelection}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o empresa..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro Source */}
          <select
            value={sourceFilter}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los orígenes</option>
            <option value="cliente">Cliente</option>
            <option value="prospecto">Prospecto</option>
            <option value="otro">Otro</option>
          </select>

          {/* Filtro Región */}
          <select
            value={regionFilter}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las regiones</option>
            {Object.entries(REGION_MAP).map(([num, name]) => (
              <option key={num} value={num}>{name}</option>
            ))}
          </select>

          {/* Filtro Can Receive */}
          <select
            value={canReceiveFilter}
            onChange={(e) => handleFilterChange('canReceive', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="true">Puede recibir</option>
            <option value="false">No puede recibir</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Contactos</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pueden Recibir</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter(c => c.can_receive_communications).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Filter className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter(c => c.source === 'cliente').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando contactos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchContacts}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No se encontraron contactos activos</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectedForReport.length > 0 && selectedForReport.length === contacts.filter(c => c.email && c.can_receive_communications).length}
                        onChange={() => {
                          if (selectedForReport.length === contacts.filter(c => c.email && c.can_receive_communications).length) {
                            clearReportSelection();
                          } else {
                            selectAllForReport();
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LinkedIn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Región
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Comunicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedForReport.includes(contact.id)}
                          onChange={() => toggleReportSelection(contact.id)}
                          disabled={!contact.email || !contact.can_receive_communications}
                          className="rounded border-gray-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.full_name || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.email || 'Sin email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.phone || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.linkedin_url ? (
                          <a 
                            href={contact.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Ver perfil
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.company_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.region ? REGION_MAP[contact.region] || `Región ${contact.region}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.source === 'cliente' 
                            ? 'bg-green-100 text-green-800'
                            : contact.source === 'prospecto'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.can_receive_communications
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {contact.can_receive_communications ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.last_communication_sent_at 
                          ? new Date(contact.last_communication_sent_at).toLocaleDateString('es-CL')
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(contact)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar contacto"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id, contact.email)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar contacto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, total)} de {total} resultados
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingContact ? 'Editar Contacto Activo' : 'Nuevo Contacto Activo'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={modalForm.full_name}
                      onChange={(e) => setModalForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      value={modalForm.email}
                      onChange={(e) => setModalForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ejemplo@empresa.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      value={modalForm.phone}
                      onChange={(e) => setModalForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={modalForm.linkedin_url}
                      onChange={(e) => setModalForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/usuario"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={modalForm.company_name}
                      onChange={(e) => setModalForm(prev => ({ ...prev, company_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Región
                    </label>
                    <select
                      value={modalForm.region}
                      onChange={(e) => setModalForm(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar región</option>
                      {Object.entries(REGION_MAP).map(([num, name]) => (
                        <option key={num} value={num}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origen
                    </label>
                    <select
                      value={modalForm.source}
                      onChange={(e) => setModalForm(prev => ({ ...prev, source: e.target.value as 'cliente' | 'prospecto' | 'otro' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="prospecto">Prospecto</option>
                      <option value="cliente">Cliente</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="can_receive"
                      checked={modalForm.can_receive_communications}
                      onChange={(e) => setModalForm(prev => ({ ...prev, can_receive_communications: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="can_receive" className="ml-2 block text-sm text-gray-700">
                      Puede recibir comunicaciones
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={modalForm.tags}
                    onChange={(e) => setModalForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="ej: vip, newsletter, reportes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={modalForm.notes}
                    onChange={(e) => setModalForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingContact ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
