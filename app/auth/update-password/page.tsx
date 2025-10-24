"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("[UpdatePassword] Checking session...");

        // Verificar si hay un error en la URL (del callback)
        const searchParams = new URLSearchParams(window.location.search);
        const errorParam = searchParams.get("error");

        if (errorParam) {
          console.error("[UpdatePassword] Error from callback:", errorParam);
          setError(decodeURIComponent(errorParam));
          setLoading(false);
          return;
        }

        // Verificar si hay sesión activa (el callback ya intercambió el código)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("[UpdatePassword] Session check:", {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError,
        });

        if (sessionError) {
          console.error(
            "[UpdatePassword] Error getting session:",
            sessionError
          );
          setError(`Error al obtener sesión: ${sessionError.message}`);
          setLoading(false);
          return;
        }

        if (session) {
          console.log(
            "[UpdatePassword] ✅ Session encontrada exitosamente:",
            session.user.email
          );
          setTokenValid(true);
          setLoading(false);
        } else {
          console.error("[UpdatePassword] ❌ No session found");
          setError(
            "Link de recuperación inválido o expirado. Por favor, solicita un nuevo link."
          );
          setLoading(false);
        }
      } catch (err: any) {
        console.error("[UpdatePassword] Exception caught:", err);
        setError(`Error: ${err.message || "Error desconocido"}`);
        setLoading(false);
      }
    };

    checkSession();
  }, [supabase]);

  const onSubmit = async (values: UpdatePasswordForm) => {
    try {
      setError(null);

      console.log("[UpdatePassword] Actualizando contraseña...");

      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (updateError) {
        console.error("[UpdatePassword] Error updating password:", updateError);
        throw updateError;
      }

      console.log("[UpdatePassword] Contraseña actualizada exitosamente");

      // Solicitar al servidor que elimine la cookie httpOnly de 'requires_password_change'
      try {
        await fetch("/api/auth/clear-password-cookie", { method: "POST" });
        console.log(
          "[UpdatePassword] Cleared requires_password_change cookie (server)"
        );
      } catch {
        // Ignorar fallos de limpieza de cookie
      }

      setSuccess(true);
      toast.success("Contraseña actualizada correctamente");

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("[UpdatePassword] Error:", err);
      setError(err.message || "Error al actualizar la contraseña");
      toast.error("Error al actualizar la contraseña");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Verificando link de recuperación...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Link Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => router.push("/auth/reset-password")}
              className="w-full"
            >
              Solicitar Nuevo Link
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
              variant="outline"
            >
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>¡Contraseña Actualizada!</CardTitle>
            <CardDescription>
              Tu contraseña ha sido actualizada exitosamente. Serás redirigido
              al dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nueva Contraseña</CardTitle>
          <CardDescription>
            Establece tu nueva contraseña. Asegúrate de que sea segura y
            diferente a la anterior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9 pr-10"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9 pr-10"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
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

              <div className="text-xs text-muted-foreground space-y-1">
                <p>La contraseña debe contener:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Al menos 8 caracteres</li>
                  <li>Una letra mayúscula</li>
                  <li>Una letra minúscula</li>
                  <li>Un número</li>
                </ul>
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
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando contraseña...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
