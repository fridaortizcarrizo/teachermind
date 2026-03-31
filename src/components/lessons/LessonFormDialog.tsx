import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStudents } from "@/hooks/useStudents";
import { useLessonBlocks } from "@/hooks/useLessonBlocks";
import { useCreateLesson, useUpdateLesson } from "@/hooks/useLessons";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Lesson = Tables<"lessons">;

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill student when opening from student profile or calendar */
  defaultStudentId?: string;
  /** Pre-fill date when opening from calendar */
  defaultDate?: string;
  /** Pass existing lesson to edit instead of create */
  lesson?: Lesson;
}

const EMPTY_FORM = {
  student_id: "",
  block_id: "" as string | null,
  title: "",
  date: new Date().toISOString().split("T")[0],
  status: "completed" as "completed" | "planned" | "cancelled",
  objective: "",
  grammar_focus: "",
  vocabulary_focus: "",
  warm_up: "",
  homework_check: "",
  grammar_explanation: "",
  exercises: "",
  speaking_task: "",
  homework: "",
  observations: "",
};

/** Sync lesson status → block counter.
 *  Call this whenever a lesson's status changes to/from "completed".
 */
async function syncBlockOnStatusChange(
  lessonId: string,
  blockId: string | null,
  prevStatus: string,
  newStatus: string
) {
  if (!blockId) return;
  if (prevStatus === newStatus) return;

  const wasCompleted = prevStatus === "completed";
  const isNowCompleted = newStatus === "completed";
  if (wasCompleted === isNowCompleted) return;

  // Re-count from source of truth (lessons table) to avoid drift
  const { data: blockLessons, error } = await supabase
    .from("lessons")
    .select("id, status")
    .eq("block_id", blockId);

  if (error) { console.error("syncBlock count error", error); return; }

  // After the current mutation lands, the row will have newStatus.
  // We adjust the count manually since the mutation hasn't committed yet.
  let completed = blockLessons.filter((l) => l.status === "completed").length;
  if (isNowCompleted) completed += 1;
  else completed -= 1;
  completed = Math.max(0, completed);

  const { data: block } = await supabase
    .from("lesson_blocks")
    .select("size")
    .eq("id", blockId)
    .single();

  const updates: Record<string, unknown> = { lessons_completed: completed };
  if (block && completed >= block.size) {
    updates.status = "completed";
    updates.end_date = new Date().toISOString().split("T")[0];
  } else {
    // Reopen if it was auto-closed
    const { data: currentBlock } = await supabase
      .from("lesson_blocks")
      .select("status")
      .eq("id", blockId)
      .single();
    if (currentBlock?.status === "completed" && completed < (block?.size ?? 0)) {
      updates.status = "active";
      updates.end_date = null;
    }
  }

  await supabase.from("lesson_blocks").update(updates).eq("id", blockId);
}

