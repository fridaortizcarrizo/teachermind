import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Lesson = Tables<"lessons">;

export function useLessons(studentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lessons", studentId],
    queryFn: async () => {
      let query = supabase.from("lessons").select("*").order("date", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!user,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lesson: Omit<TablesInsert<"lessons">, "user_id">) => {
      const { data, error } = await supabase
        .from("lessons")
        .insert({ ...lesson, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}
