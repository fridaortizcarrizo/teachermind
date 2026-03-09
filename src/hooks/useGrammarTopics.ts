import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type GrammarTopic = Tables<"grammar_topics">;

export function useGrammarTopics(studentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["grammar_topics", studentId],
    queryFn: async () => {
      let query = supabase.from("grammar_topics").select("*").order("last_worked", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as GrammarTopic[];
    },
    enabled: !!user,
  });
}
