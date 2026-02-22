import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
};

type ProfileResponse = {
  profile: Profile;
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

type ProfileStatus = "logged_out" | "loaded" | "error";

type UseProfileResult = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  status: ProfileStatus;
};

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("logged_out");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled) return;

        const session = sessionData.session;

        if (!session?.access_token) {
          setProfile(null);
          setStatus("logged_out");
          return;
        }

        if (session.user?.is_anonymous) {
          setProfile(null);
          setStatus("logged_out");
          return;
        }

        const { data, error: fnError } = await supabase.functions.invoke<ProfileResponse>("get-profile");

        if (cancelled) return;

        if (fnError) {
          if (fnError.message.includes("Unauthorized")) {
            setProfile(null);
            setStatus("logged_out");
            return;
          }

          setError(fnError.message ?? "Failed to load profile");
          setStatus("error");
          return;
        }

        const body = data as ProfileResponse;

        setProfile(body.profile);
        setStatus("loaded");
      } catch (err) {
        if (cancelled) return;

        setError(err instanceof Error ? err.message : "Failed to load profile");
        setStatus("error");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, isLoading, error, status };
}

