# Quantex CRM

Sistema de gestión de contactos y empresas para Quantex Agora.

## ✨ Características

- 📋 **Vista de contactos** - Tabla completa con todos los datos
- 🔍 **Búsqueda** - Por nombre o email
- 🎯 **Filtros** - Por estado y emails enviados
- 📊 **Estados** - Activo, Contactado, Negociación, Cerrado, Descartado
- ⚡ **Rápido** - Next.js 15 + Tailwind CSS
- 🔐 **Seguro** - Supabase backend

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` con tus credenciales de Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Ver [ENV_SETUP.md](./ENV_SETUP.md) para más detalles.

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Tecnologías

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **Supabase** - Backend y base de datos PostgreSQL

## 📁 Estructura

```
quantex-crm/
├── app/
│   ├── api/
│   │   └── contacts/
│   │       └── route.ts      # API endpoint
│   ├── layout.tsx            # Layout principal
│   └── page.tsx              # Dashboard
├── lib/
│   ├── supabase.ts           # Cliente Supabase
│   └── types.ts              # Tipos TypeScript
└── ENV_SETUP.md              # Guía de configuración
```

## 🔧 API Endpoints

### GET /api/contacts

Obtiene lista de contactos.

**Query params:**
- `search` - Buscar por nombre o email
- `estado` - Filtrar por estado
- `emailSent` - Filtrar por emails enviados (true/false)
- `limit` - Límite de resultados (default: 100)

**Ejemplo:**
```
GET /api/contacts?search=Juan&estado=activo&emailSent=false
```

## 🚢 Deploy en Vercel

1. Push a GitHub
2. Conecta el repositorio en Vercel
3. Configura las variables de entorno en Vercel
4. Deploy automático

## 📝 TODO (Futuras mejoras)

- [ ] Crear/Editar/Eliminar contactos
- [ ] Vista de detalle de contacto
- [ ] Historial de emails
- [ ] Gestión de empresas
- [ ] Exportar a CSV/Excel
- [ ] Paginación
- [ ] Gráficos y estadísticas

## 🤝 Contribuir

Este es un proyecto interno de Quantex Agora.

---

Hecho con ❤️ para Quantex
