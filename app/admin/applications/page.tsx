'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Search, Edit } from 'lucide-react';
import { NoDeleteBadge } from '@/components/admin/badges';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/applications');
      const data = await res.json();
      if (Array.isArray(data)) {
        setApplications(data);
      } else {
        setApplications([]);
        toast.error(data.error || 'Error al cargar aplicaciones');
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Aplicaciones</h1>
          <p className="text-slate-400 mt-1">Gestiona el catálogo de software y productos licenciados</p>
        </div>
        <Link href="/admin/applications/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Aplicación
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Catálogo de Aplicaciones</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando aplicaciones...</div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No se encontraron aplicaciones.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 text-xs uppercase text-slate-400 bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3 text-center">Licencias Asociadas</th>
                    <th className="px-4 py-3 text-center">Seguridad</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-400 font-semibold">{app.code}</td>
                      <td className="px-4 py-3 font-medium text-white">{app.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800">
                          {app._count?.licenses || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <NoDeleteBadge />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/applications/${app.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-slate-800">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
