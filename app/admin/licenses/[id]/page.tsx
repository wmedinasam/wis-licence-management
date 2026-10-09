'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const licenseSchema = z.object({
  expiresAt: z.string().datetime(),
  isActive: z.boolean(),
  hardwareId: z.string().optional(),
});

type LicenseFormData = z.infer<typeof licenseSchema>;

export default function EditLicensePage() {
  const router = useRouter();
  const params = useParams();
  const licenseId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [license, setLicense] = useState<any>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema),
  });

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const res = await fetch(`/api/admin/licenses/${licenseId}`);
        if (res.ok) {
          const data = await res.json();
          setLicense(data);
          reset({
            expiresAt: new Date(data.expiresAt).toISOString().slice(0, 16),
            isActive: data.isActive,
            hardwareId: data.hardwareId || '',
          });
        }
      } catch (error) {
        toast.error('Error al cargar licencia');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchLicense();
  }, [licenseId, reset]);

  const onSubmit = async (data: LicenseFormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Licencia actualizada');
        router.push('/admin/licenses');
      } else {
        toast.error('Error al actualizar');
      }
    } catch (error) {
      toast.error('Error al actualizar licencia');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="text-slate-400">Cargando...</div>;

  if (!license) return <div className="text-red-500">Licencia no encontrada</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Editar Licencia</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-slate-400">Cliente</p>
                <p className="text-white font-medium">{license.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Aplicación</p>
                <p className="text-white font-medium">{license.application.name}</p>
              </div>
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
              <Label htmlFor="hardwareId">ID Hardware</Label>
              <Input
                id="hardwareId"
                {...register('hardwareId')}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                className="rounded"
              />
              <Label htmlFor="isActive" className="mb-0">Licencia Activa</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
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
