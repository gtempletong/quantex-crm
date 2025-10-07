# Configuración de Variables de Entorno

Para que el CRM funcione, necesitas configurar las variables de entorno de Supabase.

## Configuración Local

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
# URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Opcional: Service key para operaciones server-side
SUPABASE_SERVICE_KEY=tu-service-key-aqui
```

## Dónde obtener las credenciales

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **URL**: Project URL
   - **ANON_KEY**: anon/public key
   - **SERVICE_KEY**: service_role key (solo para servidor)

## Configuración en Vercel

Cuando despliegues a Vercel, agrega las mismas variables en:

**Project Settings** → **Environment Variables**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (opcional)

✅ Listo para usar!

