import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudent, useUpdateStudent } from "@/hooks/useStudents";
import { useLessons } from "@/hooks/useLessons";
import { useGrammarTopics } from "@/hooks/useGrammarTopics";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useProgressNotes } from "@/hooks/useProgressNotes";
import { ArrowLeft, Sparkles, BookOpen, AlertCircle, CheckCircle2, Clock, FileUp, ClipboardPaste, Layers, Edit3, Check, X } from "lucide-react";
import { useActiveBlock, useLessonBlocks, useBlockLessonCounts } from "@/hooks/useLessonBlocks";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ImportLessonsDialog } from "@/components/students/ImportLessonsDialog";
import { ImportQuestionnaireDialog } from "@/components/students/ImportQuestionnaireDialog";
import { toast } from "sonner";

const grammarStatusColors: Record<string, string> = {
  consolidated: "bg-emerald-500/20 text-emerald-800",
  practicing: "bg-sky-500/20 text-sky-800",
  introduced: "bg-amber-500/20 text-amber-800",
  needs_review: "bg-rose-500/20 text-rose-800",
  not_started: "bg-muted text-muted-foreground",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

// Inline editable text field
function EditableField({ value, onSave, label, multiline }: { value: string; onSave: (v: string) => void; label?: string; multiline?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  
  const save = () => { if (val !== value) onSave(val); setEditing(false); };
  
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {multiline ? (
          <textarea value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }} autoFocus className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none" rows={2} />
        ) : (
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} autoFocus className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/40" />
        )}
        <button onClick={save} className="text-primary p-1 hover:bg-primary/10 rounded"><Check className="h-3.5 w-3.5" /></button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground p-1 hover:bg-muted rounded"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <span onClick={() => { setVal(value); setEditing(true); }} className="cursor-pointer hover:bg-muted/60 rounded px-1 -mx-1 transition-colors group inline-flex items-center gap-1">
      {value || <span className="italic text-muted-foreground">click para editar</span>}
      <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}

