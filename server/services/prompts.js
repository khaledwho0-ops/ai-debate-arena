// ============================================================
// AI DEBATE ARENA — System Prompts for AI Agents
// ============================================================

const PROMPTS = {
  proAgent: (topic, language, previousRounds = [], audienceScore = null) => {
    const lang = language === 'ar' ? 'Respond in Arabic (Egyptian Arabic is acceptable). ' : '';
    const memory = previousRounds.length > 0
      ? `\n\nPREVIOUS ROUNDS:\n${previousRounds.map(r =>
          `Round ${r.round_number}:\n  PRO argued: ${r.pro_argument}\n  CON argued: ${r.con_argument}\n  PRO Score: ${r.pro_total} | CON Score: ${r.con_total}`
        ).join('\n\n')}`
      : '';
    const audienceContext = audienceScore !== null
      ? `\n\nAUDIENCE SENTIMENT: ${audienceScore > 50 ? 'The audience is favoring YOU.' : audienceScore < 50 ? 'The audience is favoring your OPPONENT. You need to be more persuasive and compelling!' : 'The audience is evenly split.'} (Your support: ${audienceScore}%)`
      : '';

    return `You are the PRO debater in a formal debate. You SUPPORT the following position:
"${topic}"

${lang}RULES:
- Present a STRONG argument in FAVOR of this position
- Use the Toulmin Model: State your CLAIM, provide DATA/EVIDENCE, explain your WARRANT (logical connection)
- Be persuasive, logical, and evidence-based
- Maximum 200 words per argument
- Reference specific facts, studies, or historical examples when possible
- If this is not the first round, BUILD on your previous arguments and COUNTER the opponent's points
- DO NOT repeat arguments you've already made
- If you're losing, consider conceding minor points to strengthen your main argument
${memory}${audienceContext}

Provide ONLY your argument. No meta-commentary. No "As the pro debater..." prefix. Jump straight into the argument.`;
  },

  conAgent: (topic, language, previousRounds = [], audienceScore = null) => {
    const lang = language === 'ar' ? 'Respond in Arabic (Egyptian Arabic is acceptable). ' : '';
    const memory = previousRounds.length > 0
      ? `\n\nPREVIOUS ROUNDS:\n${previousRounds.map(r =>
          `Round ${r.round_number}:\n  PRO argued: ${r.pro_argument}\n  CON argued: ${r.con_argument}\n  PRO Score: ${r.pro_total} | CON Score: ${r.con_total}`
        ).join('\n\n')}`
      : '';
    const audienceContext = audienceScore !== null
      ? `\n\nAUDIENCE SENTIMENT: ${audienceScore > 50 ? 'The audience is favoring YOU.' : audienceScore < 50 ? 'The audience is favoring your OPPONENT. You need to change strategy and be more compelling!' : 'The audience is evenly split.'} (Your support: ${audienceScore}%)`
      : '';

    return `You are the CON debater in a formal debate. You OPPOSE the following position:
"${topic}"

${lang}RULES:
- Present a STRONG argument AGAINST this position
- Use the Toulmin Model: State your CLAIM, provide DATA/EVIDENCE, explain your WARRANT (logical connection)
- Be persuasive, logical, and evidence-based
- Maximum 200 words per argument
- Reference specific facts, studies, or historical examples when possible
- If this is not the first round, COUNTER the opponent's latest arguments directly
- DO NOT repeat arguments you've already made
- If you're losing, pivot strategy — try a completely different angle of attack
${memory}${audienceContext}

Provide ONLY your argument. No meta-commentary. No "As the con debater..." prefix. Jump straight into the argument.`;
  },

  scorer: (topic, proArg, conArg, roundNum) => {
    return `You are an impartial debate judge scoring Round ${roundNum} of a formal debate.

TOPIC: "${topic}"

PRO ARGUMENT:
${proArg}

CON ARGUMENT:
${conArg}

Score EACH argument on three criteria (0-100 each):
1. LOGIC (0-100): Is the reasoning valid? Are there logical fallacies? Is the argument internally consistent?
2. EVIDENCE (0-100): Does the argument cite specific facts, data, studies, or examples? Are claims supported?
3. RHETORIC (0-100): Is the argument persuasive? Well-structured? Compelling? Does it address the audience effectively?

Respond in EXACTLY this JSON format, nothing else:
{
  "pro_logic": <number>,
  "pro_evidence": <number>,
  "pro_rhetoric": <number>,
  "con_logic": <number>,
  "con_evidence": <number>,
  "con_rhetoric": <number>,
  "explanation": "<1-2 sentence explanation of scoring rationale>"
}`;
  },

  fallacyDetector: (argument, side) => {
    return `Analyze the following debate argument for logical fallacies.

ARGUMENT (${side} side):
${argument}

Check for these specific fallacies:
- Ad Hominem (attacking the person, not the argument)
- Strawman (misrepresenting the opponent's position)
- False Equivalence (treating unequal things as equal)
- Appeal to Authority (citing authority without evidence)
- Slippery Slope (claiming extreme consequences without justification)
- Red Herring (introducing irrelevant information)
- Circular Reasoning (conclusion is used as a premise)
- Hasty Generalization (drawing broad conclusions from limited examples)
- Appeal to Emotion (using emotion instead of logic)
- False Dichotomy (presenting only two options when more exist)

Respond in EXACTLY this JSON format:
{
  "fallacies_found": [
    {"name": "<fallacy name>", "quote": "<exact quote from argument>", "explanation": "<why this is a fallacy>"}
  ],
  "fallacy_count": <number>,
  "overall_logical_quality": "<strong|moderate|weak>"
}

If no fallacies are found, return: {"fallacies_found": [], "fallacy_count": 0, "overall_logical_quality": "strong"}`;
  },

  summaryGenerator: (topic, rounds, winner) => {
    return `Generate a brief, compelling summary of this completed debate.

TOPIC: "${topic}"
WINNER: ${winner}
TOTAL ROUNDS: ${rounds.length}

ROUND-BY-ROUND:
${rounds.map(r => `Round ${r.round_number}: PRO(${r.pro_total}) vs CON(${r.con_total})
  PRO: ${r.pro_argument?.substring(0, 100)}...
  CON: ${r.con_argument?.substring(0, 100)}...`).join('\n\n')}

Provide a JSON response:
{
  "summary": "<2-3 sentence overall summary>",
  "key_moments": [
    {"round": <number>, "description": "<what happened>", "impact": "<why it mattered>"}
  ],
  "mvp_argument": "<which single argument was the strongest and why>"
}`;
  }
};

module.exports = { PROMPTS };
