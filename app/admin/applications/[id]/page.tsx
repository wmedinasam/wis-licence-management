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

const appSchema = z.object({
  code: z.string().min(1).regex(/^[A-Z0-9_]+$/),
  name: z.string().min(3),
});

type AppFormData = z.infer<typeof appSchema>;

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AppFormData>({
    resolver: zodResolver(appSchema),
  });

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/admin/applications/${appId}`);
        if (res.ok) {
          reset(await res.json());
        }
      } catch (error) {
        toast.error('Error al cargar');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchApp();
  }, [appId, reset]);

  const onSubmit = async (data: AppFormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Actualizado');
        router.push('/admin/applications');
      } else {
        toast.error('Error');
      }
    } catch (error) {
      toast.error('Error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="text-slate-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Editar Aplicación</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Código</Label>
              <Input {...register('code')} disabled />
            </div>

            <div>
              <Label>Nombre</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
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
