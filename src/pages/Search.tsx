import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Input } from "@/components/ui/input";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useVocabulary } from "@/hooks/useVocabulary";
import { Search as SearchIcon, BookOpen, FileText } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { data: lessons = [] } = useLessons();
  const { data: students = [] } = useStudents();
  const { data: vocabulary = [] } = useVocabulary();
  const q = query.toLowerCase();

  const matchedLessons = q ? lessons.filter((l) =>
    l.title.toLowerCase().includes(q) ||
    (l.grammar_focus ?? []).some((g) => g.toLowerCase().includes(q)) ||
    (l.vocabulary_focus ?? []).some((v) => v.toLowerCase().includes(q)) ||
    l.objective.toLowerCase().includes(q) ||
    (l.exercises ?? []).some((e) => e.toLowerCase().includes(q))
  ) : [];

  const matchedVocab = q ? vocabulary.filter((v) =>
    v.word.toLowerCase().includes(q) ||
    v.category.toLowerCase().includes(q) ||
    (v.translation && v.translation.toLowerCase().includes(q))
  ) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-1">Find lessons, exercises, vocabulary, and materials</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder='Try "prepositions", "architecture", "present simple"...' value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12 h-12 text-base bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl" />
      </div>

      {q && (
        <div className="space-y-6">
          {matchedLessons.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4" />Lessons ({matchedLessons.length})</h2>
              <div className="space-y-2">
                {matchedLessons.map((l) => {
                  const student = students.find((s) => s.id === l.student_id);
                  return (
                    <GlassCard key={l.id} variant="subtle" className="py-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{l.title}</h3>
                        {student && <GlassBadge level={student.level} variant="level" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{student?.name} · {l.date} · {(l.grammar_focus ?? []).join(", ")}</p>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}
          {matchedVocab.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><FileText className="h-4 w-4" />Vocabulary ({matchedVocab.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {matchedVocab.map((v) => (
                  <GlassCard key={v.id} variant="subtle" className="py-2 px-3">
                    <span className="font-semibold text-sm">{v.word}</span>
                    {v.translation && <span className="text-xs text-muted-foreground ml-2">({v.translation})</span>}
                    <p className="text-[10px] text-muted-foreground">{v.category}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
          {matchedLessons.length === 0 && matchedVocab.length === 0 && (
            <GlassCard variant="subtle" className="text-center py-8"><p className="text-muted-foreground">No results found for "{query}"</p></GlassCard>
          )}
        </div>
      )}

      {!q && (
        <GlassCard variant="subtle" className="text-center py-12">
          <SearchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Start typing to search across all your teaching content</p>
        </GlassCard>
      )}
    </div>
  );
}
