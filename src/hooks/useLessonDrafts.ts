import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useRef, useCallback } from "react";

export interface LessonDraftRow {
  id: string;
  user_id: string;
  student_id: string | null;
  draft_json: any;
  chat_messages: any;
  selected_prev_lesson_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useLessonDrafts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_drafts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_drafts" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LessonDraftRow[];
    },
    enabled: !!user,
  });
}

export function useUpsertDraft() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      id,
      studentId,
      draftJson,
      chatMessages,
      selectedPrevLessonId,
    }: {
      id?: string;
      studentId: string | null;
      draftJson: any;
      chatMessages: any;
      selectedPrevLessonId: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        student_id: studentId,
        draft_json: draftJson ?? {},
        chat_messages: chatMessages ?? [],
        selected_prev_lesson_id: selectedPrevLessonId,
      };

      if (id) {
        const { data, error } = await supabase
          .from("lesson_drafts" as any)
          .update(payload)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as LessonDraftRow;
      } else {
        const { data, error } = await supabase
          .from("lesson_drafts" as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as LessonDraftRow;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson_drafts"] }),
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lesson_drafts" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson_drafts"] }),
  });
}

/**
 * Hook that auto-saves draft state with debounce.
 * Returns the current draftDbId and a save-now function.
 */
export function useAutoSaveDraft({
  draft,
  messages,
  studentId,
  selectedPrevLessonId,
  enabled,
}: {
  draft: any | null;
  messages: any[];
  studentId: string | null;
  selectedPrevLessonId: string | null;
  enabled: boolean;
}) {
  const upsert = useUpsertDraft();
  const draftIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(async () => {
    if (!enabled) return;
    // Only save if there's something to save
    if (!draft && messages.length === 0) return;

    try {
      const result = await upsert.mutateAsync({
        id: draftIdRef.current ?? undefined,
        studentId,
        draftJson: draft,
        chatMessages: messages,
        selectedPrevLessonId,
      });
      if (result?.id) draftIdRef.current = result.id;
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  }, [draft, messages, studentId, selectedPrevLessonId, enabled, upsert]);

  // Debounced auto-save
  useEffect(() => {
    if (!enabled) return;
    if (!draft && messages.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveNow();
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, messages, studentId, selectedPrevLessonId, enabled]);

  const setDraftId = (id: string | null) => {
    draftIdRef.current = id;
  };

  const clearDraft = async () => {
    if (draftIdRef.current) {
      try {
        await supabase
          .from("lesson_drafts" as any)
          .delete()
          .eq("id", draftIdRef.current);
      } catch {}
    }
    draftIdRef.current = null;
  };

  return { draftDbId: draftIdRef, setDraftId, saveNow, clearDraft };
}
