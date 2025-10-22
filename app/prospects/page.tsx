'use client';

import { useState, useEffect, useCallback } from 'react';
import ProspectModal from '@/components/ProspectModal';

interface ApolloProspect {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  linkedin_url: string | null;
  company_id: string | null;
  company_name: string | null;
  seniority: string | null;
  linkedin_invite_sent: boolean;
  linkedin_invite_sent_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  ai_classification: string | null;
  ai_score: number | null;
  ai_justification: string | null;
  ai_analyzed_at: string | null;
  stage: string | null;
  created_at: string;
  updated_at: string;
  apollo_companies?: {
    website: string | null;
    ai_analysis_report: string | null;
    ai_score: number | null;
    ai_classification: string | null;
  };
  // Temporary field for modal editing
  website_company?: string | null;
}

interface ProspectStats {
  total: number;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<ApolloProspect[]>([]);
  const [stats, setStats] = useState<ProspectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProspect, setEditingProspect] = useState<ApolloProspect | null>(null);
  
  // Sorting states
  const [sortBy, setSortBy] = useState<'name' | 'ai_score' | 'ai_classification' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Filter states
  const [filterBy, setFilterBy] = useState<'all' | 'has_email' | 'has_linkedin' | 'has_both' | 'has_neither'>('all');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'prospects' | 'active_contacts'>('prospects');

  // Fetch prospects
  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/prospects?${params.toString()}`);
      const data = await response.json();

      console.log('API Response:', data); // DEBUG
      console.log('Prospects count:', data.prospects?.length); // DEBUG

      if (data.success) {
        setProspects(data.prospects);
        setStats(data.stats);
      } else {
        console.error('API returned error:', data.error); // DEBUG
      }
    } catch (error) {
      console.error('Error fetching prospects:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // Selección de filas
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === prospects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prospects.map(p => p.id));
    }
  };

  // Modal handlers
  const handleCreateProspect = () => {
    setModalMode('create');
    setEditingProspect(null);
    setIsModalOpen(true);
  };

  const handleEditProspect = (prospect: ApolloProspect) => {
    setModalMode('edit');
    // Include the website from apollo_companies in the prospect data
    const prospectWithWebsite = {
      ...prospect,
      website_company: prospect.apollo_companies?.website || null
    };
    setEditingProspect(prospectWithWebsite);
    setIsModalOpen(true);
  };

  const handleDeleteProspect = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este prospect?')) {
      return;
    }

    try {
      const response = await fetch(`/api/prospects/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar prospect');
      }

      // Refresh the list
      fetchProspects();
    } catch (error) {
      console.error('Error deleting prospect:', error);
      alert('Error al eliminar prospect');
    }
  };

  const handleSaveProspect = (savedProspect: ApolloProspect) => {
    if (modalMode === 'create') {
      setProspects(prev => [savedProspect, ...prev]);
    } else {
      setProspects(prev => prev.map(p => p.id === savedProspect.id ? savedProspect : p));
    }
    setIsModalOpen(false);
  };

  // Mark as Active Contact
  const handleMarkAsActive = async (prospectId: string) => {
    if (!confirm('¿Marcar este prospect como Active Contact?')) return;
    
    try {
      const response = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'active_contact' })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar prospect');
      }

      // Refresh prospects
      await fetchProspects();
      alert('✅ Prospect movido a Active Contacts!');
    } catch (error) {
      console.error('Error marking as active:', error);
      alert('Error al marcar como Active Contact');
    }
  };

  // Move back to Prospects
  const handleMarkAsProspect = async (prospectId: string) => {
    if (!confirm('¿Mover de vuelta a Prospects?')) return;
    
    try {
      const response = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'prospect' })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar prospect');
      }

      // Refresh prospects
      await fetchProspects();
      alert('✅ Movido de vuelta a Prospects!');
    } catch (error) {
      console.error('Error moving back:', error);
      alert('Error al mover a Prospects');
    }
  };

  // Sorting functions
  const handleSort = (field: 'name' | 'ai_score' | 'ai_classification') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getFilteredProspects = () => {
    // First filter by tab (stage)
    const stageFiltered = activeTab === 'prospects'
      ? prospects.filter(p => !p.stage || p.stage === 'prospect')
      : prospects.filter(p => p.stage === 'active_contact');
    
    // Then apply contact filters
    if (filterBy === 'all') return stageFiltered;

    return stageFiltered.filter(prospect => {
      const hasEmail = !!prospect.email;
      const hasLinkedIn = !!prospect.linkedin_url;

      switch (filterBy) {
        case 'has_email':
          return hasEmail;
        case 'has_linkedin':
          return hasLinkedIn;
        case 'has_both':
          return hasEmail && hasLinkedIn;
        case 'has_neither':
          return !hasEmail && !hasLinkedIn;
        default:
          return true;
      }
    });
  };

  const getSortedProspects = () => {
    const filteredProspects = getFilteredProspects();
    if (!sortBy) return filteredProspects;

    return [...filteredProspects].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'ai_score':
          aValue = a.ai_score || 0;
          bValue = b.ai_score || 0;
          break;
        case 'ai_classification':
          // Order: INCLUIR > REVISAR > EXCLUIR
          const classificationOrder = { 'INCLUIR': 3, 'REVISAR': 2, 'EXCLUIR': 1 };
          aValue = classificationOrder[a.ai_classification as keyof typeof classificationOrder] || 0;
          bValue = classificationOrder[b.ai_classification as keyof typeof classificationOrder] || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Helper para determinar colores de estado
  const getConnectionStatusColor = (status: string | null) => {
    switch (status) {
      case 'conectado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhantomStatusColor = (status: string | null) => {
    switch (status) {
      case 'solicitud_enviada': return 'bg-blue-100 text-blue-800';
      case 'en_cola': return 'bg-yellow-100 text-yellow-800';
      case 'completado': return 'bg-green-100 text-green-800';
      case 'fallido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAIClassificationColor = (classification: string | null) => {
    switch (classification) {
      case 'INCLUIR': return 'bg-green-100 text-green-800';
      case 'REVISAR': return 'bg-yellow-100 text-yellow-800';
      case 'EXCLUIR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Prospects</h1>
            <p className="text-gray-600">Prospects calificados (LinkedIn) + Prospects con email (Apollo.io)</p>
          </div>
          <button
            onClick={handleCreateProspect}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            + Nuevo Prospect
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('prospects')}
              className={`${
                activeTab === 'prospects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              📋 Prospects
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'prospects' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {prospects.filter(p => !p.stage || p.stage === 'prospect').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('active_contacts')}
              className={`${
                activeTab === 'active_contacts'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              ✅ Active Contacts
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'active_contacts' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {prospects.filter(p => p.stage === 'active_contact').length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email o empresa..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-2 text-sm text-gray-600">
          Mostrando: <span className="font-semibold">{getSortedProspects().length}</span> prospects
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Filtrar por canal:</span>
          <button
            onClick={() => setFilterBy('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterBy === 'all' 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Todos ({prospects.length})
          </button>
          <button
            onClick={() => setFilterBy('has_email')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterBy === 'has_email' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📧 Con Email ({prospects.filter(p => p.email).length})
          </button>
          <button
            onClick={() => setFilterBy('has_linkedin')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterBy === 'has_linkedin' 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔗 Con LinkedIn ({prospects.filter(p => p.linkedin_url).length})
          </button>
          <button
            onClick={() => setFilterBy('has_both')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterBy === 'has_both' 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 Ambos ({prospects.filter(p => p.email && p.linkedin_url).length})
          </button>
          <button
            onClick={() => setFilterBy('has_neither')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterBy === 'has_neither' 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ❌ Sin Contacto ({prospects.filter(p => !p.email && !p.linkedin_url).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            ⏳ Cargando prospects...
          </div>
        ) : prospects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No se encontraron prospects calificados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      aria-label="Seleccionar todos" 
                      checked={prospects.length > 0 && selectedIds.length === prospects.length} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>Nombre / Empresa</span>
                      <button
                        onClick={() => handleSort('name')}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                        title={`Ordenar por nombre ${sortBy === 'name' ? (sortOrder === 'asc' ? '↓' : '↑') : '↕'}`}
                      >
                        {sortBy === 'name' ? (sortOrder === 'asc' ? '↓' : '↑') : '↕'}
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LinkedIn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>IA Score</span>
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleSort('ai_score')}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          title={`Ordenar por score ${sortBy === 'ai_score' ? (sortOrder === 'asc' ? '↓' : '↑') : '↕'}`}
                        >
                          {sortBy === 'ai_score' ? (sortOrder === 'asc' ? '↓' : '↑') : '↕'}
                        </button>
                        <button
                          onClick={() => handleSort('ai_classification')}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          title={`Ordenar por clasificación ${sortBy === 'ai_classification' ? (sortOrder === 'asc' ? '↓' : '↑') : '↕'}`}
                        >
                          {sortBy === 'ai_classification' ? (sortOrder === 'asc' ? '↓' : '↑') : '↕'}
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Análisis IA Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedProspects().map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(prospect.id)} 
                        onChange={() => toggleSelect(prospect.id)} 
                        aria-label={`Seleccionar ${prospect.full_name}`} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {prospect.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prospect.title || '-'}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mt-1">
                        {prospect.company_name}
                      </div>
                      {prospect.seniority && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {prospect.seniority}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prospect.linkedin_invite_sent ? (
                        <span className="text-xs font-medium text-green-600">✓ Enviado</span>
                      ) : (
                        <span className="text-xs text-gray-400">⏳ Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prospect.email_sent ? (
                        <span className="text-xs font-medium text-green-600">✓ Enviado</span>
                      ) : (
                        <span className="text-xs text-gray-400">⏳ Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {prospect.ai_classification && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAIClassificationColor(prospect.ai_classification)}`}>
                            {prospect.ai_classification}
                          </span>
                        )}
                        {prospect.ai_score !== null && (
                          <span className="text-xs text-gray-600">
                            Score: {prospect.ai_score}/100
                          </span>
                        )}
                        {prospect.ai_analyzed_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(prospect.ai_analyzed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-lg">
                        {prospect.apollo_companies?.ai_analysis_report ? (
                          <div className="space-y-2">
                            {/* Header with company classification */}
                            {prospect.apollo_companies.ai_classification && (
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAIClassificationColor(prospect.apollo_companies.ai_classification)}`}>
                                  🏢 {prospect.apollo_companies.ai_classification}
                                </span>
                                {prospect.apollo_companies.ai_score !== null && (
                                  <span className="text-xs font-semibold text-gray-700">
                                    {prospect.apollo_companies.ai_score}/100
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Analysis report in a scrollable box */}
                            <details className="group">
                              <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 list-none flex items-center space-x-1">
                                <span className="group-open:hidden">📄 Ver análisis completo →</span>
                                <span className="hidden group-open:inline">📄 Ocultar análisis ↑</span>
                              </summary>
                              <div className="mt-2 text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                {prospect.apollo_companies.ai_analysis_report}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400 italic">⚠️ Sin análisis disponible</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        {/* Action buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditProspect(prospect)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            title="Editar"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProspect(prospect.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                            title="Eliminar"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                        
                        {/* Stage change button */}
                        <div>
                          {activeTab === 'prospects' ? (
                            <button
                              onClick={() => handleMarkAsActive(prospect.id)}
                              className="text-green-600 hover:text-green-800 text-xs font-medium"
                              title="Marcar como Active Contact"
                            >
                              ✅ Mark as Active
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsProspect(prospect.id)}
                              className="text-orange-600 hover:text-orange-800 text-xs font-medium"
                              title="Mover de vuelta a Prospects"
                            >
                              ↩️ Move to Prospects
                            </button>
                          )}
                        </div>
                        
                        {/* Contact links */}
                        <div className="flex space-x-2">
                          {prospect.apollo_companies?.website && (
                            <a
                              href={prospect.apollo_companies.website.startsWith('http') 
                                ? prospect.apollo_companies.website 
                                : `https://${prospect.apollo_companies.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-800 text-xs font-medium"
                              title="Ver Website"
                            >
                              🌐 Website
                            </a>
                          )}
                          {prospect.linkedin_url && (
                            <a
                              href={prospect.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              title="Ver LinkedIn"
                            >
                              🔗 LinkedIn
                            </a>
                          )}
                          {prospect.email && (
                            <a
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${prospect.email}&su=&body=&bcc=&cc=&from=gavintempleton@gavintempleton.net`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 text-xs font-medium"
                              title="Enviar Email desde Gmail"
                            >
                              📧 Email
                            </a>
                          )}
                          {prospect.phone && (
                            <a
                              href={`https://wa.me/${prospect.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                              title="WhatsApp"
                            >
                              📞 WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ProspectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prospect={editingProspect}
        onSave={handleSaveProspect}
        mode={modalMode}
      />
    </div>
  );
}
