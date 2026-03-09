import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type VocabularyItem = Tables<"vocabulary">;

export function useVocabulary(studentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vocabulary", studentId],
    queryFn: async () => {
      let query = supabase.from("vocabulary").select("*").order("created_at", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as VocabularyItem[];
    },
    enabled: !!user,
  });
}
