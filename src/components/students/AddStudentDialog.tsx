import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStudent } from "@/hooks/useStudents";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type CefrLevel = Database["public"]["Enums"]["cefr_level"];
const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function splitLines(text: string): string[] {
  return text.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
}

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStudentDialog({ open, onOpenChange }: AddStudentDialogProps) {
  const createStudent = useCreateStudent();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<CefrLevel>("A1");

  // Questionnaire fields
  const [objectives, setObjectives] = useState("");
  const [interests, setInterests] = useState("");
  const [difficulties, setDifficulties] = useState("");
  const [strengths, setStrengths] = useState("");

  // Notes fields (combined into notes)
  const [availability, setAvailability] = useState("");
  const [classStyle, setClassStyle] = useState("");
  const [avoid, setAvoid] = useState("");
  const [onlineExp, setOnlineExp] = useState("");
  const [extra, setExtra] = useState("");

  const reset = () => {
    setName(""); setAge(""); setProfession(""); setEmail(""); setLevel("A1");
    setObjectives(""); setInterests(""); setDifficulties(""); setStrengths("");
    setAvailability(""); setClassStyle(""); setAvoid(""); setOnlineExp(""); setExtra("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }

    const notesParts = [
      availability && `Disponibilidad: ${availability}`,
      classStyle && `Estilo de clase: ${classStyle}`,
      avoid && `Evitar: ${avoid}`,
      onlineExp && `Experiencia online: ${onlineExp}`,
      extra && `Notas adicionales: ${extra}`,
    ].filter(Boolean).join("\n");

    try {
      await createStudent.mutateAsync({
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        profession: profession.trim() || null,
        email: email.trim() || null,
        level,
        objectives: splitLines(objectives),
        interests: splitLines(interests),
        difficulties: splitLines(difficulties),
        strengths: splitLines(strengths),
        notes: notesParts || null,
      });
      toast.success(`${name.trim()} agregada exitosamente`);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Error al crear alumna");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Alumna</DialogTitle>
          <DialogDescription>Completá con los datos del cuestionario inicial</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Datos básicos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profession">Ocupación</Label>
                <Input id="profession" value={profession} onChange={e => setProfession(e.target.value)} placeholder="Arquitecta, diseñadora..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alumna@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nivel CEFR</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as CefrLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Questionnaire */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Cuestionario inicial</h3>
            <div className="space-y-2">
              <Label htmlFor="objectives">¿Por qué querés tomar clases? / Objetivos</Label>
              <Textarea id="objectives" value={objectives} onChange={e => setObjectives(e.target.value)} placeholder="Separar con comas o saltos de línea" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">¿Qué cosas te gustan? (intereses, hobbies)</Label>
              <Textarea id="interests" value={interests} onChange={e => setInterests(e.target.value)} placeholder="Separar con comas o saltos de línea" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulties">¿Cómo te sentís con el inglés hoy? / Dificultades</Label>
              <Textarea id="difficulties" value={difficulties} onChange={e => setDifficulties(e.target.value)} placeholder="Separar con comas o saltos de línea" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strengths">Fortalezas observadas (llena la profe)</Label>
              <Textarea id="strengths" value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="Separar con comas o saltos de línea" rows={2} />
            </div>
          </div>

          {/* Context notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contexto</h3>
            <div className="space-y-2">
              <Label htmlFor="availability">Disponibilidad horaria</Label>
              <Input id="availability" value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Tardes, desde las 17 hs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classStyle">¿Clases más estructuradas o conversacionales?</Label>
              <Input id="classStyle" value={classStyle} onChange={e => setClassStyle(e.target.value)} placeholder="Mixtas, conversacionales..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avoid">¿Algo que quieras evitar en las clases?</Label>
              <Input id="avoid" value={avoid} onChange={e => setAvoid(e.target.value)} placeholder="Clases largas y teóricas..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onlineExp">¿Experiencia con clases online?</Label>
              <Input id="onlineExp" value={onlineExp} onChange={e => setOnlineExp(e.target.value)} placeholder="Sí, uso Meet" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra">¿Algo más que quieras contarme?</Label>
              <Textarea id="extra" value={extra} onChange={e => setExtra(e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createStudent.isPending}>
              {createStudent.isPending ? "Guardando..." : "Guardar alumna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