// Editable tags (comma-separated arrays)
function EditableTags({ values, onSave, label }: { values: string[]; onSave: (v: string[]) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(values.join(", "));
  
  const save = () => {
    const newVals = val.split(",").map((s) => s.trim()).filter(Boolean);
    onSave(newVals);
    setEditing(false);
  };

  if (editing) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-1">
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} autoFocus className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/40" placeholder="Separar por coma" />
          <button onClick={save} className="text-primary p-1 hover:bg-primary/10 rounded"><Check className="h-3.5 w-3.5" /></button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground p-1 hover:bg-muted rounded"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => { setVal(values.join(", ")); setEditing(true); }} className="cursor-pointer group">
      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
        {label}
        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{v}</span>)}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">click para agregar</p>
      )}
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const { data: student, isLoading } = useStudent(id);
  const updateStudent = useUpdateStudent();
  const { data: studentLessons = [] } = useLessons(id);
  const { data: studentGrammar = [] } = useGrammarTopics(id);
  const { data: studentVocab = [] } = useVocabulary(id);
  const { data: studentNotes = [] } = useProgressNotes(id);
  const activeBlock = useActiveBlock(id);
  const activeBlockIds = activeBlock ? [activeBlock.id] : [];
  const { data: blockCounts = {} } = useBlockLessonCounts(activeBlockIds);
  const [importLessonsOpen, setImportLessonsOpen] = useState(false);
  const [importQuestionnaireOpen, setImportQuestionnaireOpen] = useState(false);

  const save = async (updates: Record<string, any>) => {
    if (!student) return;
    try {
      await updateStudent.mutateAsync({ id: student.id, ...updates });
      toast.success("Perfil actualizado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  if (!student) return <div className="p-8 text-center text-muted-foreground">Student not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/students" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a Alumnos
      </Link>

      <GlassCard variant="strong" className="flex flex-col sm:flex-row items-start gap-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl font-display">
          {student.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">
              <EditableField value={student.name} onSave={(v) => save({ name: v })} />
            </h1>
            <Select value={student.level} onValueChange={(v) => save({ level: v })}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground">
            <EditableField value={student.profession ?? ""} onSave={(v) => save({ profession: v })} /> · Edad: <EditableField value={String(student.age ?? "")} onSave={(v) => save({ age: v ? Number(v) : null })} />
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Email: <EditableField value={student.email ?? ""} onSave={(v) => save({ email: v || null })} />
          </p>
          
          <div className="flex flex-wrap gap-1 mt-2">
            <EditableTags values={student.interests ?? []} onSave={(v) => save({ interests: v })} label="Intereses" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <EditableTags values={student.objectives ?? []} onSave={(v) => save({ objectives: v })} label="Objetivos" />
            <EditableTags values={student.difficulties ?? []} onSave={(v) => save({ difficulties: v })} label="Dificultades" />
            <EditableTags values={student.strengths ?? []} onSave={(v) => save({ strengths: v })} label="Fortalezas" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
            <EditableField value={student.notes ?? ""} onSave={(v) => save({ notes: v })} multiline />
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link to="/generate-lesson">
            <Button className="gap-2 rounded-xl w-full"><Sparkles className="h-4 w-4" />Generar Clase</Button>
          </Link>
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setImportQuestionnaireOpen(true)}>
            <ClipboardPaste className="h-4 w-4" />Actualizar perfil
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setImportLessonsOpen(true)}>
            <FileUp className="h-4 w-4" />Importar clases
          </Button>
        </div>
      </GlassCard>

      {/* Active Block Info */}
      {activeBlock && (
        <GlassCard variant="subtle" className="flex items-center gap-4">
          <Layers className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{activeBlock.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800">active</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={((blockCounts[activeBlock.id]?.total ?? activeBlock.lessons_completed) / activeBlock.size) * 100} className="h-2 flex-1" />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {blockCounts[activeBlock.id]?.total ?? activeBlock.lessons_completed}/{activeBlock.size} clases
              </span>
            </div>
          </div>
        </GlassCard>
      )}

      <Tabs defaultValue="history">
        <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
          <TabsTrigger value="history">Clases</TabsTrigger>
          <TabsTrigger value="grammar">Gramática</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulario</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-3 mt-4">
          {studentLessons.length === 0 && <p className="text-muted-foreground text-center py-8">No hay clases registradas.</p>}
          {studentLessons.map((lesson) => (
            <GlassCard key={lesson.id} variant="subtle" className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{lesson.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${lesson.status === 'completed' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-amber-500/20 text-amber-800'}`}>
                    {lesson.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.date}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{lesson.objective}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(lesson.grammar_focus ?? []).map((g) => <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{g}</span>)}
                {(lesson.vocabulary_focus ?? []).map((v) => <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground">{v}</span>)}
              </div>
              {lesson.homework && <p className="text-xs text-muted-foreground mt-2">📝 Tarea: {lesson.homework}</p>}
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="grammar" className="space-y-3 mt-4">
          {studentGrammar.length === 0 && <p className="text-muted-foreground text-center py-8">No hay temas de gramática.</p>}
          {studentGrammar.map((g) => (
            <GlassCard key={g.id} variant="subtle" className="py-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{g.topic}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${grammarStatusColors[g.status]}`}>{g.status.replace("_", " ")}</span>
              </div>
              <p className="text-xs text-muted-foreground">Trabajado {g.times_worked}× · Última vez: {g.last_worked ?? "N/A"}</p>
              {(g.errors ?? []).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-destructive font-medium">Errores recurrentes:</p>
                  <ul className="text-xs text-muted-foreground">{(g.errors ?? []).map((e) => <li key={e}>• {e}</li>)}</ul>
                </div>
              )}
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-4">
          {studentVocab.length === 0 && <p className="text-muted-foreground text-center py-8">No hay vocabulario.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {studentVocab.map((v) => (
              <GlassCard key={v.id} variant="subtle" className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{v.word}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.status === 'consolidated' ? 'bg-emerald-500/20 text-emerald-800' : v.status === 'practicing' ? 'bg-sky-500/20 text-sky-800' : 'bg-amber-500/20 text-amber-800'}`}>{v.status}</span>
                </div>
                {v.translation && <p className="text-xs text-muted-foreground">{v.translation}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{v.category}</p>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-3 mt-4">
          {studentNotes.length === 0 && <p className="text-muted-foreground text-center py-8">No hay notas de progreso.</p>}
          {studentNotes.map((n) => (
            <GlassCard key={n.id} variant="subtle" className="py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${n.type === 'milestone' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-sky-500/20 text-sky-800'}`}>{n.type}</span>
                <span className="text-xs text-muted-foreground">{n.date}</span>
              </div>
              <p className="text-sm">{n.content}</p>
            </GlassCard>
          ))}
        </TabsContent>
      </Tabs>

      <ImportLessonsDialog open={importLessonsOpen} onOpenChange={setImportLessonsOpen} studentId={student.id} studentName={student.name} />
      <ImportQuestionnaireDialog open={importQuestionnaireOpen} onOpenChange={setImportQuestionnaireOpen} studentId={student.id} />
    </div>
  );
}
