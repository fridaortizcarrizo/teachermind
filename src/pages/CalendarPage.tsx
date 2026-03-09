import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Calendar } from "@/components/ui/calendar";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useLessonBlocks } from "@/hooks/useLessonBlocks";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, BookOpen, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: lessons = [] } = useLessons();
  const { data: students = [] } = useStudents();
  const { data: blocks = [] } = useLessonBlocks();

  const lessonDates = useMemo(() => {
    const dates = new Set<string>();
    lessons.forEach((l) => dates.add(l.date));
    return dates;
  }, [lessons]);

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
          <h2 className="text-lg font-semibold">
            {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : "Seleccioná un día"}
          </h2>

          {lessonsOnDate.length === 0 ? (
            <GlassCard variant="subtle" className="text-center py-8">
              <p className="text-muted-foreground">No hay clases este día</p>
            </GlassCard>
          ) : (
            lessonsOnDate.map((lesson) => {
              const student = students.find((s) => s.id === lesson.student_id);
              const block = lesson.block_id ? blocks.find((b) => b.id === lesson.block_id) : null;
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
                      {block && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
                          Clase {block.lessons_completed}/{block.size}
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
