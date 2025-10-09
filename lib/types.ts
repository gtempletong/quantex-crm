/**
 * Tipos TypeScript para el CRM
 */

export interface Contact {
  id: number;
  nombre_contacto: string;
  email_contacto: string | null;
  cargo_contacto: string | null;
  celular_contacto: string | null;
  telefono_contacto: string | null;
  rut_empresa: string;
  razon_social?: string;
  region_number?: number | null;
  region_label?: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  estado: string | null;
  tipo_empresa: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  rut_empresa: string;
  razon_social: string;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
}

export interface EmailMessage {
  id: string;
  direction: 'sent' | 'received';
  contact_id: number | null;
  company_id: string | null;
  from_email: string;
  to_emails: string[];
  subject: string;
  body_html: string | null;
  body_text: string | null;
  message_id: string | null;
  sent_at: string | null;
  received_at: string | null;
  message_kind: string | null;
  created_at: string;
}

export type ContactStatus = 'activo' | 'contactado' | 'negociacion' | 'cerrado' | 'descartado';

export interface ActiveContact {
  id: string;
  full_name: string | null;
  email: string | null; // Ahora puede ser null
  phone: string | null; // Teléfono del contacto
  linkedin_url: string | null;
  company_name: string | null;
  region: number | null;
  source: 'cliente' | 'prospecto' | 'otro';
  notes: string | null;
  tags: string[] | null;
  can_receive_communications: boolean;
  last_communication_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

