import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { Search, Clock } from "lucide-react";

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
        <p className="text-muted-foreground mt-1">Browse and search all recorded lessons</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by topic, grammar, or objective..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const student = students.find((s) => s.id === lesson.student_id);
            return (
              <GlassCard key={lesson.id} variant="subtle" className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{lesson.title}</h3>
                    {student && <GlassBadge level={student.level} variant="level" />}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${lesson.status === 'completed' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-amber-500/20 text-amber-800'}`}>{lesson.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.date}</span>
                </div>
                {student && <p className="text-xs text-primary font-medium mb-1">{student.name}</p>}
                <p className="text-sm text-muted-foreground">{lesson.objective}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(lesson.grammar_focus ?? []).map((g) => <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{g}</span>)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs text-muted-foreground">
                  <div><span className="font-medium">Speaking:</span> {lesson.speaking_task}</div>
                  <div><span className="font-medium">Homework:</span> {lesson.homework}</div>
                  {lesson.observations && <div><span className="font-medium">Notes:</span> {lesson.observations}</div>}
                </div>
              </GlassCard>
            );
          })}
          {filtered.length === 0 && (
            <GlassCard variant="subtle" className="text-center py-8">
              <p className="text-muted-foreground">No lessons found matching your search.</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
