'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const licenseSchema = z.object({
  clientId: z.string().uuid('Cliente requerido'),
  applicationId: z.string().uuid('Aplicación requerida'),
  expiresAt: z.string().datetime(),
  hardwareId: z.string().optional(),
});

type LicenseFormData = z.infer<typeof licenseSchema>;

export default function NewLicensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsRes = await fetch('/api/admin/clients');
        const appsRes = await fetch('/api/admin/applications');
        const clientsData = await clientsRes.json();
        const appsData = await appsRes.json();
        setClients(clientsData);
        setApps(appsData);
      } catch (error) {
        toast.error('Error al cargar datos');
      } finally {
        setClientsLoading(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: LicenseFormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': Math.random().toString(),
        },
        body: JSON.stringify({ ...data, isActive: true }),
      });

      if (res.ok) {
        toast.success('Licencia creada exitosamente');
        router.push('/admin/licenses');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear');
      }
    } catch (error) {
      toast.error('Error al crear licencia');
    } finally {
      setLoading(false);
    }
  };

  if (clientsLoading) return <div className="text-slate-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Nueva Licencia</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Crear Licencia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="clientId">Cliente *</Label>
              <select
                id="clientId"
                {...register('clientId')}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.nit || 'Sin NIT'})
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>}
            </div>

            <div>
              <Label htmlFor="applicationId">Aplicación *</Label>
              <select
                id="applicationId"
                {...register('applicationId')}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleccionar aplicación...</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
              {errors.applicationId && <p className="text-red-500 text-sm mt-1">{errors.applicationId.message}</p>}
            </div>

            <div>
              <Label htmlFor="expiresAt">Fecha de Expiración *</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                {...register('expiresAt')}
              />
              {errors.expiresAt && <p className="text-red-500 text-sm mt-1">{errors.expiresAt.message}</p>}
            </div>

            <div>
              <Label htmlFor="hardwareId">ID Hardware (Opcional)</Label>
              <Input
                id="hardwareId"
                {...register('hardwareId')}
                placeholder="PC-001, SERVER-001, etc."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Licencia'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
