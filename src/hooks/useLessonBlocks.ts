import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

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

export function useActiveBlock(studentId?: string) {
  const { data: blocks = [] } = useLessonBlocks(studentId);
  return blocks.find((b) => b.status === "active") ?? null;
}

export function useCreateLessonBlock() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (block: Omit<TablesInsert<"lesson_blocks">, "user_id">) => {
      const { data, error } = await supabase
        .from("lesson_blocks")
        .insert({ ...block, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson_blocks"] }),
  });
}

export function useIncrementBlockLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ blockId, currentCompleted, size }: { blockId: string; currentCompleted: number; size: number }) => {
      const newCompleted = currentCompleted + 1;
      const updates: any = { lessons_completed: newCompleted };
      if (newCompleted >= size) {
        updates.status = "completed";
        updates.end_date = new Date().toISOString().split("T")[0];
      }
      const { data, error } = await supabase
        .from("lesson_blocks")
        .update(updates)
        .eq("id", blockId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson_blocks"] }),
  });
}
