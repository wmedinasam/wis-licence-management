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

const clientSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  nit: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  country: z.string().length(2, 'Seleccione un país'),
});

type ClientFormData = z.infer<typeof clientSchema>;

const COUNTRIES = [
  { code: 'GT', name: 'Guatemala' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'HN', name: 'Honduras' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
  { code: 'BZ', name: 'Belice' },
];

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { country: 'GT' }
  });

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    try {
      const idempotencyKey = typeof window !== 'undefined' 
        ? window.crypto.randomUUID?.() || Math.random().toString()
        : Math.random().toString();
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Cliente creado exitosamente');
        router.push('/admin/clients');
      } else {
        const error = await res.json();
        console.error('Error del servidor:', error);
        toast.error(error.error || 'Error al crear cliente');
      }
    } catch (error) {
      toast.error('Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Nuevo Cliente</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Nombre de la empresa"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                {...register('nit')}
                placeholder="1234567-8"
              />
              {errors.nit && (
                <p className="text-red-500 text-sm mt-1">{errors.nit.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="empresa@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country">País *</Label>
              <select
                id="country"
                {...register('country')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cliente'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
