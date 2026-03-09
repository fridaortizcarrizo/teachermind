import { useParams, Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { students, lessons, grammarTopics, vocabulary, progressNotes } from "@/data/mock-data";
import { ArrowLeft, Sparkles, BookOpen, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const grammarStatusColors: Record<string, string> = {
  consolidated: "bg-emerald-500/20 text-emerald-800",
  practicing: "bg-sky-500/20 text-sky-800",
  introduced: "bg-amber-500/20 text-amber-800",
  needs_review: "bg-rose-500/20 text-rose-800",
  not_started: "bg-muted text-muted-foreground",
};

export default function StudentDetail() {
  const { id } = useParams();
  const student = students.find((s) => s.id === id);
  if (!student) return <div className="p-8 text-center text-muted-foreground">Student not found</div>;

  const studentLessons = lessons.filter((l) => l.studentId === id);
  const studentGrammar = grammarTopics.filter((g) => g.studentId === id);
  const studentVocab = vocabulary.filter((v) => v.studentId === id);
  const studentNotes = progressNotes.filter((n) => n.studentId === id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/students" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </Link>

      {/* Profile Header */}
      <GlassCard variant="strong" className="flex flex-col sm:flex-row items-start gap-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl font-display">
          {student.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <GlassBadge level={student.level} variant="level" />
          </div>
          <p className="text-muted-foreground">{student.profession} · Age {student.age}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {student.interests.map((i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{i}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Objectives</p>
              <ul className="text-sm space-y-1">{student.objectives.map((o) => <li key={o} className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 mt-1 text-primary shrink-0" />{o}</li>)}</ul>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Difficulties</p>
              <ul className="text-sm space-y-1">{student.difficulties.map((d) => <li key={d} className="flex items-start gap-1"><AlertCircle className="h-3 w-3 mt-1 text-destructive shrink-0" />{d}</li>)}</ul>
            </div>
          </div>
          {student.notes && <p className="text-sm text-muted-foreground mt-3 italic">📝 {student.notes}</p>}
        </div>
        <Link to="/generate-lesson">
          <Button className="gap-2 rounded-xl shrink-0"><Sparkles className="h-4 w-4" />Generate Lesson</Button>
        </Link>
      </GlassCard>

      {/* Tabs */}
      <Tabs defaultValue="history">
        <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
          <TabsTrigger value="history">Class History</TabsTrigger>
          <TabsTrigger value="grammar">Grammar</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-3 mt-4">
          {studentLessons.length === 0 && <p className="text-muted-foreground text-center py-8">No lessons recorded yet.</p>}
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
              <p className="text-sm text-muted-foreground">{lesson.objective}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {lesson.grammarFocus.map((g) => <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{g}</span>)}
                {lesson.vocabularyFocus.map((v) => <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{v}</span>)}
              </div>
              {lesson.observations && <p className="text-xs text-muted-foreground mt-2 italic">💬 {lesson.observations}</p>}
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="grammar" className="space-y-3 mt-4">
          {studentGrammar.map((g) => (
            <GlassCard key={g.id} variant="subtle" className="py-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{g.topic}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${grammarStatusColors[g.status]}`}>{g.status.replace("_", " ")}</span>
              </div>
              <p className="text-xs text-muted-foreground">Worked {g.timesWorked}× · Last: {g.lastWorked}</p>
              {g.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-destructive font-medium">Recurring errors:</p>
                  <ul className="text-xs text-muted-foreground">{g.errors.map((e) => <li key={e}>• {e}</li>)}</ul>
                </div>
              )}
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-4">
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
    </div>
  );
}
