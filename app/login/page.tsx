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
import { Loader2, Eye, EyeOff, Lock, Mail, Moon, Sun, Sparkles, Linkedin, Phone, Shield, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email"),
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

      toast.success("Welcome!");
      router.replace("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Invalid credentials");
      toast.error("Failed to sign in");
    }
  };

  const onMagicLinkSubmit = async (values: MagicLinkForm) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast.success("Check your email!");
    } catch (e: any) {
      setError(e?.message || "Failed to send magic link");
      toast.error("Failed to send link");
    }
  };

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Full-screen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row h-screen overflow-y-auto lg:overflow-hidden">
        {/* Left Side - Floating Login Card */}
        <div className="w-full lg:w-[45%] min-h-screen lg:min-h-0 flex items-center justify-center lg:items-start lg:justify-start pt-0 lg:pt-16 xl:pt-20 p-4 sm:p-6 lg:p-8 lg:pl-12 xl:pl-16 pb-20 lg:pb-0">
          <div className="w-full max-w-md">
            <div className="rounded-xl border bg-card/95 backdrop-blur-md shadow-2xl">
              <div className="p-6 sm:p-8">
                <div className="flex justify-end mb-2">
                  {mounted ? (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                      onClick={() => setTheme(isDark ? "light" : "dark")}
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  ) : (
                    <Button variant="outline" size="icon" aria-label="Toggle theme" disabled>
                      <Moon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
                  <p className="text-sm text-muted-foreground mt-1">Access the dashboard</p>
                </div>

          {checking ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Checking session...
            </div>
          ) : (
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">
                  <Lock className="h-4 w-4 mr-2" /> Password
                </TabsTrigger>
                <TabsTrigger value="magic">
                  <Sparkles className="h-4 w-4 mr-2" /> Magic Link
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
                                placeholder="you@example.com"
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-9 pr-10"
                                type={showPassword ? "text" : "password"}
                                placeholder="Your password"
                                autoComplete="current-password"
                                {...field}
                              />
                              <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword((v) => !v)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        Forgot your password?
                      </Link>
                    </div>

                    {error && (
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    )}

                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Sign In
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="magic">
                {magicLinkSent ? (
                  <div className="mt-4 p-4 rounded-lg bg-muted text-center space-y-2">
                    <Mail className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="font-semibold">Email sent!</h3>
                    <p className="text-sm text-muted-foreground">
                      Check your inbox and click the magic link to sign in.
                    </p>
                    <Button variant="outline" onClick={() => setMagicLinkSent(false)} className="mt-4">
                      Send another link
                    </Button>
                  </div>
                ) : (
                  <Form {...magicLinkForm}>
                    <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4 mt-4">
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
                                  placeholder="you@example.com"
                                  autoComplete="email"
                                  type="email"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-2">
                              You'll receive a magic link via email to sign in without a password.
                            </p>
                          </FormItem>
                        )}
                      />

                      {error && (
                        <p className="text-sm text-destructive" role="alert">
                          {error}
                        </p>
                      )}

                      <Button type="submit" className="w-full" disabled={magicLinkForm.formState.isSubmitting}>
                        {magicLinkForm.formState.isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Send Magic Link
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
        </div>

        {/* Right Side - Brand Information Panel */}
        <div className="w-full lg:w-[55%] min-h-screen lg:min-h-0 flex flex-col justify-center p-4 sm:p-6 lg:p-8 lg:pr-12 xl:pr-16 relative pb-20 lg:pb-0">
          {/* Brand Section */}
          <div className="flex flex-col space-y-6 lg:space-y-8 text-white">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
                  BanMate
                </h2>
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-lg leading-relaxed">
                Comprehensive security and access management system for modern hospitality venues
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white text-base sm:text-lg">Centralized Person Management</p>
                  <p className="text-sm text-white/80">Manage all individuals in one unified system</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white text-base sm:text-lg">Access Control & Bans</p>
                  <p className="text-sm text-white/80">Track and manage access restrictions efficiently</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white text-base sm:text-lg">Real-time Reporting</p>
                  <p className="text-sm text-white/80">Get instant insights and analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white text-base sm:text-lg">Intuitive Interface</p>
                  <p className="text-sm text-white/80">User-friendly design for all team members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Footer - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/20">
        <div className="bg-black/40 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-white/90 leading-tight">
                <span className="font-medium uppercase tracking-wide">Developed by</span>{" "}
                <span className="font-bold">Matias Gallardo</span>{" "}
                <span className="text-white/70">•</span>{" "}
                <span className="text-white/80">Full-stack development & design</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <a
                href="https://www.linkedin.com/in/matiasgallardo-dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs sm:text-sm text-white hover:text-primary transition-colors font-medium"
              >
                <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>matiasgallardo-dev</span>
              </a>
              <a
                href="mailto:matiasgallardo196@gmail.com"
                className="flex items-center gap-1.5 text-xs sm:text-sm text-white hover:text-primary transition-colors font-medium"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">matiasgallardo196@gmail.com</span>
                <span className="sm:hidden">Email</span>
              </a>
              <a
                href="tel:+549431269954"
                className="flex items-center gap-1.5 text-xs sm:text-sm text-white hover:text-primary transition-colors font-medium"
              >
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>+54 9 4312 69954</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

