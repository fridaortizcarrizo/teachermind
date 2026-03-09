import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type ProgressNote = Tables<"progress_notes">;

export function useProgressNotes(studentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["progress_notes", studentId],
    queryFn: async () => {
      let query = supabase.from("progress_notes").select("*").order("date", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ProgressNote[];
    },
    enabled: !!user,
  });
}