export function LessonFormDialog({
  open,
  onOpenChange,
  defaultStudentId,
  defaultDate,
  lesson,
}: LessonFormDialogProps) {
  const isEditing = !!lesson;
  const { data: students = [] } = useStudents();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const qc = useQueryClient();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Blocks for selected student
  const { data: allBlocks = [] } = useLessonBlocks(form.student_id || undefined);
  const studentBlocks = allBlocks.filter((b) => b.student_id === form.student_id);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (isEditing && lesson) {
      setForm({
        student_id: lesson.student_id,
        block_id: lesson.block_id ?? "",
        title: lesson.title,
        date: lesson.date,
        status: lesson.status as any,
        objective: lesson.objective ?? "",
        grammar_focus: (lesson.grammar_focus ?? []).join(", "),
        vocabulary_focus: (lesson.vocabulary_focus ?? []).join(", "),
        warm_up: lesson.warm_up ?? "",
        homework_check: lesson.homework_check ?? "",
        grammar_explanation: lesson.grammar_explanation ?? "",
        exercises: (lesson.exercises ?? []).join("\n\n"),
        speaking_task: lesson.speaking_task ?? "",
        homework: lesson.homework ?? "",
        observations: lesson.observations ?? "",
      });
      setShowAdvanced(
        !!(lesson.warm_up || lesson.homework_check || lesson.grammar_explanation ||
          (lesson.exercises ?? []).length > 0 || lesson.speaking_task)
      );
    } else {
      setForm({
        ...EMPTY_FORM,
        student_id: defaultStudentId ?? "",
        date: defaultDate ?? new Date().toISOString().split("T")[0],
      });
      setShowAdvanced(false);
    }
  }, [open, lesson, defaultStudentId, defaultDate, isEditing]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.student_id) { toast.error("Elegí una alumna"); return; }
    if (!form.title.trim()) { toast.error("Poné un título"); return; }

    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        block_id: form.block_id || null,
        title: form.title.trim(),
        date: form.date,
        status: form.status,
        objective: form.objective.trim(),
        grammar_focus: form.grammar_focus.split(",").map((s) => s.trim()).filter(Boolean),
        vocabulary_focus: form.vocabulary_focus.split(",").map((s) => s.trim()).filter(Boolean),
        warm_up: form.warm_up.trim() || null,
        homework_check: form.homework_check.trim() || null,
        grammar_explanation: form.grammar_explanation.trim() || null,
        exercises: form.exercises.trim()
          ? form.exercises.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)
          : null,
        speaking_task: form.speaking_task.trim() || null,
        homework: form.homework.trim() || null,
        observations: form.observations.trim() || null,
      };

      if (isEditing && lesson) {
        await updateLesson.mutateAsync({ id: lesson.id, ...payload });

        // Sync block if status changed
        if (lesson.status !== form.status) {
          const blockId = form.block_id || lesson.block_id || null;
          await syncBlockOnStatusChange(lesson.id, blockId, lesson.status, form.status);
          qc.invalidateQueries({ queryKey: ["lesson_blocks"] });
          qc.invalidateQueries({ queryKey: ["block_lesson_counts"] });
        }

        toast.success("Clase actualizada ✓");
      } else {
        const created = await createLesson.mutateAsync(payload);

        // If new lesson is completed and has a block, sync
        if (form.status === "completed" && form.block_id) {
          await syncBlockOnStatusChange(created.id, form.block_id, "planned", "completed");
          qc.invalidateQueries({ queryKey: ["lesson_blocks"] });
          qc.invalidateQueries({ queryKey: ["block_lesson_counts"] });
        }

        toast.success("Clase guardada ✓");
      }

      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEditing ? "Editar clase" : "Cargar clase"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── Row 1: alumna + fecha + status ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 space-y-1.5">
              <Label>Alumna *</Label>
              <Select
                value={form.student_id}
                onValueChange={(v) => setForm((f) => ({ ...f, student_id: v, block_id: "" }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Elegir alumna" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={set("date")}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as any }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">✓ Dictada</SelectItem>
                  <SelectItem value="planned">○ Planificada</SelectItem>
                  <SelectItem value="cancelled">✗ Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Bloque (optional) ── */}
          {form.student_id && studentBlocks.length > 0 && (
            <div className="space-y-1.5">
              <Label>Bloque de clases</Label>
              <Select
                value={form.block_id ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, block_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Sin bloque (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin bloque</SelectItem>
                  {studentBlocks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} ({b.lessons_completed}/{b.size})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Título ── */}
          <div className="space-y-1.5">
            <Label>Título de la clase *</Label>
            <Input
              placeholder="Ej: Present Perfect – Experiencias de viaje"
              value={form.title}
              onChange={set("title")}
              className="rounded-xl"
            />
          </div>

          {/* ── Objetivo ── */}
          <div className="space-y-1.5">
            <Label>Objetivo / resumen</Label>
            <Textarea
              placeholder="Ej: La alumna puede usar el Present Perfect para hablar de experiencias..."
              value={form.objective}
              onChange={set("objective")}
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* ── Gramática + Vocabulario ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gramática trabajada</Label>
              <Input
                placeholder="Present Perfect, Question tags..."
                value={form.grammar_focus}
                onChange={set("grammar_focus")}
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground">Separar por coma</p>
            </div>
            <div className="space-y-1.5">
              <Label>Vocabulario trabajado</Label>
              <Input
                placeholder="travel, experience, achievement..."
                value={form.vocabulary_focus}
                onChange={set("vocabulary_focus")}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* ── Tarea ── */}
          <div className="space-y-1.5">
            <Label>Tarea asignada</Label>
            <Input
              placeholder="Ej: Escribir 10 oraciones con Present Perfect sobre sus viajes"
              value={form.homework}
              onChange={set("homework")}
              className="rounded-xl"
            />
          </div>

          {/* ── Observaciones ── */}
          <div className="space-y-1.5">
            <Label>Observaciones / notas</Label>
            <Textarea
              placeholder="Ej: Confunde still con yet. Necesita más práctica con preguntas negativas."
              value={form.observations}
              onChange={set("observations")}
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* ── Toggle: detalles completos ── */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAdvanced ? "Ocultar detalles de la clase" : "Cargar detalles completos (warm-up, gramática, ejercicios, speaking)"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-l-2 border-primary/20 pl-4">
              <div className="space-y-1.5">
                <Label>Revisión de tarea anterior</Label>
                <Textarea
                  placeholder="Qué tarea revisaron y cómo resultó..."
                  value={form.homework_check}
                  onChange={set("homework_check")}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Warm up</Label>
                <Textarea
                  placeholder="Actividad de entrada..."
                  value={form.warm_up}
                  onChange={set("warm_up")}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Explicación gramatical</Label>
                <Textarea
                  placeholder="Cómo explicaste el punto gramatical, ejemplos usados..."
                  value={form.grammar_explanation}
                  onChange={set("grammar_explanation")}
                  rows={3}
                  className="rounded-xl resize-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ejercicios</Label>
                <Textarea
                  placeholder={"Un ejercicio por párrafo (dejá una línea en blanco entre cada uno):\n\nFill in the blanks...\n\nTrue or False..."}
                  value={form.exercises}
                  onChange={set("exercises")}
                  rows={5}
                  className="rounded-xl resize-none text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Separar ejercicios con una línea en blanco</p>
              </div>

              <div className="space-y-1.5">
                <Label>Speaking task</Label>
                <Textarea
                  placeholder="Descripción de la actividad oral..."
                  value={form.speaking_task}
                  onChange={set("speaking_task")}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 rounded-xl"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Guardar clase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
