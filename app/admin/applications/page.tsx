'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { NoDeleteBadge } from '@/components/admin/badges';

interface Application {
  id: string;
  code: string;
  name: string;
  licenses: any[];
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch('/api/admin/applications');
        const data = await res.json();
        setApps(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const filtered = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Aplicaciones</h1>
        <Link href="/admin/applications/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Aplicación
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-400">Cargando...</div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr className="text-left text-slate-400">
                    <th className="pb-3 font-medium">Código</th>
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Licencias</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr key={app.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 text-white font-mono">{app.code}</td>
                      <td className="py-3 text-slate-300">{app.name}</td>
                      <td className="py-3 text-slate-300">{app.licenses.length}</td>
                      <td className="py-3 flex items-center gap-2">
                        <Link href={`/admin/applications/${app.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <NoDeleteBadge />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-slate-400 py-8 text-center">No hay aplicaciones</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
