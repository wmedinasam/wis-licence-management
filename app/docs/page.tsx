'use client';

import { useEffect, useRef, useState } from 'react';

type ScalarInstance = {
  destroy: () => void;
};

type DemoToken = {
  valid: boolean;
  demo: true;
  expiresAt: string;
  licenseToken: string;
  message: string;
};

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [demoToken, setDemoToken] = useState<DemoToken | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDemoToken = async () => {
    setIsGenerating(true);
    setDemoError(null);

    try {
      const response = await fetch('/api/licenses/demo-token', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'No se pudo generar el token de demostración.');
      }

      setDemoToken(result as DemoToken);
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : 'Error inesperado al generar el token.');
    } finally {
      setIsGenerating(false);
    }
  };

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

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-900 px-6 py-5 text-slate-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Token de demostración</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Genera un valor ficticio para explorar la documentación sin iniciar sesión. No es un JWT
              válido y no funciona con la API real ni con licencias de producción.
            </p>
          </div>
          <button
            type="button"
            onClick={generateDemoToken}
            disabled={isGenerating}
            className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            {isGenerating ? 'Generando...' : 'Generar token de prueba'}
          </button>
        </div>
        {demoToken && (
          <div className="mx-auto mt-4 max-w-5xl rounded-md border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs text-slate-400">Token de demostración (no válido para producción)</p>
            <code className="mt-2 block break-all text-sm text-emerald-300">{demoToken.licenseToken}</code>
            <p className="mt-2 text-xs text-slate-400">{demoToken.message}</p>
          </div>
        )}
        {demoError && (
          <p role="alert" className="mx-auto mt-3 max-w-5xl text-sm text-red-300">
            {demoError}
          </p>
        )}
      </section>
      <div ref={containerRef} className="min-h-screen w-full" />
    </main>
  );
}
