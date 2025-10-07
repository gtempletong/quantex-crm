# Configuración de Variables de Entorno

Para que el CRM funcione, necesitas configurar las variables de entorno de Supabase.

## Configuración Local

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
# URL de tu proyecto Supabase
SUPABASE_URL=https://znyirqvxnexqgsjwloyg.supabase.co

# Clave de servicio (service role key)
SUPABASE_KEY=tu-service-key-aqui
```

## Dónde obtener las credenciales

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **SUPABASE_URL**: Project URL
   - **SUPABASE_KEY**: service_role key

## Configuración en Vercel

Cuando despliegues a Vercel, agrega las mismas variables en:

**Project Settings** → **Environment Variables**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (opcional)

✅ Listo para usar!

