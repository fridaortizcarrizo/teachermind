import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type LessonBlock = Tables<"lesson_blocks">;

export function useLessonBlocks(studentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_blocks", studentId],
    queryFn: async () => {
      let query = supabase.from("lesson_blocks").select("*").order("start_date", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as LessonBlock[];
    },
    enabled: !!user,
  });
}
