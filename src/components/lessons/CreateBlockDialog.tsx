import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateLessonBlock } from "@/hooks/useLessonBlocks";
import { useStudents } from "@/hooks/useStudents";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedStudentId?: string;
}

export function CreateBlockDialog({ open, onOpenChange, preselectedStudentId }: Props) {
  const { data: students = [] } = useStudents();
  const createBlock = useCreateLessonBlock();
  const [studentId, setStudentId] = useState(preselectedStudentId || "");
  const [title, setTitle] = useState("");
  const [size, setSize] = useState(8);
  const [objectives, setObjectives] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [weeklyFrequency, setWeeklyFrequency] = useState(2);
  const [classDays, setClassDays] = useState<string[]>([]);

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
    if (!studentId || !title) return;
    try {
      await createBlock.mutateAsync({
        student_id: studentId,
        title,
        size,
        objectives: objectives.split(",").map((o) => o.trim()).filter(Boolean),
        start_date: format(startDate, "yyyy-MM-dd"),
        weekly_frequency: weeklyFrequency,
        class_days: classDays,
      } as any);
      toast({ title: "Bloque creado", description: `${title} — ${size} clases` });
      onOpenChange(false);
      setTitle("");
      setObjectives("");
      setSize(8);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Bloque de Clases</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Alumno</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar alumno..." /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.level})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paquete Marzo 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad de clases</Label>
              <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[4, 8, 12, 16].map((n) => <SelectItem key={n} value={String(n)}>{n} clases</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
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
              <Label>Días de clase</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {dayOptions.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${classDays.includes(d.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label>Objetivos (separados por coma)</Label>
            <Input value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Present Simple, Vocabulary expansion..." />
          </div>
          <Button onClick={handleSubmit} disabled={!studentId || !title || createBlock.isPending} className="w-full">
            {createBlock.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Crear Bloque
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
