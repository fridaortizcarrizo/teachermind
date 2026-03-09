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

    const systemPrompt = `You are an expert ESL/EFL lesson planner who creates EXTENSIVE, highly detailed lesson plans for English language students. Your lessons are 6-7 pages long and follow a very specific structure.

You MUST respond with valid JSON only, no markdown, no extra text. The JSON must have this exact structure:
{
  "title": "LESSON X – THEME TITLE IN CAPS",
  "objective": "Main lesson objective",
  "grammar_focus": ["grammar topic 1", "grammar topic 2"],
  "vocabulary_focus": ["vocab area 1", "vocab area 2"],
  "sections": {
    "homework_check": "Detailed homework review section with specific sentences/answers the student should have prepared. Include PART 1 (affirmative sentences), PART 2 (negative sentences), PART 3 (questions + answers), PART 4 (contrast). Then a 'Talk About' section with guided questions.",
    "vocabulary": {
      "intro": "Brief intro sentence about the vocabulary theme",
      "categories": [
        {
          "name": "Category Name",
          "words": [
            {"english": "word", "spanish": "traducción"},
            {"english": "word", "spanish": "traducción"}
          ]
        }
      ]
    },
    "reading_text": "A reading/listening section with 2-3 short texts (each 4-6 sentences) about real people or situations related to the lesson topic. Each text should be a paragraph describing someone without revealing their name, using the target vocabulary and grammar. The texts should be engaging and related to the student's interests.",
    "exercises": [
      {
        "type": "guess_match",
        "title": "A) GUESS WHO IS WHO",
        "instruction": "Ask questions about the people/topics to discover who they are. You can use questions like:",
        "content": "List of example questions the student can ask, then a matching table"
      },
      {
        "type": "verb_hunt",
        "title": "B) VERB HUNT",
        "instruction": "Find 12 verbs in the texts.",
        "content": "Example: verb1 – verb2 – verb3"
      },
      {
        "type": "match_meaning",
        "title": "C) MATCH THE VERB",
        "instruction": "Match the verb with the meaning.",
        "content": "verb1 → meaning in Spanish\\nverb2 → meaning in Spanish"
      },
      {
        "type": "comprehension",
        "title": "D) READING COMPREHENSION",
        "instruction": "Answer these questions about the texts.",
        "content": "Who does X?\\n_______________\\nWho does Y?\\n_______________"
      },
      {
        "type": "fill_blanks",
        "title": "E) COMPLETE THE SENTENCE",
        "instruction": "Use the verbs: verb1 - verb2 - verb3 - verb4 - verb5 - verb6",
        "content": "1. She ___ songs. / Does she ___ songs?\\n2. She ___ music. / Does she ___ music?"
      },
      {
        "type": "question_practice",
        "title": "F) QUESTIONS PRACTICE",
        "instruction": "Create questions with the sentences above then answer.",
        "content": "Answer: Yes, she does. / No, she doesn't."
      },
      {
        "type": "personal",
        "title": "G) YOU",
        "instruction": "Complete the sentences about yourself.",
        "content": "1. I ___ ...\\n2. I ___ ...\\n3. I sometimes ___ ...\\n4. I don't ___ ..."
      }
    ],
    "speaking_task": "🎤 FINAL SPEAKING\\n\\nChoose one topic/person from the texts.\\n\\nGuided questions:\\n- Who is she/he?\\n- What does she/he do?\\n- Does she/he [specific question]?\\n- Do you like [topic]?\\n- Why?\\n\\nExample answers provided for guidance.",
    "homework": "📝 HOMEWORK – [CREATIVE TITLE]\\n\\nChoose one [relevant topic].\\n⚠ Don't write the name.\\n\\nPART 1 – Write Clues\\nWrite 5 sentences about the person/topic.\\nShe / He ___.\\n\\nPART 2 – Negative Clue\\nWrite one negative sentence.\\nHe / She doesn't ___.\\n\\nPART 3 – Question\\nWrite one question.\\nDoes he / she ___?\\n\\n🎯 Next Class: In the next class, your teacher will ask questions and try to guess."
  }
}

CRITICAL GUIDELINES:
- The lesson must be EXTENSIVE - equivalent to 6-7 printed pages
- Include AT LEAST 15-20 vocabulary words organized in 3-5 categories with Spanish translations
- Write 2-3 reading texts of 4-6 sentences each, about real-world topics related to the student's interests
- Include 6-8 different exercise types (guess/match, verb hunt, match meaning, comprehension, fill blanks, question practice, personal sentences)
- The homework must be multi-part and creative
- The speaking task must have guided questions with example answers
- Tailor everything to the student's level, profession, interests, and objectives
- Address their difficulties and build on their strengths
- Reference recent lesson history to ensure continuity and avoid repetition
- Focus on grammar topics that need review or haven't been consolidated
- Leave exercises BLANK (with blanks/underscores) - do NOT fill in the answers
- Include verb banks and word banks where appropriate`;

    const recentLessonsSummary = (recentLessons || []).slice(0, 5).map((l: any) =>
      `- ${l.title} (${l.date}): ${l.objective}. Grammar: ${(l.grammar_focus || []).join(", ")}. Status: ${l.status}`
    ).join("\n");

    const grammarSummary = (grammarTopics || []).map((g: any) =>
      `- ${g.topic}: status=${g.status}, times_worked=${g.times_worked}, errors=${(g.errors || []).join(", ")}`
    ).join("\n");

    const vocabSummary = (vocabulary || []).slice(0, 30).map((v: any) =>
      `- ${v.word} (${v.category}): ${v.status}`
    ).join("\n");

    const userPrompt = `Create an EXTENSIVE lesson plan for this student:

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

Create the next logical lesson. Make it VERY DETAILED and EXTENSIVE (6-7 pages worth of content). Include vocabulary tables, multiple reading texts, 6-8 exercises of different types, guided speaking, and creative multi-part homework. Leave all exercises blank for the student to complete.`;

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
