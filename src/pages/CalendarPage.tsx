import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Calendar } from "@/components/ui/calendar";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useLessonBlocks, useBlockLessonCounts } from "@/hooks/useLessonBlocks";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, BookOpen, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { data: lessons = [] } = useLessons();
  const { data: students = [] } = useStudents();
  const { data: blocks = [] } = useLessonBlocks();

  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);
  const { data: blockCounts = {} } = useBlockLessonCounts(blockIds);

  // Default to the most recent lesson's month
  useEffect(() => {
    if (!selectedDate && lessons.length > 0) {
      const sorted = [...lessons].sort((a, b) => b.date.localeCompare(a.date));
      setSelectedDate(parseISO(sorted[0].date));
    } else if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [lessons, selectedDate]);

  const lessonsOnDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return lessons.filter((l) => l.date === dateStr);
  }, [lessons, selectedDate]);

  const modifiers = useMemo(() => {
    const planned: Date[] = [];
    const completed: Date[] = [];
    lessons.forEach((l) => {
      const d = parseISO(l.date);
      if (l.status === "completed") completed.push(d);
      else if (l.status === "planned") planned.push(d);
    });
    return { planned, completed };
  }, [lessons]);

  const modifiersStyles = {
    planned: { backgroundColor: "hsl(var(--primary) / 0.2)", borderRadius: "50%" },
    completed: { backgroundColor: "hsl(var(--primary) / 0.6)", color: "white", borderRadius: "50%" },
  };

  const navigate = useNavigate();

  const handleAddLesson = () => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      navigate(`/generate-lesson?date=${dateStr}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
        <p className="text-muted-foreground mt-1">Vista mensual de clases planificadas y completadas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
        <GlassCard className="w-fit">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            defaultMonth={selectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="p-3 pointer-events-auto"
          />
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground px-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--primary) / 0.2)" }} /> Planificada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--primary) / 0.6)" }} /> Completada
            </span>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : "Seleccioná un día"}
            </h2>
            <Button size="sm" variant="outline" className="gap-1 rounded-xl" onClick={handleAddLesson}>
              <Plus className="h-4 w-4" /> Nueva clase
            </Button>
          </div>

          {lessonsOnDate.length === 0 ? (
            <GlassCard variant="subtle" className="text-center py-8">
              <p className="text-muted-foreground">No hay clases este día</p>
              <Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={handleAddLesson}>
                <Plus className="h-4 w-4" /> Agregar clase
              </Button>
            </GlassCard>
          ) : (
            lessonsOnDate.map((lesson) => {
              const student = students.find((s) => s.id === lesson.student_id);
              const block = lesson.block_id ? blocks.find((b) => b.id === lesson.block_id) : null;
              const counts = block ? blockCounts[block.id] : null;
              return (
                <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="block">
                  <GlassCard variant="subtle" className="hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{lesson.title}</h3>
                        {student && <GlassBadge level={student.level} variant="level" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${lesson.status === "completed" ? "bg-emerald-500/20 text-emerald-800" : "bg-amber-500/20 text-amber-800"}`}>
                          {lesson.status === "completed" ? "Dictada" : "Planificada"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    {student && <p className="text-sm text-muted-foreground mb-1">{student.name}</p>}
                    <p className="text-sm">{lesson.objective}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex flex-wrap gap-1 flex-1">
                        {(lesson.grammar_focus ?? []).map((g) => (
                          <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{g}</span>
                        ))}
                      </div>
                      {block && counts && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
                          Clase {counts.total}/{block.size}
                        </span>
                      )}
                    </div>
                  </GlassCard>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
