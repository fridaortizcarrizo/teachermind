import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCreateStudent, useUpdateStudent } from "@/hooks/useStudents";
import { toast } from "sonner";
import { Loader2, ClipboardPaste } from "lucide-react";

interface ImportQuestionnaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, updates an existing student instead of creating */
  studentId?: string;
}

export function ImportQuestionnaireDialog({ open, onOpenChange, studentId }: ImportQuestionnaireDialogProps) {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();

  const handleImport = async () => {
    if (!text.trim()) {
      toast.error("Pegá las respuestas del cuestionario primero");
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-questionnaire", {
        body: { text: text.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (studentId) {
        await updateStudent.mutateAsync({
          id: studentId,
          name: data.name,
          age: data.age ?? null,
          profession: data.profession ?? null,
          email: data.email ?? null,
          level: data.level || "A1",
          objectives: data.objectives || [],
          interests: data.interests || [],
          difficulties: data.difficulties || [],
          strengths: data.strengths || [],
          notes: data.notes || null,
        });
        toast.success("Perfil actualizado con los datos del cuestionario");
      } else {
        await createStudent.mutateAsync({
          name: data.name,
          age: data.age ?? null,
          profession: data.profession ?? null,
          email: data.email ?? null,
          level: data.level || "A1",
          objectives: data.objectives || [],
          interests: data.interests || [],
          difficulties: data.difficulties || [],
          strengths: data.strengths || [],
          notes: data.notes || null,
        });
        toast.success(`${data.name} creada exitosamente desde el cuestionario`);
      }

      setText("");
      onOpenChange(false);
    } catch (e: any) {
      console.error("Import error:", e);
      toast.error(e.message || "Error al importar cuestionario");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="h-5 w-5" />
            {studentId ? "Actualizar desde cuestionario" : "Importar desde cuestionario"}
          </DialogTitle>
          <DialogDescription>
            Pegá las respuestas del cuestionario de Google Forms y la IA extraerá automáticamente los datos del perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionnaire-text">Respuestas del cuestionario</Label>
            <Textarea
              id="questionnaire-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Pegá acá las respuestas del formulario, por ejemplo:\n\nNombre: Mili\nOcupación: Arquitecta\n¿Por qué querés tomar clases? Para lograr un B1...\n¿Qué cosas te gustan? Arquitectura, rock nacional, series...\n...`}
              rows={14}
              className="font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Podés pegar el texto en cualquier formato — la IA se encarga de identificar los campos.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={isParsing || !text.trim()} className="gap-2">
            {isParsing ? <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</> : "Importar con IA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
