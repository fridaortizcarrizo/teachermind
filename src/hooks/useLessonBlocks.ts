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

/** Fetches real lesson counts per block from the lessons table */
export function useBlockLessonCounts(blockIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["block_lesson_counts", blockIds],
    queryFn: async () => {
      if (blockIds.length === 0) return {} as Record<string, { total: number; completed: number }>;
      const { data, error } = await supabase
        .from("lessons")
        .select("block_id, status")
        .in("block_id", blockIds);
      if (error) throw error;
      const counts: Record<string, { total: number; completed: number }> = {};
      for (const lesson of data) {
        if (!lesson.block_id) continue;
        if (!counts[lesson.block_id]) counts[lesson.block_id] = { total: 0, completed: 0 };
        counts[lesson.block_id].total++;
        if (lesson.status === "completed") counts[lesson.block_id].completed++;
      }
      return counts;
    },
    enabled: !!user && blockIds.length > 0,
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

export function useUpdateLessonBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesInsert<"lesson_blocks">>) => {
      const { data, error } = await supabase
        .from("lesson_blocks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson_blocks"] }),
  });
}

export function useDeleteLessonBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lesson_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson_blocks"] });
      qc.invalidateQueries({ queryKey: ["block_lesson_counts"] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson_blocks"] });
      qc.invalidateQueries({ queryKey: ["block_lesson_counts"] });
    },
  });
}
