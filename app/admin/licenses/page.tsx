'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { StatusBadge, NoDeleteBadge } from '@/components/admin/badges';

interface License {
  id: string;
  client: { name: string; nit: string };
  application: { name: string };
  expiresAt: string;
  isActive: boolean;
  hardwareId: string | null;
  daysUntilExpiration: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        let url = '/api/admin/licenses';
        if (statusFilter !== 'all') {
          url += `?status=${statusFilter}`;
        }
        const res = await fetch(url);
        setLicenses(await res.json());
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchLicenses();
  }, [statusFilter]);

  const filtered = licenses.filter((l) =>
    l.client.nit?.includes(search) || l.client.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (license: License): 'active' | 'inactive' | 'expired' | 'expiring_soon' => {
    if (license.isExpired) return 'expired';
    if (!license.isActive) return 'inactive';
    if (license.isExpiringSoon) return 'expiring_soon';
    return 'active';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Licencias</h1>
        <Link href="/admin/licenses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Licencia
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'expired', 'expiring_soon'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' && 'Todas'}
                {status === 'active' && 'Activas'}
                {status === 'expired' && 'Expiradas'}
                {status === 'expiring_soon' && 'Por vencer'}
              </Button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar por NIT o nombre..."
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
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Aplicación</th>
                    <th className="pb-3 font-medium">Expira</th>
                    <th className="pb-3 font-medium">Hardware</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((license) => (
                    <tr key={license.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 text-white">{license.client.name}</td>
                      <td className="py-3 text-slate-300">{license.application.name}</td>
                      <td className="py-3 text-slate-300">
                        {new Date(license.expiresAt).toLocaleDateString()}
                        {license.daysUntilExpiration <= 30 && (
                          <span className="ml-2 text-xs text-yellow-500">({license.daysUntilExpiration}d)</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-300">{license.hardwareId || '-'}</td>
                      <td className="py-3">
                        <StatusBadge status={getStatus(license)} />
                      </td>
                      <td className="py-3 flex gap-2">
                        <Link href={`/admin/licenses/${license.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <NoDeleteBadge tooltip={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-slate-400 py-8 text-center">Sin licencias</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
