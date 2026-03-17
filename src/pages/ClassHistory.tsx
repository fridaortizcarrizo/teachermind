import { useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLessons, useUpdateLesson, useDeleteLesson } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { ImportLessonsDialog } from "@/components/students/ImportLessonsDialog";
import { Search, Clock, Edit3, Check, X, Trash2, FileUp, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

function EditableLessonCard({ lesson, student }: { lesson: any; student: any }) {
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
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

  const handleDelete = async () => {
    try {
      await deleteLesson.mutateAsync(lesson.id);
      toast.success("Clase eliminada");
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
          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 px-3 py-1.5 rounded-lg hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3" /> Eliminar
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta clase?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará "{lesson.title}" permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted">
                <X className="h-3 w-3" /> Cancelar
              </button>
              <button onClick={save} disabled={updateLesson.isPending} className="flex items-center gap-1 text-xs text-primary-foreground bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90">
                <Check className="h-3 w-3" /> Guardar
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="subtle" className="py-4 group">
      <div className="flex items-center justify-between mb-2">
        <Link to={`/lessons/${lesson.id}`} className="flex items-center gap-2 hover:underline flex-1 min-w-0">
          <h3 className="font-semibold truncate">{lesson.title}</h3>
          {student && <GlassBadge level={student.level} variant="level" />}
          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${lesson.status === 'completed' ? 'bg-emerald-500/20 text-emerald-800' : lesson.status === 'cancelled' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-800'}`}>{lesson.status}</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.date}</span>
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta clase?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {student && <p className="text-xs text-primary font-medium mb-1">{student.name}</p>}
      
      <div className="flex flex-wrap gap-1 mb-2">
        {(lesson.grammar_focus ?? []).map((g: string) => <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{g}</span>)}
        {(lesson.vocabulary_focus ?? []).map((v: string) => <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground font-medium">{v}</span>)}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">{lesson.objective}</p>

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
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const { data: lessons = [], isLoading } = useLessons();
  const { data: students = [] } = useStudents();
  const [importOpen, setImportOpen] = useState(false);
  const [importStudentId, setImportStudentId] = useState<string>("");

  const filtered = lessons.filter((l) => {
    const matchesQuery = !query || 
      l.title.toLowerCase().includes(query.toLowerCase()) ||
      (l.grammar_focus ?? []).some((g) => g.toLowerCase().includes(query.toLowerCase())) ||
      l.objective.toLowerCase().includes(query.toLowerCase());
    const matchesStudent = studentFilter === "all" || l.student_id === studentFilter;
    return matchesQuery && matchesStudent;
  });

  const handleImportClick = () => {
    if (students.length === 1) {
      setImportStudentId(students[0].id);
      setImportOpen(true);
    } else if (importStudentId) {
      setImportOpen(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class History</h1>
          <p className="text-muted-foreground mt-1">Hacé click en el título para ver detalles, o en ✏️ para editar</p>
        </div>
        <div className="flex gap-2">
          {students.length > 1 && !importStudentId ? (
            <Select value={importStudentId || undefined} onValueChange={(v) => { setImportStudentId(v); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Elegir alumna para importar" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          <Button variant="outline" className="gap-2 rounded-xl" onClick={handleImportClick} disabled={!importStudentId && students.length > 1}>
            <FileUp className="h-4 w-4" /> Importar clases (PDF)
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por tema, gramática u objetivo..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl" />
        </div>
        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los alumnos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los alumnos</SelectItem>
            {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
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

      {importStudentId && (
        <ImportLessonsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          studentId={importStudentId}
          studentName={students.find((s) => s.id === importStudentId)?.name ?? ""}
        />
      )}
    </div>
  );
}
