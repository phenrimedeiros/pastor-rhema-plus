// Prompts mestres para cada módulo do Pastor Rhema PLUS

export const PROMPTS = {
  series: (input) => `You are a seasoned pastoral advisor and sermon strategist. Generate a complete sermon series plan.

INPUTS:
- Theme/Book: ${input.theme}
- Number of Weeks: ${input.weeks}
- Church Profile: ${input.audience}
- Tone: ${input.tone}
- Primary Goal: ${input.goal}

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no preamble). Use this exact structure:
{
  "seriesName": "string — a compelling, memorable series title",
  "overview": "string — 2-3 sentences describing the arc and purpose of the series",
  "weeks": [
    {
      "week": 1,
      "title": "string — short evocative title",
      "passage": "string — specific Bible reference",
      "focus": "string — one phrase summarizing the week's emphasis",
      "bigIdea": "string — the central truth for this week",
      "nextStep": "string — what to study or prepare"
    }
  ]
}

RULES:
- Each week must build on the previous one with clear progression
- Passages must be sequential if from the same book
- Focus phrases must be distinct — never repeat ideas
- The series must feel intentionally planned, not randomly assembled
- Language must be pastoral, warm, and accessible
- Big ideas must be theologically grounded and practically oriented`,

  study: (input) => `You are a biblical scholar and pastoral mentor. Provide deep study material for sermon preparation.

PASSAGE: ${input.passage}
SERMON TITLE: ${input.title}
FOCUS: ${input.focus}
SERIES CONTEXT: ${input.seriesContext || "Standalone sermon"}

RESPOND ONLY IN VALID JSON:
{
  "contextSummary": "string — 3-4 sentences on the literary and historical context of this passage",
  "theologicalInsight": "string — 2-3 sentences on the key theological truth",
  "pastoralAngle": "string — 2-3 sentences on how this text addresses real congregational needs",
  "centralTruth": "string — one sentence capturing the core truth",
  "pastoralNeed": "string — one sentence on the human need this addresses",
  "preachingDirection": "string — one sentence suggesting the sermonic movement",
  "keyTerms": ["string — 3 important Greek/Hebrew terms or concepts with brief definitions"],
  "crossReferences": ["string — 3 relevant supporting passages"]
}

RULES:
- Ground everything in the actual text, not generic theology
- Theological insight must be specific to this passage, not a general doctrine summary
- Pastoral angle must address real situations congregants face
- Language should be scholarly but accessible — no academic jargon without explanation`,

  builder: (input) => `You are an expert homiletics mentor. Build a complete sermon structure.

PASSAGE: ${input.passage}
TITLE DIRECTION: ${input.title}
CENTRAL TRUTH: ${input.centralTruth || "From the passage study"}
FOCUS: ${input.focus}
TONE: ${input.tone || "Pastoral"}${input.previousContext ? `

SERIES CONTINUITY (previous week):
- Title: ${input.previousContext.title}
- Passage: ${input.previousContext.passage}
- Big Idea: ${input.previousContext.bigIdea || "Not available"}
- Main Point: ${input.previousContext.mainPoint || "Not available"}
Use this to create natural continuity — reference what was explored last week and build forward. Do not repeat the same ideas.` : ""}

RESPOND ONLY IN VALID JSON:
{
  "titleOptions": ["string — 3 distinct title options"],
  "bigIdea": "string — the one-sentence sermon thesis",
  "introduction": "string — 3-4 sentences suggesting how to open the sermon",
  "points": [
    {
      "label": "Point 1",
      "statement": "string — clear point statement",
      "explanation": "string — 2-3 sentences developing the point from the text",
      "transition": "string — 1 sentence transitioning to the next point"
    }
  ],
  "conclusion": "string — 3-4 sentences suggesting how to close with clarity and weight",
  "callToAction": "string — one specific, concrete response the congregation can take this week"
}

RULES:
- Always produce exactly 3 points
- Points must progress logically — not just be 3 parallel ideas
- Each point must come FROM the text, not be imposed onto it
- Introduction must create genuine tension or curiosity
- Conclusion must resolve the sermon's movement, not just repeat the big idea
- Call to action must be specific and doable, not vague ("pray more")`,

  illustrations: (input) => `You are a pastoral communicator. Generate vivid sermon illustrations.

SERMON POINTS:
${input.points.map((p, i) => `Point ${i + 1}: ${p.statement}`).join("\n")}

PASSAGE: ${input.passage}
AUDIENCE: ${input.audience || "General Sunday congregation"}

RESPOND ONLY IN VALID JSON:
{
  "illustrations": [
    {
      "forPoint": "Point 1",
      "story": "string — a brief, vivid illustration (3-5 sentences max)",
      "connection": "string — 1 sentence explaining how this connects to the point",
      "application": "string — 1 sentence showing why this matters to the listener"
    }
  ]
}

RULES:
- One illustration per point (3 total)
- Stories must be realistic and relatable — no clichéd missionary tales
- Mix types: everyday moment, historical reference, metaphor/analogy
- Each must CLARIFY the point, not compete with it
- Language must be pulpit-ready — the pastor could use this almost verbatim
- Avoid illustrations that require lengthy setup`,

  application: (input) => `You are a pastoral life coach. Generate practical applications for a sermon.

BIG IDEA: ${input.bigIdea}
SERMON POINTS:
${input.points.map((p, i) => `Point ${i + 1}: ${p.statement}`).join("\n")}

PASSAGE: ${input.passage}
AUDIENCE: ${input.audience || "General Sunday congregation"}

RESPOND ONLY IN VALID JSON:
{
  "applications": [
    {
      "forPoint": "Point 1",
      "action": "string — specific, concrete action step",
      "context": "string — when/where this applies in ordinary life",
      "encouragement": "string — a brief pastoral word to motivate follow-through"
    }
  ],
  "weeklyChallenge": "string — one overarching challenge for the whole congregation this week",
  "reflectionQuestions": ["string — 3 questions for personal or small group reflection"]
}

RULES:
- Actions must be specific and doable THIS WEEK — not aspirational platitudes
- Context must reference real daily situations (work, family, conflict, rest)
- Each application must flow directly from the sermon point
- Weekly challenge must be memorable and repeatable
- Reflection questions must provoke honest self-examination`,
};

export default PROMPTS;
