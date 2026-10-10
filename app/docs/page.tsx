'use client';

import { useEffect, useRef, useState } from 'react';

type ScalarInstance = {
  destroy: () => void;
};

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    let scalarInstance: ScalarInstance | undefined;
    let script = document.getElementById('scalar-api-reference-script') as HTMLScriptElement | null;

    const initializeScalar = () => {
      if (!isMounted || !window.Scalar) return;

      scalarInstance = window.Scalar.createApiReference(container, {
        url: '/openapi.json',
        theme: 'deepSpace',
      });
    };

    const handleScriptError = () => {
      if (isMounted) setLoadError(true);
    };

    if (window.Scalar) {
      initializeScalar();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.id = 'scalar-api-reference-script';
        script.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.73.1';
        script.async = true;
      }

      script.addEventListener('load', initializeScalar);
      script.addEventListener('error', handleScriptError);
      if (!script.isConnected) document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
      script?.removeEventListener('load', initializeScalar);
      script?.removeEventListener('error', handleScriptError);
      scalarInstance?.destroy();
    };
  }, []);

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center text-slate-700">
        No se pudo cargar Scalar. Verifica tu conexión e intenta recargar la página.
      </main>
    );
  }

  return <main ref={containerRef} className="min-h-screen w-full" />;
}
