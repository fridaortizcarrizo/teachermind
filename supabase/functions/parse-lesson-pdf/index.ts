import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { studentId, pdfText } = await req.json();
    if (!studentId || !pdfText) {
      return new Response(JSON.stringify({ error: "studentId and pdfText are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a data extraction assistant for an English teacher's student management app.
Given the text content of a lesson history PDF, extract ALL lessons, grammar topics, vocabulary, and progress observations.

Use the extract_lesson_data tool to return structured data. The PDF may contain multiple lessons. Extract as much detail as possible.

For dates: use YYYY-MM-DD format. If only day/month given, assume year 2025.
For grammar status: use "introduced", "practicing", or "consolidated" based on context.
For vocabulary status: use "new", "practicing", or "consolidated".
For lesson status: use "completed" for past lessons.
For note types: use "observation" for general notes, "milestone" for achievements.

The text may be in Spanish or English. Extract all information regardless of language.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: pdfText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_lesson_data",
              description: "Extract structured lesson history from PDF text content.",
              parameters: {
                type: "object",
                properties: {
                  lessons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        date: { type: "string", description: "YYYY-MM-DD" },
                        objective: { type: "string" },
                        warm_up: { type: "string" },
                        grammar_focus: { type: "array", items: { type: "string" } },
                        grammar_explanation: { type: "string" },
                        vocabulary_focus: { type: "array", items: { type: "string" } },
                        exercises: { type: "array", items: { type: "string" } },
                        speaking_task: { type: "string" },
                        homework: { type: "string" },
                        observations: { type: "string" },
                        status: { type: "string", enum: ["planned", "completed", "cancelled"] },
                      },
                      required: ["title", "date", "objective", "status"],
                    },
                  },
                  grammar_topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        status: { type: "string", enum: ["not_started", "introduced", "practicing", "consolidated", "needs_review"] },
                        times_worked: { type: "number" },
                        last_worked: { type: ["string", "null"], description: "YYYY-MM-DD" },
                        errors: { type: "array", items: { type: "string" } },
                      },
                      required: ["topic", "status", "times_worked"],
                    },
                  },
                  vocabulary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        word: { type: "string" },
                        translation: { type: ["string", "null"] },
                        category: { type: "string" },
                        status: { type: "string", enum: ["new", "practicing", "consolidated"] },
                        context: { type: ["string", "null"] },
                      },
                      required: ["word", "category", "status"],
                    },
                  },
                  progress_notes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        date: { type: "string", description: "YYYY-MM-DD" },
                        type: { type: "string", enum: ["observation", "evaluation", "milestone"] },
                      },
                      required: ["content", "date", "type"],
                    },
                  },
                },
                required: ["lessons", "grammar_topics", "vocabulary", "progress_notes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_lesson_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const extracted = JSON.parse(toolCall.function.arguments);

    // Batch insert all extracted data
    const errors: string[] = [];

    // Insert lessons
    if (extracted.lessons?.length > 0) {
      const lessonsToInsert = extracted.lessons.map((l: any) => ({
        student_id: studentId,
        user_id: userId,
        title: l.title,
        date: l.date,
        objective: l.objective || "",
        warm_up: l.warm_up || "",
        grammar_focus: l.grammar_focus || [],
        grammar_explanation: l.grammar_explanation || "",
        vocabulary_focus: l.vocabulary_focus || [],
        exercises: l.exercises || [],
        speaking_task: l.speaking_task || "",
        homework: l.homework || "",
        observations: l.observations || null,
        status: l.status || "completed",
      }));
      const { error } = await supabase.from("lessons").insert(lessonsToInsert);
      if (error) errors.push(`Lessons: ${error.message}`);
    }

    // Insert grammar topics
    if (extracted.grammar_topics?.length > 0) {
      const grammarToInsert = extracted.grammar_topics.map((g: any) => ({
        student_id: studentId,
        user_id: userId,
        topic: g.topic,
        status: g.status || "introduced",
        times_worked: g.times_worked || 1,
        last_worked: g.last_worked || null,
        errors: g.errors || [],
      }));
      const { error } = await supabase.from("grammar_topics").insert(grammarToInsert);
      if (error) errors.push(`Grammar: ${error.message}`);
    }

    // Insert vocabulary
    if (extracted.vocabulary?.length > 0) {
      const vocabToInsert = extracted.vocabulary.map((v: any) => ({
        student_id: studentId,
        user_id: userId,
        word: v.word,
        translation: v.translation || null,
        category: v.category || "",
        status: v.status || "new",
        context: v.context || null,
      }));
      const { error } = await supabase.from("vocabulary").insert(vocabToInsert);
      if (error) errors.push(`Vocabulary: ${error.message}`);
    }

    // Insert progress notes
    if (extracted.progress_notes?.length > 0) {
      const notesToInsert = extracted.progress_notes.map((n: any) => ({
        student_id: studentId,
        user_id: userId,
        content: n.content,
        date: n.date,
        type: n.type || "observation",
      }));
      const { error } = await supabase.from("progress_notes").insert(notesToInsert);
      if (error) errors.push(`Progress notes: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      imported: {
        lessons: extracted.lessons?.length || 0,
        grammar_topics: extracted.grammar_topics?.length || 0,
        vocabulary: extracted.vocabulary?.length || 0,
        progress_notes: extracted.progress_notes?.length || 0,
      },
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-lesson-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
