import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useLessonBlocks } from "@/hooks/useLessonBlocks";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STUDENT_COLORS: Record<string, string> = {};
const PALETTE = [
  "bg-primary/80 text-primary-foreground",
  "bg-accent/80 text-accent-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-destructive/70 text-destructive-foreground",
  "bg-muted-foreground/60 text-background",
];

function getStudentColor(studentId: string): string {
  if (!STUDENT_COLORS[studentId]) {
    const idx = Object.keys(STUDENT_COLORS).length % PALETTE.length;
    STUDENT_COLORS[studentId] = PALETTE[idx];
  }
  return STUDENT_COLORS[studentId];
}

export default function CalendarPage() {
  const { data: lessons = [] } = useLessons();
  const { data: students = [] } = useStudents();
  const { data: blocks = [] } = useLessonBlocks();
  const navigate = useNavigate();

  // Default to most recent lesson month or current month
  const initialMonth = useMemo(() => {
    if (lessons.length === 0) return new Date();
    const sorted = [...lessons].sort((a, b) => b.date.localeCompare(a.date));
    return parseISO(sorted[0].date);
  }, [lessons]);

  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);

  // Build a map of date -> lessons
  const lessonsByDate = useMemo(() => {
    const map: Record<string, typeof lessons> = {};
    lessons.forEach((l) => {
      if (!map[l.date]) map[l.date] = [];
      map[l.date].push(l);
    });
    return map;
  }, [lessons]);

  // Build calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-3 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentMonth(new Date())}>
            Hoy
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr border-l border-border">
        {weeks.flat().map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayLessons = lessonsByDate[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`border-r border-b border-border p-1 flex flex-col min-h-0 transition-colors ${
                !isCurrentMonth ? "bg-muted/30" : "bg-card/50 hover:bg-card/80"
              }`}
            >
              {/* Day number + add button */}
              <div className="flex items-center justify-between shrink-0 mb-0.5">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : !isCurrentMonth
                        ? "text-muted-foreground/50"
                        : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {isCurrentMonth && (
                  <button
                    onClick={() => navigate(`/generate-lesson?date=${dateStr}`)}
                    className="opacity-0 group-hover:opacity-100 hover:!opacity-100 text-muted-foreground hover:text-primary transition-opacity h-5 w-5 flex items-center justify-center rounded hover:bg-primary/10"
                    style={{ opacity: dayLessons.length === 0 ? 0.3 : 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = dayLessons.length === 0 ? "0.3" : "0")}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Lesson chips */}
              <div className="flex flex-col gap-0.5 overflow-y-auto min-h-0 flex-1 scrollbar-thin">
                {dayLessons.map((lesson) => {
                  const student = students.find((s) => s.id === lesson.student_id);
                  const colorClass = student ? getStudentColor(student.id) : "bg-muted text-muted-foreground";
                  return (
                    <Link
                      key={lesson.id}
                      to={`/lessons/${lesson.id}`}
                      className={`block rounded px-1.5 py-0.5 text-[10px] leading-tight truncate hover:ring-1 hover:ring-ring transition-all cursor-pointer ${colorClass} ${
                        lesson.status === "completed" ? "opacity-90" : "opacity-70 border border-dashed border-current"
                      }`}
                      title={`${lesson.title} — ${student?.name ?? ""}`}
                    >
                      <span className="font-medium truncate block">
                        {lesson.status === "completed" ? "✓" : "○"}{" "}
                        {student?.name?.split(" ")[0] ?? ""}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-2 py-2 text-xs text-muted-foreground border-t border-border shrink-0">
        <span className="flex items-center gap-1">✓ Dictada</span>
        <span className="flex items-center gap-1 opacity-70 border border-dashed border-muted-foreground rounded px-1">○ Planificada</span>
        {students.slice(0, 5).map((s) => (
          <span key={s.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${getStudentColor(s.id)}`}>
            {s.name.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}
