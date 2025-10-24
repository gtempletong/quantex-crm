'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Mail, AtSign, Linkedin, Users, X } from 'lucide-react';
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
  const [stats, setStats] = useState({
    totalContacts: 0,
    canReceive: 0,
    clients: 0,
    prospects: 0,
    withEmail: 0,
    withLinkedIn: 0,
    withBoth: 0
  });
  
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
    title: '',
    linkedin_url: '',
    company_name: '',
    website_company: '',
  });

  // Email modal states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContact, setEmailContact] = useState<ActiveContact | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const emailBodyRef = useRef<HTMLDivElement>(null);

  // AI Analysis modal states
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiAnalysisContact, setAIAnalysisContact] = useState<ActiveContact | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/active-contacts/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

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
    fetchStats();
    fetchContacts();
  }, [fetchStats, fetchContacts]);

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
        title: contact.title || '',
        linkedin_url: contact.linkedin_url || '',
        company_name: contact.company_name || '',
        website_company: (contact as any).apollo_companies?.website || '',
      });
    } else {
      setEditingContact(null);
      setModalForm({
        full_name: '',
        email: '',
        phone: '',
        title: '',
        linkedin_url: '',
        company_name: '',
        website_company: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  // Email modal handlers
  const handleOpenEmailModal = (contact: ActiveContact) => {
    setEmailContact(contact);
    setEmailSubject('');
    setEmailBody('');
    setEmailAttachments([]);
    setIsEmailModalOpen(true);
    // Limpiar el contenido del editor después de que el modal se abra
    setTimeout(() => {
      if (emailBodyRef.current) {
        emailBodyRef.current.innerHTML = '';
      }
    }, 0);
  };

  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailContact(null);
    setEmailSubject('');
    setEmailBody('');
    setEmailAttachments([]);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEmailAttachments(Array.from(e.target.files));
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatText = (command: string) => {
    document.execCommand(command, false);
  };

  const insertLink = () => {
    const url = prompt('Ingresa la URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  };

  const handleSendEmail = async () => {
    if (!emailContact || !emailContact.email) {
      alert('El contacto no tiene email registrado');
      return;
    }

    // Obtener el contenido del editor
    const bodyContent = emailBodyRef.current?.innerHTML || '';

    if (!emailSubject.trim() || !bodyContent.trim()) {
      alert('Por favor completa el asunto y el mensaje');
      return;
    }

    setSendingEmail(true);

    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('contactId', emailContact.id);
      formData.append('to', emailContact.email);
      formData.append('subject', emailSubject);
      formData.append('body', bodyContent);
      
      // Agregar attachments si existen
      emailAttachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/send-contact-email', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al enviar email');
      }

      alert('✅ Email enviado exitosamente');
      handleCloseEmailModal();
      fetchContacts(); // Refresh para actualizar estado
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Error al enviar email: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSendingEmail(false);
    }
  };

  // AI Analysis modal handlers
  const handleOpenAIModal = (contact: ActiveContact) => {
    setAIAnalysisContact(contact);
    setIsAIModalOpen(true);
  };

  const handleCloseAIModal = () => {
    setIsAIModalOpen(false);
    setAIAnalysisContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = {
        ...modalForm
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
      contact.email
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
      contact.email
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
          report_topic: reportType,  // Enviar el tópico en lugar del HTML
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
    <div className="bg-gray-50 min-h-screen">
      {/* CRM Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
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
                <div className="text-xs text-gray-500">Total Contactos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {contacts.filter(c => c.email).length}
                </div>
                <div className="text-xs text-gray-500">Con Email</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de la página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contactos Activos</h2>
              <p className="text-gray-600 mt-1">
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

          {/* Filtro Método de Contacto */}
          <select
            value={canReceiveFilter}
            onChange={(e) => handleFilterChange('canReceive', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los métodos</option>
            <option value="email">Email</option>
            <option value="linkedin">LinkedIn</option>
            <option value="both">Ambos</option>
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
              <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AtSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Email</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Linkedin className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con LinkedIn</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withLinkedIn}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedForReport.length > 0 && selectedForReport.length === contacts.filter(c => c.email).length}
                        onChange={() => {
                          if (selectedForReport.length === contacts.filter(c => c.email).length) {
                            clearReportSelection();
                          } else {
                            selectAllForReport();
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NOMBRE / EMPRESA
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
                      Website
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Enviado
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
                          disabled={!contact.email}
                          className="rounded border-gray-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.full_name || 'Sin nombre'}
                        </div>
                        {contact.title && (
                          <div className="text-xs text-gray-500 mt-1">
                            {contact.title}
                          </div>
                        )}
                        {contact.company_name && (
                          <div className="text-xs text-blue-600 mt-1">
                            {contact.company_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.email ? (
                          <a 
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}&su=&body=&bcc=&cc=&from=gavintempleton@gavintempleton.net`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                            title="Enviar email desde Gmail"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin email</span>
                        )}
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
                        {contact.apollo_companies?.website ? (
                          <a 
                            href={contact.apollo_companies.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                          >
                            <span>🌐</span>
                            <span>Ver sitio</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.last_email_sent_at ? (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600" title="Email enviado">✅</span>
                              <span className="text-xs text-gray-600 font-medium">
                                {new Date(contact.last_email_sent_at).toLocaleDateString('es-CL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(contact.last_email_sent_at).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white">
                        <div className="flex space-x-2">
                          {/* Email */}
                          {contact.email && (
                            <button
                              onClick={() => handleOpenEmailModal(contact)}
                              className="text-green-600 hover:text-green-900"
                              title="Enviar Email"
                            >
                              <Mail size={16} />
                            </button>
                          )}
                          
                          {/* Website */}
                          {(contact as any).apollo_companies?.website && (
                            <a
                              href={(contact as any).apollo_companies.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-900"
                              title="Ver Website"
                            >
                              🌐
                            </a>
                          )}
                          
                          {/* AI Analysis */}
                          {(contact as any).apollo_companies?.ai_analysis_report && (
                            <button
                              onClick={() => handleOpenAIModal(contact)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Ver Análisis AI"
                            >
                              🤖
                            </button>
                          )}
                          
                          <button
                            onClick={() => openModal(contact)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar contacto"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id, contact.email || 'Sin email')}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar contacto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>                    </tr>
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
                      Cargo/Título (opcional)
                    </label>
                    <input
                      type="text"
                      value={modalForm.title || ''}
                      onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="CEO, Director, Gerente, etc."
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
                      Website Empresa
                    </label>
                    <input
                      type="url"
                      value={modalForm.website_company}
                      onChange={(e) => setModalForm(prev => ({ ...prev, website_company: e.target.value }))}
                      placeholder="https://empresa.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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

      {/* Email Modal */}
      {isEmailModalOpen && emailContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Enviar Email
                </h3>
                <button
                  onClick={handleCloseEmailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Recipient Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Para:</span> {emailContact.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {emailContact.email}
                </p>
                {emailContact.company_name && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Empresa:</span> {emailContact.company_name}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Asunto del email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sendingEmail}
                />
              </div>

              {/* Body with Formatting Toolbar */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                
                {/* Formatting Toolbar */}
                <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
                  <button
                    type="button"
                    onClick={() => formatText('bold')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold"
                    disabled={sendingEmail}
                    title="Negrita"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('italic')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm italic"
                    disabled={sendingEmail}
                    title="Cursiva"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('underline')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm underline"
                    disabled={sendingEmail}
                    title="Subrayado"
                  >
                    U
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button
                    type="button"
                    onClick={() => formatText('insertUnorderedList')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                    disabled={sendingEmail}
                    title="Lista"
                  >
                    • Lista
                  </button>
                  <button
                    type="button"
                    onClick={insertLink}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                    disabled={sendingEmail}
                    title="Insertar Link"
                  >
                    🔗 Link
                  </button>
                </div>

                {/* Rich Text Editor */}
                <div
                  ref={emailBodyRef}
                  contentEditable={!sendingEmail}
                  className="w-full min-h-[250px] px-3 py-2 border border-t-0 border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none resize-y overflow-auto bg-white"
                  style={{ maxHeight: '400px' }}
                  spellCheck={true}
                  lang="es"
                  suppressContentEditableWarning={true}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Corrección ortográfica activada (español)
                </p>
              </div>

              {/* Attachments */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjuntos
                </label>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
                    <span>📎 Adjuntar archivo</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentChange}
                      className="hidden"
                      disabled={sendingEmail}
                    />
                  </label>
                  {emailAttachments.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {emailAttachments.length} archivo(s) seleccionado(s)
                    </span>
                  )}
                </div>
                
                {/* Lista de archivos adjuntos */}
                {emailAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {emailAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">📄</span>
                          <span className="text-sm text-gray-800">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={sendingEmail}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* From Info */}
              <div className="mb-4 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Desde:</span> gavintempleton@gavintempleton.net
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseEmailModal}
                  disabled={sendingEmail}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? 'Enviando...' : '📧 Enviar Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {isAIModalOpen && aiAnalysisContact && (aiAnalysisContact as any).apollo_companies && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Análisis AI - {(aiAnalysisContact as any).apollo_companies.name}
                </h3>
                <button
                  onClick={handleCloseAIModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Company Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Empresa</p>
                    <p className="text-base text-gray-900">{(aiAnalysisContact as any).apollo_companies.name}</p>
                  </div>
                  {(aiAnalysisContact as any).apollo_companies.industry && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Industria</p>
                      <p className="text-base text-gray-900">{(aiAnalysisContact as any).apollo_companies.industry}</p>
                    </div>
                  )}
                  {(aiAnalysisContact as any).apollo_companies.ai_classification && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Clasificación AI</p>
                      <p className="text-base text-gray-900">
                        <span className={`px-2 py-1 rounded ${
                          (aiAnalysisContact as any).apollo_companies.ai_classification === 'High Priority' ? 'bg-green-100 text-green-800' :
                          (aiAnalysisContact as any).apollo_companies.ai_classification === 'Medium Priority' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(aiAnalysisContact as any).apollo_companies.ai_classification}
                        </span>
                      </p>
                    </div>
                  )}
                  {(aiAnalysisContact as any).apollo_companies.ai_score && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Score AI</p>
                      <p className="text-base text-gray-900">{(aiAnalysisContact as any).apollo_companies.ai_score}/100</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis Report */}
              <div className="prose max-w-none">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reporte de Análisis</h4>
                <div className="whitespace-pre-wrap text-gray-700 bg-white p-4 border border-gray-200 rounded-lg">
                  {(aiAnalysisContact as any).apollo_companies.ai_analysis_report || 'No hay análisis disponible'}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseAIModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
