'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const appSchema = z.object({
  code: z.string().min(1).regex(/^[A-Z0-9_]+$/, 'Solo mayúsculas, números y guiones bajos'),
  name: z.string().min(3),
});

type AppFormData = z.infer<typeof appSchema>;

export default function NewApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<AppFormData>({
    resolver: zodResolver(appSchema),
  });

  const code = watch('code');

  const onSubmit = async (data: AppFormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': Math.random().toString(),
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Aplicación creada exitosamente');
        router.push('/admin/applications');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear');
      }
    } catch (error) {
      toast.error('Error al crear aplicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Nueva Aplicación</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información de la Aplicación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="code">Código (ej: SAE_FACTURACION_GT) *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="NOMBRE_APLICACION"
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  e.target.value = value;
                }}
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register('name')} placeholder="Nombre de la aplicación" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Aplicación'}
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
