import { useEffect, useState } from "react";
import { gameApi } from "@/services/gameApi";

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
        const me = await gameApi.getMe();
        if (cancelled) return;

        if (!me) {
          setProfile(null);
          setStatus("logged_out");
          return;
        }

        const data = await gameApi.getProfile() as ProfileResponse;
        if (cancelled) return;

        setProfile(data.profile);
        setStatus("loaded");
      } catch (err) {
        if (cancelled) return;

        if (err instanceof Error && err.message.includes("Unauthorized")) {
          setProfile(null);
          setStatus("logged_out");
          return;
        }

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

