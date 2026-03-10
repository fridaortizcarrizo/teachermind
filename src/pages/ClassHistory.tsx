import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessons, useUpdateLesson } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { Search, Clock, Edit3, Check, X } from "lucide-react";
import { toast } from "sonner";

function EditableLessonCard({ lesson, student }: { lesson: any; student: any }) {
  const updateLesson = useUpdateLesson();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: lesson.title,
    date: lesson.date,
    objective: lesson.objective,
    homework: lesson.homework ?? "",
    grammar_focus: (lesson.grammar_focus ?? []).join(", "),
    vocabulary_focus: (lesson.vocabulary_focus ?? []).join(", "),
    observations: lesson.observations ?? "",
    status: lesson.status,
  });

  const save = async () => {
    try {
      await updateLesson.mutateAsync({
        id: lesson.id,
        title: form.title,
        date: form.date,
        objective: form.objective,
        homework: form.homework,
        grammar_focus: form.grammar_focus.split(",").map((s: string) => s.trim()).filter(Boolean),
        vocabulary_focus: form.vocabulary_focus.split(",").map((s: string) => s.trim()).filter(Boolean),
        observations: form.observations || null,
        status: form.status as any,
      });
      toast.success("Clase actualizada");
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (editing) {
    return (
      <GlassCard variant="subtle" className="py-4 ring-2 ring-primary/30">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título" className="font-semibold" />
            <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-40" />
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="rounded-md border border-input bg-background px-2 text-xs">
              <option value="completed">completed</option>
              <option value="planned">planned</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <Input value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} placeholder="Objetivo / resumen de la clase" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={form.grammar_focus} onChange={(e) => setForm((f) => ({ ...f, grammar_focus: e.target.value }))} placeholder="Gramática (separar por coma)" />
            <Input value={form.vocabulary_focus} onChange={(e) => setForm((f) => ({ ...f, vocabulary_focus: e.target.value }))} placeholder="Vocabulario (separar por coma)" />
          </div>
          <Input value={form.homework} onChange={(e) => setForm((f) => ({ ...f, homework: e.target.value }))} placeholder="Tarea" />
          <Input value={form.observations} onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))} placeholder="Notas" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted">
              <X className="h-3 w-3" /> Cancelar
            </button>
            <button onClick={save} disabled={updateLesson.isPending} className="flex items-center gap-1 text-xs text-primary-foreground bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90">
              <Check className="h-3 w-3" /> Guardar
            </button>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="subtle" className="py-4 group cursor-pointer" onClick={() => setEditing(true)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{lesson.title}</h3>
          {student && <GlassBadge level={student.level} variant="level" />}
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${lesson.status === 'completed' ? 'bg-emerald-500/20 text-emerald-800' : lesson.status === 'cancelled' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-800'}`}>{lesson.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.date}</span>
          <Edit3 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      {student && <p className="text-xs text-primary font-medium mb-1">{student.name}</p>}
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {(lesson.grammar_focus ?? []).map((g: string) => <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{g}</span>)}
        {(lesson.vocabulary_focus ?? []).map((v: string) => <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground font-medium">{v}</span>)}
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground line-clamp-2">{lesson.objective}</p>

      {/* Homework */}
      {lesson.homework && (
        <p className="text-xs text-muted-foreground mt-2">
          <span className="font-medium">📝 Tarea:</span> {lesson.homework}
        </p>
      )}

      {lesson.observations && (
        <p className="text-xs text-muted-foreground mt-1 italic">💬 {lesson.observations}</p>
      )}
    </GlassCard>
  );
}

export default function ClassHistory() {
  const [query, setQuery] = useState("");
  const { data: lessons = [], isLoading } = useLessons();
  const { data: students = [] } = useStudents();

  const filtered = lessons.filter((l) =>
    l.title.toLowerCase().includes(query.toLowerCase()) ||
    (l.grammar_focus ?? []).some((g) => g.toLowerCase().includes(query.toLowerCase())) ||
    l.objective.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class History</h1>
        <p className="text-muted-foreground mt-1">Hacé click en cualquier clase para editarla</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por tema, gramática u objetivo..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const student = students.find((s) => s.id === lesson.student_id);
            return <EditableLessonCard key={lesson.id} lesson={lesson} student={student} />;
          })}
          {filtered.length === 0 && (
            <GlassCard variant="subtle" className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron clases.</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
