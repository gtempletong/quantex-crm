'use client';

import { useState, useEffect } from 'react';

interface Prospect {
  id?: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  linkedin_url: string | null;
  company_name: string | null;
  website_company: string | null;
  seniority: string | null;
  ai_classification: string | null;
  ai_score: number | null;
  ai_justification: string | null;
  // Company classification fields
  company_ai_classification?: string | null;
  company_ai_score?: number | null;
  // Outreach tracking fields
  email_sent: boolean;
  email_sent_at: string | null;
  linkedin_invite_sent: boolean;
  linkedin_invite_sent_at: string | null;
}

interface ProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect?: Prospect | null;
  onSave: (prospect: Prospect) => void;
  mode: 'create' | 'edit';
}

export default function ProspectModal({ isOpen, onClose, prospect, onSave, mode }: ProspectModalProps) {
  const [formData, setFormData] = useState<Prospect>({
    full_name: '',
    email: '',
    phone: '',
    title: '',
    linkedin_url: '',
    company_name: '',
    website_company: '',
    seniority: '',
    ai_classification: 'REVISAR',
    ai_score: null,
    ai_justification: '',
    company_ai_classification: 'REVISAR',
    company_ai_score: null,
    email_sent: false,
    email_sent_at: null,
    linkedin_invite_sent: false,
    linkedin_invite_sent_at: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or prospect changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && prospect) {
        setFormData({
          id: prospect.id,
          full_name: prospect.full_name || '',
          email: prospect.email || '',
          phone: prospect.phone || '',
          title: prospect.title || '',
          linkedin_url: prospect.linkedin_url || '',
          company_name: prospect.company_name || '',
          website_company: prospect.website_company || '',
          seniority: prospect.seniority || '',
          ai_classification: prospect.ai_classification || 'REVISAR',
          ai_score: prospect.ai_score || null,
          ai_justification: prospect.ai_justification || '',
          company_ai_classification: (prospect as any).company_ai_classification || 'REVISAR',
          company_ai_score: (prospect as any).company_ai_score || null,
          email_sent: prospect.email_sent || false,
          email_sent_at: prospect.email_sent_at || null,
          linkedin_invite_sent: prospect.linkedin_invite_sent || false,
          linkedin_invite_sent_at: prospect.linkedin_invite_sent_at || null,
        });
      } else {
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          title: '',
          linkedin_url: '',
          company_name: '',
          website_company: '',
          seniority: '',
          ai_classification: 'REVISAR',
          ai_score: null,
          ai_justification: '',
          company_ai_classification: 'REVISAR',
          company_ai_score: null,
          email_sent: false,
          email_sent_at: null,
          linkedin_invite_sent: false,
          linkedin_invite_sent_at: null,
        });
      }
      setError(null);
    }
  }, [isOpen, mode, prospect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        title: formData.title || null,
        linkedin_url: formData.linkedin_url || null,
        company_name: formData.company_name || null,
        website_company: formData.website_company || null,
        seniority: formData.seniority || null,
        ai_score: formData.ai_score || null,
        ai_justification: formData.ai_justification || null,
        company_ai_score: formData.company_ai_score || null,
        email_sent: formData.email_sent,
        email_sent_at: formData.email_sent_at,
        linkedin_invite_sent: formData.linkedin_invite_sent,
        linkedin_invite_sent_at: formData.linkedin_invite_sent_at,
      };

      const url = mode === 'create' ? '/api/prospects' : `/api/prospects/${prospect?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar prospect');
      }

      onSave(result.prospect);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Prospect, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Nuevo Prospect' : 'Editar Prospect'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información Personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url || ''}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Información Profesional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.company_name || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website Empresa
                </label>
                <input
                  type="url"
                  value={formData.website_company || ''}
                  onChange={(e) => handleChange('website_company', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seniority
                </label>
                <select
                  value={formData.seniority || ''}
                  onChange={(e) => handleChange('seniority', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clasificación IA (Persona)
                </label>
                <select
                  value={formData.ai_classification || 'REVISAR'}
                  onChange={(e) => handleChange('ai_classification', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="INCLUIR">INCLUIR</option>
                  <option value="REVISAR">REVISAR</option>
                  <option value="EXCLUIR">EXCLUIR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clasificación IA (Empresa)
                </label>
                <select
                  value={formData.company_ai_classification || 'REVISAR'}
                  onChange={(e) => handleChange('company_ai_classification', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="INCLUIR">INCLUIR</option>
                  <option value="REVISAR">REVISAR</option>
                  <option value="EXCLUIR">EXCLUIR</option>
                </select>
              </div>
            </div>

            {/* Score y Justificación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score IA Persona (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.ai_score || ''}
                  onChange={(e) => handleChange('ai_score', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score IA Empresa (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.company_ai_score || ''}
                  onChange={(e) => handleChange('company_ai_score', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justificación IA
              </label>
              <textarea
                value={formData.ai_justification || ''}
                onChange={(e) => handleChange('ai_justification', e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explicación del análisis de IA..."
              />
            </div>

            {/* Outreach Tracking */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Seguimiento de Outreach</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Enviado
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.email_sent}
                        onChange={(e) => handleChange('email_sent', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Marcar como enviado</span>
                    </label>
                  </div>
                  {formData.email_sent && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Envío
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.email_sent_at ? new Date(formData.email_sent_at).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleChange('email_sent_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn DM Enviado
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.linkedin_invite_sent}
                        onChange={(e) => handleChange('linkedin_invite_sent', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Marcar como enviado</span>
                    </label>
                  </div>
                  {formData.linkedin_invite_sent && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Envío
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.linkedin_invite_sent_at ? new Date(formData.linkedin_invite_sent_at).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleChange('linkedin_invite_sent_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (mode === 'create' ? 'Crear' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
