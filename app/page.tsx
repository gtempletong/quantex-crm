'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a Active Contacts
    router.push('/active-contacts');
  }, [router]);

  // Mostrar loading mientras redirige
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando Quantex CRM...</p>
      </div>
    </div>
  );
}



