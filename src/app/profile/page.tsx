"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

type ProfileResponse = {
  profile: {
    id: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  stats: {
    gamesPlayed: number;
    totalScore: number;
    lastPlayedAt: string | null;
  };
  history: Array<{
    gameId: string;
    status: string | null;
    finalScore: number | null;
    playedAt: string | null;
  }>;
};

type ProfileFormValues = {
  username: string;
  avatarUrl: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      username: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session?.access_token) {
          router.replace("/auth/login");
          return;
        }

        const { data, error } = await supabase.functions.invoke<ProfileResponse>("get-profile");

        if (error) {
          if (error.message.includes("Unauthorized")) {
            await supabase.auth.signOut();
            router.replace("/auth/login");
            return;
          }
          throw error;
        }

        const body = data as ProfileResponse;
        if (cancelled) return;

        setProfile(body);
        form.reset({
          username: body.profile.username,
          avatarUrl: body.profile.avatarUrl ?? "",
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ profile: ProfileResponse["profile"] }>(
        "update-profile",
        {
          body: {
            username: values.username,
            avatarUrl: values.avatarUrl.trim() || null,
          },
        },
      );

      if (error) {
        throw error;
      }

      const updated = data as { profile: ProfileResponse["profile"] };
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                username: updated.profile.username,
                avatarUrl: updated.profile.avatarUrl,
              },
            }
          : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl bg-card p-6 text-center text-foreground ring-1 ring-border">
          <p className="text-sm">No profile found.</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  const initial = profile.profile.username.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 md:flex-row">
        <div className="w-full md:w-1/3">
          <div className="rounded-xl bg-card p-6 ring-1 ring-border">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.profile.avatarUrl ?? undefined} alt={profile.profile.username} />
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">{profile.profile.username}</h1>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(profile.profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-sm text-foreground">
              <p>
                Games played: <span className="font-semibold">{profile.stats.gamesPlayed}</span>
              </p>
              <p>
                Total score: <span className="font-semibold">{profile.stats.totalScore}</span>
              </p>
              <p>
                Last played:{" "}
                <span className="font-semibold">
                  {profile.stats.lastPlayedAt ? new Date(profile.stats.lastPlayedAt).toLocaleString() : "Never"}
                </span>
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/multiplayer")}>
                Play online
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="rounded-xl bg-card p-6 ring-1 ring-border">
            <h2 className="text-lg font-semibold">Edit profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">Update your public name and avatar.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  rules={{ required: "Username is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your display name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/avatar.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 rounded-xl bg-card p-6 ring-1 ring-border">
            <h2 className="text-lg font-semibold">Recent games</h2>
            <p className="mt-1 text-sm text-muted-foreground">Last 20 games you played.</p>

            {profile.history.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No games played yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border/50 text-sm">
                {profile.history.map((h) => (
                  <li key={h.gameId} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Game {h.gameId.slice(0, 8)}…</p>
                      <p className="text-xs text-muted-foreground">
                        {h.playedAt ? new Date(h.playedAt).toLocaleString() : "Unknown time"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {h.status ? h.status : "unknown"}
                      </p>
                      <p className="text-sm">
                        Score: <span className="font-semibold">{h.finalScore ?? "-"}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
