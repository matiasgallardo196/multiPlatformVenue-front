"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const magicLinkSchema = z.object({
  email: z.string().email("Email inválido"),
});

type LoginForm = z.infer<typeof loginSchema>;
type MagicLinkForm = z.infer<typeof magicLinkSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const magicLinkForm = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
        }
      } catch {
      } finally {
        setChecking(false);
      }
    })();
  }, [router, supabase]);

  useEffect(() => setMounted(true), []);

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      toast.success("¡Bienvenido!");
      router.replace("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Credenciales inválidas");
      toast.error("Error al iniciar sesión");
    }
  };

  const onMagicLinkSubmit = async (values: MagicLinkForm) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast.success("¡Revisa tu email!");
    } catch (e: any) {
      setError(e?.message || "Error al enviar el enlace mágico");
      toast.error("Error al enviar el enlace");
    }
  };

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Decorative background for login – mesh gradient + subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 opacity-90 [background:radial-gradient(60%_40%_at_20%_10%,hsl(var(--primary)/0.18),transparent_70%),radial-gradient(50%_35%_at_90%_15%,hsl(var(--accent)/0.14),transparent_70%),radial-gradient(45%_30%_at_50%_85%,hsl(var(--muted-foreground)/0.10),transparent_70%)]" />
        <div className="absolute inset-0 mix-blend-overlay [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="w-full max-w-md rounded-xl border bg-card shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex justify-end mb-2">
            {mounted ? (
              <Button
                variant="outline"
                size="icon"
                aria-label={
                  isDark ? "Switch to light theme" : "Switch to dark theme"
                }
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                aria-label="Toggle theme"
                disabled
              >
                <Moon className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Accede al panel de control
            </p>
          </div>

          {checking ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Verificando
              sesión...
            </div>
          ) : (
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">
                  <Lock className="h-4 w-4 mr-2" />
                  Contraseña
                </TabsTrigger>
                <TabsTrigger value="magic">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Magic Link
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 mt-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-9"
                                placeholder="tu@email.com"
                                autoComplete="email"
                                type="email"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-9 pr-10"
                                type={showPassword ? "text" : "password"}
                                placeholder="Tu contraseña"
                                autoComplete="current-password"
                                {...field}
                              />
                              <button
                                type="button"
                                aria-label={
                                  showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword((v) => !v)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Link
                        href="/auth/reset-password"
                        className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>

                    {error && (
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Iniciar Sesión
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="magic">
                {magicLinkSent ? (
                  <div className="mt-4 p-4 rounded-lg bg-muted text-center space-y-2">
                    <Mail className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="font-semibold">¡Email enviado!</h3>
                    <p className="text-sm text-muted-foreground">
                      Revisa tu bandeja de entrada y haz clic en el enlace
                      mágico para iniciar sesión.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setMagicLinkSent(false)}
                      className="mt-4"
                    >
                      Enviar otro enlace
                    </Button>
                  </div>
                ) : (
                  <Form {...magicLinkForm}>
                    <form
                      onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
                      className="space-y-4 mt-4"
                    >
                      <FormField
                        control={magicLinkForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  className="pl-9"
                                  placeholder="tu@email.com"
                                  autoComplete="email"
                                  type="email"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-2">
                              Recibirás un enlace mágico en tu email para
                              iniciar sesión sin contraseña.
                            </p>
                          </FormItem>
                        )}
                      />

                      {error && (
                        <p className="text-sm text-destructive" role="alert">
                          {error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={magicLinkForm.formState.isSubmitting}
                      >
                        {magicLinkForm.formState.isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enviar Magic Link
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
