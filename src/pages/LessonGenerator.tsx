import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStudents } from "@/hooks/useStudents";
import { useLessons, useCreateLesson } from "@/hooks/useLessons";
import { useGrammarTopics } from "@/hooks/useGrammarTopics";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useActiveBlock, useIncrementBlockLesson } from "@/hooks/useLessonBlocks";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, BookOpen, MessageSquare, PenLine, Home, Check, Copy, CalendarIcon, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VocabWord { english: string; spanish: string; }
interface VocabCategory { name: string; words: VocabWord[]; }
interface Exercise { type: string; title: string; instruction: string; content: string; }

interface GeneratedLesson {
  title: string;
  objective: string;
  grammar_focus: string[];
  vocabulary_focus: string[];
  sections: {
    homework_check: string;
    vocabulary?: { intro: string; categories: VocabCategory[] };
    reading_text?: string;
    warm_up?: string;
    grammar_focus?: string;
    exercises: Exercise[] | string[];
    speaking_task: string;
    homework: string;
  };
}

export default function LessonGenerator() {
  const { data: students = [], isLoading } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState("");
  const { data: lessons } = useLessons(selectedStudent || undefined);
  const { data: grammarTopics } = useGrammarTopics(selectedStudent || undefined);
  const { data: vocabulary } = useVocabulary(selectedStudent || undefined);
  const activeBlock = useActiveBlock(selectedStudent || undefined);
  const incrementBlock = useIncrementBlockLesson();
  const createLesson = useCreateLesson();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedLesson | null>(null);
  const [saved, setSaved] = useState(false);
  const [lessonDate, setLessonDate] = useState<Date>(new Date());

  const student = students.find((s) => s.id === selectedStudent);

  const handleGenerate = async () => {
    if (!student) return;
    setGenerating(true);
    setGenerated(null);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: { student, recentLessons: lessons || [], grammarTopics: grammarTopics || [], vocabulary: vocabulary || [] },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGenerated(data as GeneratedLesson);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error generating lesson", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated || !selectedStudent || !user) return;
    try {
      // Build flat exercises array for DB
      const exercisesFlat = Array.isArray(generated.sections.exercises)
        ? generated.sections.exercises.map((e) =>
            typeof e === "string" ? e : `${e.title}\n${e.instruction}\n${e.content}`
          )
        : [];

      await createLesson.mutateAsync({
        student_id: selectedStudent,
        block_id: activeBlock?.id ?? null,
        title: generated.title,
        date: format(lessonDate, "yyyy-MM-dd"),
        objective: generated.objective,
        grammar_focus: generated.grammar_focus,
        vocabulary_focus: generated.vocabulary_focus,
        homework_check: generated.sections.homework_check,
        warm_up: generated.sections.warm_up || "",
        grammar_explanation: generated.sections.grammar_focus || "",
        exercises: exercisesFlat,
        speaking_task: generated.sections.speaking_task,
        homework: generated.sections.homework,
        status: "planned",
      });

      // Increment block if active
      if (activeBlock) {
        await incrementBlock.mutateAsync({
          blockId: activeBlock.id,
          currentCompleted: activeBlock.lessons_completed,
          size: activeBlock.size,
        });
        const remaining = activeBlock.size - activeBlock.lessons_completed - 1;
        if (remaining === 0) {
          toast({ title: "⚠️ Última clase del bloque!", description: `${activeBlock.title} completado. El alumno debe renovar.`, variant: "destructive" });
        } else if (remaining <= 2) {
          toast({ title: "📋 Quedan pocas clases", description: `${remaining} clase(s) restante(s) en ${activeBlock.title}` });
        }
      }

      setSaved(true);
      toast({ title: "Lesson saved!", description: "The lesson has been added to the student's history." });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    const parts = [`# ${generated.title}`, `Objective: ${generated.objective}`, `Grammar: ${generated.grammar_focus.join(", ")}`, `Vocabulary: ${generated.vocabulary_focus.join(", ")}`, ""];
    parts.push(`## Homework Check\n${generated.sections.homework_check}`);
    if (generated.sections.vocabulary) {
      parts.push("## Vocabulary");
      generated.sections.vocabulary.categories.forEach((cat) => {
        parts.push(`### ${cat.name}`);
        cat.words.forEach((w) => parts.push(`${w.english} – ${w.spanish}`));
      });
    }
    if (generated.sections.reading_text) parts.push(`## Reading\n${generated.sections.reading_text}`);
    if (Array.isArray(generated.sections.exercises)) {
      generated.sections.exercises.forEach((e) => {
        if (typeof e === "string") { parts.push(e); }
        else { parts.push(`## ${e.title}\n${e.instruction}\n${e.content}`); }
      });
    }
    parts.push(`## Speaking Task\n${generated.sections.speaking_task}`);
    parts.push(`## Homework\n${generated.sections.homework}`);
    navigator.clipboard.writeText(parts.join("\n\n"));
    toast({ title: "Copied to clipboard!" });
  };

  const exercises = generated?.sections.exercises ?? [];
  const isRichExercises = exercises.length > 0 && typeof exercises[0] !== "string";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Generator</h1>
        <p className="text-muted-foreground mt-1">AI-powered lesson creation based on student profile and history</p>
      </div>

      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Select Student</label>
            {isLoading ? <Skeleton className="h-10 rounded-xl" /> : (
              <Select value={selectedStudent} onValueChange={(v) => { setSelectedStudent(v); setGenerated(null); setSaved(false); }}>
                <SelectTrigger className="bg-white/10 border-white/20 rounded-xl"><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.level})</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha de clase</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("rounded-xl justify-start text-left font-normal w-[180px]")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(lessonDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={lessonDate} onSelect={(d) => d && setLessonDate(d)} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleGenerate} disabled={!selectedStudent || generating} className="gap-2 rounded-xl self-end">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate Lesson"}
          </Button>
        </div>

        {student && (
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm">{student.name}</span>
              <GlassBadge level={student.level} variant="level" />
              <span className="text-xs text-muted-foreground">{student.profession}</span>
            </div>
            <p className="text-xs text-muted-foreground">Difficulties: {(student.difficulties ?? []).join(", ")}</p>
            {activeBlock ? (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  {activeBlock.title}: {activeBlock.lessons_completed}/{activeBlock.size} clases
                </span>
                {activeBlock.size - activeBlock.lessons_completed <= 2 && (
                  <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" /> Pocas clases restantes</span>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Sin bloque activo</p>
            )}
          </div>
        )}
      </GlassCard>

      {generated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">{generated.title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" className="rounded-xl gap-1" onClick={handleSave} disabled={saved || createLesson.isPending}>
                {saved ? <Check className="h-3.5 w-3.5" /> : createLesson.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saved ? "Saved" : "Save Lesson"}
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Objective:</span> {generated.objective}
          </div>

          {/* Homework Check */}
          <GlassCard variant="subtle">
            <div className="flex items-center gap-2 mb-3"><Home className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Homework Check</h3></div>
            <p className="text-sm text-foreground whitespace-pre-line">{generated.sections.homework_check}</p>
          </GlassCard>

          {/* Vocabulary Table */}
          {generated.sections.vocabulary && (
            <GlassCard variant="subtle">
              <div className="flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Today's Language – Vocabulary</h3></div>
              <p className="text-sm text-muted-foreground mb-3">{generated.sections.vocabulary.intro}</p>
              <div className="space-y-4">
                {generated.sections.vocabulary.categories.map((cat) => (
                  <div key={cat.name}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{cat.name}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {cat.words.map((w) => (
                        <div key={w.english} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-white/5">
                          <span className="font-medium">{w.english}</span>
                          <span className="text-muted-foreground">–</span>
                          <span className="text-muted-foreground">{w.spanish}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Reading Text */}
          {generated.sections.reading_text && (
            <GlassCard variant="subtle">
              <div className="flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Reading</h3></div>
              <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">{generated.sections.reading_text}</div>
            </GlassCard>
          )}

          {/* Exercises */}
          {isRichExercises ? (
            (exercises as Exercise[]).map((ex, i) => (
              <GlassCard key={i} variant="subtle">
                <div className="flex items-center gap-2 mb-2"><PenLine className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">{ex.title}</h3></div>
                <p className="text-sm text-muted-foreground mb-2">{ex.instruction}</p>
                <div className="text-sm text-foreground whitespace-pre-line bg-white/5 rounded-lg p-3">{ex.content}</div>
              </GlassCard>
            ))
          ) : (
            <GlassCard variant="subtle">
              <div className="flex items-center gap-2 mb-3"><PenLine className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Exercises</h3></div>
              <div className="text-sm text-foreground whitespace-pre-line">
                {(exercises as string[]).map((e, i) => `${i + 1}. ${e}`).join("\n\n")}
              </div>
            </GlassCard>
          )}

          {/* Speaking Task */}
          <GlassCard variant="subtle">
            <div className="flex items-center gap-2 mb-3"><MessageSquare className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Speaking Task</h3></div>
            <p className="text-sm text-foreground whitespace-pre-line">{generated.sections.speaking_task}</p>
          </GlassCard>

          {/* Homework */}
          <GlassCard variant="subtle">
            <div className="flex items-center gap-2 mb-3"><Home className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">Homework</h3></div>
            <p className="text-sm text-foreground whitespace-pre-line">{generated.sections.homework}</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
