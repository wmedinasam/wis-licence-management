'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  totalApplications: number;
  activeLicenses: number;
  expiredLicenses: number;
  expiringSoonLicenses: number;
  recentLicenses: any[];
  expiringSoonDetails: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsRes, appsRes, licensesRes] = await Promise.all([
          fetch('/api/admin/clients'),
          fetch('/api/admin/applications'),
          fetch('/api/admin/licenses'),
        ]);

        const clients = await clientsRes.json();
        const applications = await appsRes.json();
        const licenses = await licensesRes.json();

        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const activeLicenses = licenses.filter(
          (l: any) => l.isActive && l.expiresAt > now
        );
        const expiredLicenses = licenses.filter(
          (l: any) => l.expiresAt <= now
        );
        const expiringSoonLicenses = licenses.filter(
          (l: any) =>
            l.isActive &&
            l.expiresAt > now &&
            l.expiresAt <= thirtyDaysFromNow
        );

        setStats({
          totalClients: clients.length,
          totalApplications: applications.length,
          activeLicenses: activeLicenses.length,
          expiredLicenses: expiredLicenses.length,
          expiringSoonLicenses: expiringSoonLicenses.length,
          recentLicenses: licenses.slice(0, 5),
          expiringSoonDetails: expiringSoonLicenses.slice(0, 5),
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="text-slate-400">Cargando estadísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="text-red-500">Error al cargar estadísticas</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalClients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Aplicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalApplications}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Licencias Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.activeLicenses}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Licencias Expiradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.expiredLicenses}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.expiringSoonLicenses > 0 && (
        <Card className="border-yellow-600 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="h-5 w-5" />
              {stats.expiringSoonLicenses} Licencias por Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.expiringSoonDetails.map((license) => (
                <div key={license.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {license.client.name} - {license.application.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Expira en {license.daysUntilExpiration} días
                    </p>
                  </div>
                  <Link href={`/admin/licenses/${license.id}`}>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Licenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Últimas Licencias
            </CardTitle>
            <Link href="/admin/licenses">
              <Button variant="ghost" size="sm">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentLicenses.length > 0 ? (
              stats.recentLicenses.map((license) => (
                <div key={license.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {license.client.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {license.application.name} • Expira:{' '}
                      {new Date(license.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      license.isActive
                        ? 'bg-green-900 text-green-200'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {license.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Sin licencias registradas</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/admin/clients/new">
          <Button className="w-full" variant="secondary">
            Nuevo Cliente
          </Button>
        </Link>
        <Link href="/admin/applications/new">
          <Button className="w-full" variant="secondary">
            Nueva Aplicación
          </Button>
        </Link>
        <Link href="/admin/licenses/new">
          <Button className="w-full" variant="secondary">
            Nueva Licencia
          </Button>
        </Link>
      </div>
    </div>
  );
}
