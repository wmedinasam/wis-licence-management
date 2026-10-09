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

const clientSchema = z.object({
  name: z.string().min(3),
  nit: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/admin/clients/${clientId}`);
        if (res.ok) {
          const client = await res.json();
          reset(client);
        }
      } catch (error) {
        toast.error('Error al cargar cliente');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchClient();
  }, [clientId, reset]);

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Cliente actualizado exitosamente');
        router.push('/admin/clients');
      } else {
        toast.error('Error al actualizar cliente');
      }
    } catch (error) {
      toast.error('Error al actualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-slate-400">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Editar Cliente</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="nit">NIT</Label>
              <Input id="nit" {...register('nit')} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
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
