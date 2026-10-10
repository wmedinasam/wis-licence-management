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

const formSchema = z.object({
  clientId: z.string().uuid('Cliente requerido'),
  applicationId: z.string().uuid('Aplicación requerida'),
  isLifetime: z.boolean().default(false),
  dateOnly: z.string().optional(),
  hardwareId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewLicensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isLifetime: false,
    }
  });

  const isLifetime = watch('isLifetime');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, appsRes] = await Promise.all([
          fetch('/api/admin/clients'),
          fetch('/api/admin/applications'),
        ]);
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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Convertir fecha simple (YYYY-MM-DD) a ISO datetime al final del día (23:59:59) solo si no es lifetime
      const expiresAt = data.isLifetime 
        ? null 
        : new Date(`${data.dateOnly}T23:59:59.000Z`).toISOString();

      const idempotencyKey = typeof window !== 'undefined' && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : Math.random().toString();

      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          clientId: data.clientId,
          applicationId: data.applicationId,
          expiresAt,
          hardwareId: data.hardwareId || null,
          isActive: true,
        }),
      });

      if (res.ok) {
        toast.success('Licencia creada exitosamente');
        router.push('/admin/licenses');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear licencia');
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

      <Card className="max-w-2xl bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Crear Licencia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="clientId" className="text-slate-300">Cliente *</Label>
              <select
                id="clientId"
                {...register('clientId')}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nit ? `(NIT: ${c.nit})` : ''}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-400 text-sm mt-1">{errors.clientId.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="applicationId" className="text-slate-300">Aplicación *</Label>
              <select
                id="applicationId"
                {...register('applicationId')}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
              >
                <option value="">Seleccionar aplicación...</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
              {errors.applicationId && <p className="text-red-400 text-sm mt-1">{errors.applicationId.message as string}</p>}
            </div>

            <div>
              <Label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  {...register('isLifetime')}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                Licencia Vitalicia (Lifetime)
              </Label>
            </div>

            {!isLifetime && (
              <div>
                <Label htmlFor="dateOnly" className="text-slate-300">Fecha de Expiración (Día/Mes/Año) *</Label>
                <Input
                  id="dateOnly"
                  type="date"
                  {...register('dateOnly')}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
                {errors.dateOnly && <p className="text-red-400 text-sm mt-1">{errors.dateOnly.message as string}</p>}
              </div>
            )}

            <div>
              <Label htmlFor="hardwareId" className="text-slate-300">ID Hardware (Opcional)</Label>
              <Input
                id="hardwareId"
                {...register('hardwareId')}
                placeholder="PC-001, SERVER-001, etc."
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Creando...' : 'Crear Licencia'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
