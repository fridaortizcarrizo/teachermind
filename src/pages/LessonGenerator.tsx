import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudents } from "@/hooks/useStudents";
import { useLessons, useCreateLesson } from "@/hooks/useLessons";
import { useGrammarTopics } from "@/hooks/useGrammarTopics";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, BookOpen, MessageSquare, PenLine, Home, Check, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const sectionIcons: Record<string, any> = {
  "Homework Check": Home,
  "Warm Up": MessageSquare,
  "Grammar Focus": BookOpen,
  "Exercises": PenLine,
  "Speaking Task": MessageSquare,
  "Homework": Home,
};

interface GeneratedLesson {
  title: string;
  objective: string;
  grammar_focus: string[];
  vocabulary_focus: string[];
  sections: {
    homework_check: string;
    warm_up: string;
    grammar_focus: string;
    exercises: string[];
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
  const createLesson = useCreateLesson();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedLesson | null>(null);
  const [saved, setSaved] = useState(false);

  const student = students.find((s) => s.id === selectedStudent);

  const handleGenerate = async () => {
    if (!student) return;
    setGenerating(true);
    setGenerated(null);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: {
          student,
          recentLessons: lessons || [],
          grammarTopics: grammarTopics || [],
          vocabulary: vocabulary || [],
        },
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
      await createLesson.mutateAsync({
        student_id: selectedStudent,
        title: generated.title,
        objective: generated.objective,
        grammar_focus: generated.grammar_focus,
        vocabulary_focus: generated.vocabulary_focus,
        homework_check: generated.sections.homework_check,
        warm_up: generated.sections.warm_up,
        grammar_explanation: generated.sections.grammar_focus,
        exercises: generated.sections.exercises,
        speaking_task: generated.sections.speaking_task,
        homework: generated.sections.homework,
        status: "planned",
      });
      setSaved(true);
      toast({ title: "Lesson saved!", description: "The lesson has been added to the student's history." });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    const text = [
      `# ${generated.title}`,
      `Objective: ${generated.objective}`,
      `Grammar: ${generated.grammar_focus.join(", ")}`,
      `Vocabulary: ${generated.vocabulary_focus.join(", ")}`,
      "",
      `## Homework Check\n${generated.sections.homework_check}`,
      `## Warm Up\n${generated.sections.warm_up}`,
      `## Grammar Focus\n${generated.sections.grammar_focus}`,
      `## Exercises\n${generated.sections.exercises.map((e, i) => `${i + 1}. ${e}`).join("\n")}`,
      `## Speaking Task\n${generated.sections.speaking_task}`,
      `## Homework\n${generated.sections.homework}`,
    ].join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const sectionsList = generated
    ? [
        { name: "Homework Check", content: generated.sections.homework_check },
        { name: "Warm Up", content: generated.sections.warm_up },
        { name: "Grammar Focus", content: generated.sections.grammar_focus },
        { name: "Exercises", content: generated.sections.exercises.join("\n\n") },
        { name: "Speaking Task", content: generated.sections.speaking_task },
        { name: "Homework", content: generated.sections.homework },
      ]
    : [];

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
          {sectionsList.map((section) => {
            const Icon = sectionIcons[section.name] || BookOpen;
            return (
              <GlassCard key={section.name} variant="subtle">
                <div className="flex items-center gap-2 mb-3"><Icon className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">{section.name}</h3></div>
                <p className="text-sm text-foreground whitespace-pre-line">{section.content}</p>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
