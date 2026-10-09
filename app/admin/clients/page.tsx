'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { NoDeleteBadge } from '@/components/admin/badges';

interface Client {
  id: string;
  name: string;
  nit: string | null;
  email: string | null;
  licenses: any[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nit?.includes(search) ?? false)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <Link href="/admin/clients/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
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
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">NIT</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Licencias</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {filtered.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="py-3 text-white">{client.name}</td>
                      <td className="py-3 text-slate-300">{client.nit || '-'}</td>
                      <td className="py-3 text-slate-300">{client.email || '-'}</td>
                      <td className="py-3 text-slate-300">{client.licenses.length}</td>
                      <td className="py-3 space-x-2 flex items-center gap-2">
                        <Link href={`/admin/clients/${client.id}`}>
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
            <div className="text-slate-400 py-8 text-center">
              No hay clientes registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
