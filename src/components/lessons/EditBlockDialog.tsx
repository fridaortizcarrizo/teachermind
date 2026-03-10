import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useUpdateLessonBlock } from "@/hooks/useLessonBlocks";
import { toast } from "sonner";
import type { LessonBlock } from "@/hooks/useLessonBlocks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: LessonBlock;
}

export function EditBlockDialog({ open, onOpenChange, block }: Props) {
  const updateBlock = useUpdateLessonBlock();
  const [title, setTitle] = useState(block.title);
  const [size, setSize] = useState(block.size);
  const [lessonsCompleted, setLessonsCompleted] = useState(block.lessons_completed);
  const [objectives, setObjectives] = useState((block.objectives ?? []).join(", "));
  const [startDate, setStartDate] = useState<Date>(parseISO(block.start_date));
  const [weeklyFrequency, setWeeklyFrequency] = useState(block.weekly_frequency);
  const [classDays, setClassDays] = useState<string[]>(block.class_days);
  const [status, setStatus] = useState(block.status);

  useEffect(() => {
    setTitle(block.title);
    setSize(block.size);
    setLessonsCompleted(block.lessons_completed);
    setObjectives((block.objectives ?? []).join(", "));
    setStartDate(parseISO(block.start_date));
    setWeeklyFrequency(block.weekly_frequency);
    setClassDays(block.class_days);
    setStatus(block.status);
  }, [block]);

  const dayOptions = [
    { value: "monday", label: "Lun" },
    { value: "tuesday", label: "Mar" },
    { value: "wednesday", label: "Mié" },
    { value: "thursday", label: "Jue" },
    { value: "friday", label: "Vie" },
    { value: "saturday", label: "Sáb" },
  ];

  const toggleDay = (day: string) => {
    setClassDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleSubmit = async () => {
    if (!title) return;
    try {
      await updateBlock.mutateAsync({
        id: block.id,
        title,
        size,
        lessons_completed: lessonsCompleted,
        objectives: objectives.split(",").map((o) => o.trim()).filter(Boolean),
        start_date: format(startDate, "yyyy-MM-dd"),
        weekly_frequency: weeklyFrequency,
        class_days: classDays,
        status: status as any,
      });
      toast.success("Bloque actualizado");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Bloque</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Clases totales</Label>
              <Input type="number" value={size} onChange={(e) => setSize(Number(e.target.value))} min={1} />
            </div>
            <div>
              <Label>Completadas</Label>
              <Input type="number" value={lessonsCompleted} onChange={(e) => setLessonsCompleted(Number(e.target.value))} min={0} max={size} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="completed">Completo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frecuencia semanal</Label>
              <Select value={String(weeklyFrequency)} onValueChange={(v) => setWeeklyFrequency(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}x por semana</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label>Días de clase</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {dayOptions.map((d) => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${classDays.includes(d.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Objetivos (separados por coma)</Label>
            <Input value={objectives} onChange={(e) => setObjectives(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} disabled={!title || updateBlock.isPending} className="w-full">
            {updateBlock.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
