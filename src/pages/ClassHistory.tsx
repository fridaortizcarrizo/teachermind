import { useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLessons, useDeleteLesson } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { ImportLessonsDialog } from "@/components/students/ImportLessonsDialog";
import { LessonFormDialog } from "@/components/lessons/LessonFormDialog";
import {
  Search, Clock, Edit3, Trash2, FileUp, Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Lesson = Tables<"lessons">;

function LessonCard({
  lesson,
  student,
  onEdit,
}: {
  lesson: Lesson;
  student: any;
  onEdit: (lesson: Lesson) => void;
}) {
  const deleteLesson = useDeleteLesson();

  const handleDelete = async () => {
    try {
      await deleteLesson.mutateAsync(lesson.id);
      toast.success("Clase eliminada");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const statusLabel = {
    completed: { label: "Dictada", cls: "bg-emerald-500/20 text-emerald-800" },
    planned: { label: "Planificada", cls: "bg-amber-500/20 text-amber-800" },
    cancelled: { label: "Cancelada", cls: "bg-destructive/20 text-destructive" },
  }[lesson.status] ?? { label: lesson.status, cls: "bg-muted text-muted-foreground" };

  return (
    <GlassCard variant="subtle" className="py-4 group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link
            to={`/lessons/${lesson.id}`}
            className="font-semibold hover:underline truncate"
          >
            {lesson.title}
          </Link>
          {student && <GlassBadge level={student.level} variant="level" />}
          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${statusLabel.cls}`}>
            {statusLabel.label}
          </span>
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(lesson)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Editar clase"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="Eliminar clase"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta clase?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará "{lesson.title}" permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {student && (
        <p className="text-xs text-primary font-medium mb-1.5">{student.name}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3 shrink-0" />
        <span>{lesson.date}</span>
      </div>

      {/* Tags */}
      {((lesson.grammar_focus ?? []).length > 0 || (lesson.vocabulary_focus ?? []).length > 0) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(lesson.grammar_focus ?? []).map((g) => (
            <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {g}
            </span>
          ))}
          {(lesson.vocabulary_focus ?? []).map((v) => (
            <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground font-medium">
              {v}
            </span>
          ))}
        </div>
      )}

      {lesson.objective && (
        <p className="text-sm text-muted-foreground line-clamp-2">{lesson.objective}</p>
      )}

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

  // Import dialog state
  const [importOpen, setImportOpen] = useState(false);
  const [importStudentId, setImportStudentId] = useState<string>("");

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>();

  const openCreate = () => {
    setEditingLesson(undefined);
    setFormOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormOpen(true);
  };

  const filtered = lessons.filter((l) => {
    const matchesQuery =
      !query ||
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de clases</h1>
          <p className="text-muted-foreground mt-1">
            Hacé click en el título para ver detalles, o en ✏️ para editar
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Import: select student first if multiple */}
          {students.length > 1 && !importStudentId && (
            <Select
              value={importStudentId || undefined}
              onValueChange={(v) => setImportStudentId(v)}
            >
              <SelectTrigger className="w-44 rounded-xl text-sm">
                <SelectValue placeholder="Alumna para importar" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={handleImportClick}
            disabled={!importStudentId && students.length > 1}
          >
            <FileUp className="h-4 w-4" />
            Importar PDF
          </Button>
          <Button className="gap-2 rounded-xl" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Cargar clase
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, gramática u objetivo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl"
          />
        </div>
        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Todas las alumnas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las alumnas</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const student = students.find((s) => s.id === lesson.student_id);
            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                student={student}
                onEdit={openEdit}
              />
            );
          })}
          {filtered.length === 0 && (
            <GlassCard variant="subtle" className="text-center py-10">
              <p className="text-muted-foreground">No se encontraron clases.</p>
              <Button
                variant="outline"
                className="mt-4 gap-2 rounded-xl"
                onClick={openCreate}
              >
                <Plus className="h-4 w-4" />
                Cargar la primera clase
              </Button>
            </GlassCard>
          )}
        </div>
      )}

      {/* Dialogs */}
      <LessonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lesson={editingLesson}
      />

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
