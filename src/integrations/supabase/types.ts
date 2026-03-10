export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      grammar_topics: {
        Row: {
          created_at: string
          errors: string[] | null
          id: string
          last_worked: string | null
          status: Database["public"]["Enums"]["grammar_status"]
          student_id: string
          times_worked: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          errors?: string[] | null
          id?: string
          last_worked?: string | null
          status?: Database["public"]["Enums"]["grammar_status"]
          student_id: string
          times_worked?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          errors?: string[] | null
          id?: string
          last_worked?: string | null
          status?: Database["public"]["Enums"]["grammar_status"]
          student_id?: string
          times_worked?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_topics_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_blocks: {
        Row: {
          class_days: string[]
          created_at: string
          end_date: string | null
          id: string
          lessons_completed: number
          objectives: string[] | null
          size: number
          start_date: string
          status: Database["public"]["Enums"]["block_status"]
          student_id: string
          title: string
          updated_at: string
          user_id: string
          weekly_frequency: number
        }
        Insert: {
          class_days?: string[]
          created_at?: string
          end_date?: string | null
          id?: string
          lessons_completed?: number
          objectives?: string[] | null
          size?: number
          start_date?: string
          status?: Database["public"]["Enums"]["block_status"]
          student_id: string
          title: string
          updated_at?: string
          user_id: string
          weekly_frequency?: number
        }
        Update: {
          class_days?: string[]
          created_at?: string
          end_date?: string | null
          id?: string
          lessons_completed?: number
          objectives?: string[] | null
          size?: number
          start_date?: string
          status?: Database["public"]["Enums"]["block_status"]
          student_id?: string
          title?: string
          updated_at?: string
          user_id?: string
          weekly_frequency?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_blocks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          block_id: string | null
          created_at: string
          date: string
          exercises: string[] | null
          grammar_explanation: string | null
          grammar_focus: string[] | null
          homework: string | null
          homework_check: string | null
          id: string
          objective: string
          observations: string | null
          speaking_task: string | null
          status: Database["public"]["Enums"]["lesson_status"]
          student_id: string
          time: string | null
          title: string
          updated_at: string
          user_id: string
          vocabulary_focus: string[] | null
          warm_up: string | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          date?: string
          exercises?: string[] | null
          grammar_explanation?: string | null
          grammar_focus?: string[] | null
          homework?: string | null
          homework_check?: string | null
          id?: string
          objective?: string
          observations?: string | null
          speaking_task?: string | null
          status?: Database["public"]["Enums"]["lesson_status"]
          student_id: string
          time?: string | null
          title: string
          updated_at?: string
          user_id: string
          vocabulary_focus?: string[] | null
          warm_up?: string | null
        }
        Update: {
          block_id?: string | null
          created_at?: string
          date?: string
          exercises?: string[] | null
          grammar_explanation?: string | null
          grammar_focus?: string[] | null
          homework?: string | null
          homework_check?: string | null
          id?: string
          objective?: string
          observations?: string | null
          speaking_task?: string | null
          status?: Database["public"]["Enums"]["lesson_status"]
          student_id?: string
          time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vocabulary_focus?: string[] | null
          warm_up?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: string
          created_at: string
          grammar_focus: string | null
          id: string
          lesson_id: string | null
          level: Database["public"]["Enums"]["cefr_level"]
          title: string
          topic: string
          type: Database["public"]["Enums"]["material_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          grammar_focus?: string | null
          id?: string
          lesson_id?: string | null
          level?: Database["public"]["Enums"]["cefr_level"]
          title: string
          topic?: string
          type?: Database["public"]["Enums"]["material_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          grammar_focus?: string | null
          id?: string
          lesson_id?: string | null
          level?: Database["public"]["Enums"]["cefr_level"]
          title?: string
          topic?: string
          type?: Database["public"]["Enums"]["material_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_modules: {
        Row: {
          categories: Json
          created_at: string
          id: string
          profession: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          id?: string
          profession: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          profession?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_notes: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          student_id: string
          type: Database["public"]["Enums"]["note_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          student_id: string
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          student_id?: string
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number | null
          avatar: string | null
          created_at: string
          difficulties: string[] | null
          email: string | null
          id: string
          interests: string[] | null
          level: Database["public"]["Enums"]["cefr_level"]
          name: string
          notes: string | null
          objectives: string[] | null
          profession: string | null
          strengths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar?: string | null
          created_at?: string
          difficulties?: string[] | null
          email?: string | null
          id?: string
          interests?: string[] | null
          level?: Database["public"]["Enums"]["cefr_level"]
          name: string
          notes?: string | null
          objectives?: string[] | null
          profession?: string | null
          strengths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar?: string | null
          created_at?: string
          difficulties?: string[] | null
          email?: string | null
          id?: string
          interests?: string[] | null
          level?: Database["public"]["Enums"]["cefr_level"]
          name?: string
          notes?: string | null
          objectives?: string[] | null
          profession?: string | null
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          category: string
          context: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["vocab_status"]
          student_id: string
          translation: string | null
          updated_at: string
          user_id: string
          word: string
        }
        Insert: {
          category?: string
          context?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["vocab_status"]
          student_id: string
          translation?: string | null
          updated_at?: string
          user_id: string
          word: string
        }
        Update: {
          category?: string
          context?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["vocab_status"]
          student_id?: string
          translation?: string | null
          updated_at?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      block_status: "active" | "completed" | "paused"
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      grammar_status:
        | "not_started"
        | "introduced"
        | "practicing"
        | "consolidated"
        | "needs_review"
      lesson_status: "planned" | "completed" | "cancelled"
      material_type:
        | "reading"
        | "listening"
        | "grammar_drill"
        | "speaking_prompt"
        | "vocabulary_task"
        | "matching"
        | "fill_blanks"
        | "true_false"
        | "multiple_choice"
      note_type: "observation" | "evaluation" | "milestone"
      suggestion_priority: "low" | "medium" | "high"
      suggestion_type: "grammar" | "speaking" | "review" | "warning" | "tip"
      vocab_status: "new" | "practicing" | "consolidated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      block_status: ["active", "completed", "paused"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      grammar_status: [
        "not_started",
        "introduced",
        "practicing",
        "consolidated",
        "needs_review",
      ],
      lesson_status: ["planned", "completed", "cancelled"],
      material_type: [
        "reading",
        "listening",
        "grammar_drill",
        "speaking_prompt",
        "vocabulary_task",
        "matching",
        "fill_blanks",
        "true_false",
        "multiple_choice",
      ],
      note_type: ["observation", "evaluation", "milestone"],
      suggestion_priority: ["low", "medium", "high"],
      suggestion_type: ["grammar", "speaking", "review", "warning", "tip"],
      vocab_status: ["new", "practicing", "consolidated"],
    },
  },
} as const
