'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

type RegisterFormValues = {
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError('Registration failed');
        return;
      }

      setSuccess('Check your email to verify your account, then you can sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
        <h1 className="text-2xl font-semibold text-slate-50">Create a Kaboo account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Use an email you can verify. Password is stored in Supabase Auth.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="email"
              rules={{ required: 'Email is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              rules={{ required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            {success && <p className="text-sm font-medium text-emerald-400">{success}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Register'}
            </Button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                className="font-medium text-sky-400 hover:underline"
                onClick={() => router.push('/auth/login')}
              >
                Sign in
              </button>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
