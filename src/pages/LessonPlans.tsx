import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessonBlocks, useBlockLessonCounts } from "@/hooks/useLessonBlocks";
import { useStudents } from "@/hooks/useStudents";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateBlockDialog } from "@/components/lessons/CreateBlockDialog";

export default function LessonPlans() {
  const { data: lessonBlocks = [], isLoading } = useLessonBlocks();
  const { data: students = [] } = useStudents();
  const [createOpen, setCreateOpen] = useState(false);

  const blockIds = useMemo(() => lessonBlocks.map((b) => b.id), [lessonBlocks]);
  const { data: blockCounts = {} } = useBlockLessonCounts(blockIds);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson Plans</h1>
          <p className="text-muted-foreground mt-1">Manage lesson blocks and long-term planning</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setCreateOpen(true)}>
          <Layers className="h-4 w-4" />New Block
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      ) : lessonBlocks.length === 0 ? (
        <GlassCard variant="subtle" className="text-center py-12">
          <p className="text-muted-foreground">No lesson blocks yet. Create one to start planning!</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {lessonBlocks.map((block) => {
            const student = students.find((s) => s.id === block.student_id);
            const counts = blockCounts[block.id];
            const realCompleted = counts?.total ?? block.lessons_completed;
            const progress = (realCompleted / block.size) * 100;
            const remaining = block.size - realCompleted;
            return (
              <GlassCard key={block.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg font-display">{block.title}</h3>
                      {student && <GlassBadge level={student.level} variant="level" />}
                    </div>
                    {student && <p className="text-sm text-muted-foreground">{student.name}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${block.status === 'active' ? 'bg-emerald-500/20 text-emerald-800' : block.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {block.status}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{realCompleted} / {block.size} lessons {remaining <= 2 && block.status === 'active' && `⚠️ ${remaining} left`}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Objectives</p>
                  <div className="flex flex-wrap gap-1">
                    {(block.objectives ?? []).map((o) => (
                      <span key={o} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{o}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>Inicio: {block.start_date}</span>
                  {block.end_date && <span>· Fin: {block.end_date}</span>}
                  {block.weekly_frequency && <span>· {block.weekly_frequency}x/sem</span>}
                  {(block.class_days ?? []).length > 0 && (
                    <span>· {block.class_days.map((d: string) => {
                      const labels: Record<string, string> = { monday: "Lun", tuesday: "Mar", wednesday: "Mié", thursday: "Jue", friday: "Vie", saturday: "Sáb" };
                      return labels[d] || d;
                    }).join(", ")}</span>
                  )}
                </div>
                <div className="flex gap-1 mt-4">
                  {Array.from({ length: block.size }).map((_, i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full ${i < realCompleted ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <CreateBlockDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
