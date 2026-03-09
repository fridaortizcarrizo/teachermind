import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { student, recentLessons, grammarTopics, vocabulary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert ESL/EFL lesson planner. You create detailed, personalized lesson plans for English language students.

You MUST respond with valid JSON only, no markdown, no extra text. The JSON must have this exact structure:
{
  "title": "Lesson title",
  "objective": "Main lesson objective",
  "grammar_focus": ["grammar topic 1", "grammar topic 2"],
  "vocabulary_focus": ["vocab area 1"],
  "sections": {
    "homework_check": "Content for reviewing previous homework",
    "warm_up": "5-minute warm-up activity",
    "grammar_focus": "Grammar explanation and key points",
    "exercises": ["Exercise 1 description", "Exercise 2 description", "Exercise 3 description"],
    "speaking_task": "Speaking/conversation activity",
    "homework": "Homework assignment"
  }
}

Guidelines:
- Tailor content to the student's level, profession, interests, and objectives
- Address their difficulties and build on their strengths
- Reference their recent lesson history to ensure continuity and avoid repetition
- Focus on grammar topics that need review or haven't been consolidated
- Include profession-specific vocabulary when relevant
- Make exercises practical and engaging for the student's age and interests`;

    const recentLessonsSummary = (recentLessons || []).slice(0, 5).map((l: any) =>
      `- ${l.title} (${l.date}): ${l.objective}. Grammar: ${(l.grammar_focus || []).join(", ")}. Status: ${l.status}`
    ).join("\n");

    const grammarSummary = (grammarTopics || []).map((g: any) =>
      `- ${g.topic}: status=${g.status}, times_worked=${g.times_worked}, errors=${(g.errors || []).join(", ")}`
    ).join("\n");

    const vocabSummary = (vocabulary || []).slice(0, 30).map((v: any) =>
      `- ${v.word} (${v.category}): ${v.status}`
    ).join("\n");

    const userPrompt = `Create a lesson plan for this student:

**Student Profile:**
- Name: ${student.name}
- Level: ${student.level}
- Age: ${student.age || "unknown"}
- Profession: ${student.profession || "not specified"}
- Interests: ${(student.interests || []).join(", ") || "none listed"}
- Objectives: ${(student.objectives || []).join(", ") || "none listed"}
- Difficulties: ${(student.difficulties || []).join(", ") || "none listed"}
- Strengths: ${(student.strengths || []).join(", ") || "none listed"}
- Notes: ${student.notes || "none"}

**Recent Lessons (most recent first):**
${recentLessonsSummary || "No previous lessons"}

**Grammar Topics Tracked:**
${grammarSummary || "No grammar topics tracked yet"}

**Vocabulary (recent):**
${vocabSummary || "No vocabulary tracked yet"}

Create the next logical lesson for this student. Ensure continuity with previous lessons and address areas that need improvement.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle possible markdown wrapping)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();
    
    const lesson = JSON.parse(jsonStr);

    return new Response(JSON.stringify(lesson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
