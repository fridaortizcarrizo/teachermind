import { useParams, Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudents } from "@/hooks/useStudents";
import { ArrowLeft, BookOpen, PenLine, MessageSquare, Home, CheckCircle2, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function LessonDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: students = [] } = useStudents();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Tables<"lessons">;
    },
    enabled: !!id,
  });

  const markCompleted = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lessons").update({ status: "completed" }).eq("id", id!);
      if (error) throw error;
      // If lesson belongs to a block, increment its counter
      if (lesson?.block_id) {
        const { data: block } = await supabase.from("lesson_blocks").select("lessons_completed, size").eq("id", lesson.block_id).single();
        if (block) {
          const newCompleted = block.lessons_completed + 1;
          const updates: any = { lessons_completed: newCompleted };
          if (newCompleted >= block.size) {
            updates.status = "completed";
            updates.end_date = new Date().toISOString().split("T")[0];
          }
          await supabase.from("lesson_blocks").update(updates).eq("id", lesson.block_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson", id] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["lesson_blocks"] });
      qc.invalidateQueries({ queryKey: ["block_lesson_counts"] });
      toast({ title: "✅ Clase marcada como completada" });
    },
  });

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!lesson) return <div className="p-8 text-center text-muted-foreground">Clase no encontrada</div>;

  const student = students.find((s) => s.id === lesson.student_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/calendar" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al Calendario
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${lesson.status === "completed" ? "bg-emerald-500/20 text-emerald-800" : "bg-amber-500/20 text-amber-800"}`}>
              {lesson.status === "completed" ? "Dictada" : "Planificada"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {student && <span>{student.name}</span>}
            {student && <GlassBadge level={student.level} variant="level" />}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.date}</span>
          </div>
        </div>
        {lesson.status === "planned" && (
          <Button onClick={() => markCompleted.mutate()} className="gap-2 rounded-xl">
            <CheckCircle2 className="h-4 w-4" /> Marcar como dictada
          </Button>
        )}
      </div>

      <GlassCard variant="subtle">
        <p className="text-sm"><span className="font-medium">Objetivo:</span> {lesson.objective}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {(lesson.grammar_focus ?? []).map((g) => <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{g}</span>)}
          {(lesson.vocabulary_focus ?? []).map((v) => <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{v}</span>)}
        </div>
      </GlassCard>

      {lesson.homework_check && (
        <GlassCard variant="subtle">
          <div className="flex items-center gap-2 mb-3"><Home className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Homework Check</h3></div>
          <p className="text-sm whitespace-pre-line">{lesson.homework_check}</p>
        </GlassCard>
      )}

      {lesson.warm_up && (
        <GlassCard variant="subtle">
          <div className="flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Warm Up</h3></div>
          <p className="text-sm whitespace-pre-line">{lesson.warm_up}</p>
        </GlassCard>
      )}

      {lesson.grammar_explanation && (
        <GlassCard variant="subtle">
          <div className="flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Grammar</h3></div>
          <p className="text-sm whitespace-pre-line">{lesson.grammar_explanation}</p>
        </GlassCard>
      )}

      {(lesson.exercises ?? []).length > 0 && (
        <GlassCard variant="subtle">
          <div className="flex items-center gap-2 mb-3"><PenLine className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Exercises</h3></div>
          <div className="space-y-3">
            {(lesson.exercises ?? []).map((ex, i) => (
              <div key={i} className="text-sm whitespace-pre-line bg-white/5 rounded-lg p-3">{ex}</div>
            ))}
          </div>
        </GlassCard>
      )}

      {lesson.speaking_task && (
        <GlassCard variant="subtle">
          <div className="flex items-center gap-2 mb-3"><MessageSquare className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Speaking Task</h3></div>
          <p className="text-sm whitespace-pre-line">{lesson.speaking_task}</p>
        </GlassCard>
      )}

      {lesson.homework && (
        <GlassCard variant="subtle">
          <div className="flex items-center gap-2 mb-3"><Home className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Homework</h3></div>
          <p className="text-sm whitespace-pre-line">{lesson.homework}</p>
        </GlassCard>
      )}

      {lesson.observations && (
        <GlassCard variant="subtle">
          <p className="text-sm italic text-muted-foreground">💬 {lesson.observations}</p>
        </GlassCard>
      )}
    </div>
  );
}
