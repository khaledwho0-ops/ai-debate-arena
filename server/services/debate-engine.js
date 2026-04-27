// ============================================================
// AI DEBATE ARENA — Debate Engine (State Machine + Logic)
// ============================================================
const { v4: uuidv4 } = require('uuid');
const { aiProvider } = require('./ai-provider');
const { PROMPTS } = require('./prompts');
const { run, get, all } = require('../db');

// Suggested topics for quick-start
const SUGGESTED_TOPICS = [
  "Artificial Intelligence will create more jobs than it destroys",
  "Social media does more harm than good to society",
  "Space exploration is worth the investment over solving Earth's problems",
  "University education is no longer necessary for success",
  "Remote work is better than office work for productivity",
  "Nuclear energy is the best solution for climate change",
  "Cryptocurrency will replace traditional banking",
  "Privacy should be sacrificed for national security",
  "Genetic engineering of humans should be allowed",
  "Democracy is the best form of government",
  "الذكاء الاصطناعي سيخلق وظائف أكثر مما يدمر",
  "التعليم الجامعي لم يعد ضرورياً للنجاح",
  "العمل عن بعد أفضل من العمل في المكتب",
  "وسائل التواصل الاجتماعي تضر المجتمع أكثر مما تنفعه",
  "الطاقة النووية هي الحل الأفضل لتغير المناخ",
  "محمد علي باشا كان محدثاً وليس طاغية",
  "نظام الثانوية العامة يحتاج إصلاح جذري",
  "الاستثمار في التكنولوجيا أهم من الصناعة التقليدية لمصر",
  "قانون ١٥٢ لسنة ٢٠٢٠ كافي لدعم الشركات الناشئة",
  "التعليم الإلكتروني يمكن أن يحل محل التعليم التقليدي"
];

class DebateEngine {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this.activeDebates = new Map(); // debateId -> state
  }

  // ---- Create a new debate ----
  createDebate(topic, language = 'en', totalRounds = 5) {
    const id = uuidv4();
    run(
      `INSERT INTO debates (id, topic, language, total_rounds, status) VALUES (?, ?, ?, ?, 'pending')`,
      [id, topic, language, totalRounds]
    );
    return { id, topic, language, totalRounds, status: 'pending' };
  }

  // ---- Get debate state ----
  getDebate(id) {
    const debate = get(`SELECT * FROM debates WHERE id = ?`, [id]);
    if (!debate) return null;

    const rounds = all(`SELECT * FROM rounds WHERE debate_id = ? ORDER BY round_number`, [id]);
    const history = get(`SELECT * FROM debate_history WHERE debate_id = ?`, [id]);

    return { ...debate, rounds, history };
  }

  // ---- Run a single round ----
  async runRound(debateId) {
    const debate = get(`SELECT * FROM debates WHERE id = ?`, [debateId]);
    if (!debate) throw new Error('Debate not found');
    if (debate.status === 'completed') throw new Error('Debate already completed');

    const nextRound = debate.current_round + 1;
    if (nextRound > debate.total_rounds) throw new Error('All rounds completed');

    // Update status
    run(`UPDATE debates SET status = 'active', current_round = ?, updated_at = datetime('now') WHERE id = ?`,
      [nextRound, debateId]);

    // Get previous rounds for memory
    const previousRounds = all(`SELECT * FROM rounds WHERE debate_id = ? ORDER BY round_number`, [debateId]);

    // Calculate audience sentiment from last round
    let proAudiencePercent = 50;
    let conAudiencePercent = 50;
    if (previousRounds.length > 0) {
      const lastRound = previousRounds[previousRounds.length - 1];
      const totalVotes = (lastRound.audience_pro_votes || 0) + (lastRound.audience_con_votes || 0);
      if (totalVotes > 0) {
        proAudiencePercent = Math.round((lastRound.audience_pro_votes / totalVotes) * 100);
        conAudiencePercent = 100 - proAudiencePercent;
      }
    }

    // Broadcast: round starting
    this.broadcast(debateId, {
      type: 'round_start',
      round: nextRound,
      totalRounds: debate.total_rounds,
    });

    // ---- Generate PRO argument (with streaming) ----
    this.broadcast(debateId, { type: 'agent_thinking', side: 'pro' });

    let proArgument = '';
    try {
      for await (const chunk of aiProvider.generateStream(
        PROMPTS.proAgent(debate.topic, debate.language, previousRounds, proAudiencePercent)
      )) {
        proArgument += chunk;
        this.broadcast(debateId, { type: 'argument_chunk', side: 'pro', chunk, full: proArgument });
      }
    } catch (err) {
      // Fallback to non-streaming
      const result = await aiProvider.generate(
        PROMPTS.proAgent(debate.topic, debate.language, previousRounds, proAudiencePercent)
      );
      proArgument = result.text;
      this.broadcast(debateId, { type: 'argument_chunk', side: 'pro', chunk: proArgument, full: proArgument });
    }

    this.broadcast(debateId, { type: 'argument_complete', side: 'pro', argument: proArgument });

    // Small delay for dramatic effect
    await new Promise(r => setTimeout(r, 500));

    // ---- Generate CON argument (with streaming) ----
    this.broadcast(debateId, { type: 'agent_thinking', side: 'con' });

    let conArgument = '';
    try {
      for await (const chunk of aiProvider.generateStream(
        PROMPTS.conAgent(debate.topic, debate.language, previousRounds, conAudiencePercent)
      )) {
        conArgument += chunk;
        this.broadcast(debateId, { type: 'argument_chunk', side: 'con', chunk, full: conArgument });
      }
    } catch (err) {
      const result = await aiProvider.generate(
        PROMPTS.conAgent(debate.topic, debate.language, previousRounds, conAudiencePercent)
      );
      conArgument = result.text;
      this.broadcast(debateId, { type: 'argument_chunk', side: 'con', chunk: conArgument, full: conArgument });
    }

    this.broadcast(debateId, { type: 'argument_complete', side: 'con', argument: conArgument });

    // ---- Score both arguments ----
    this.broadcast(debateId, { type: 'scoring_start' });

    let scores;
    try {
      const scoreResult = await aiProvider.generate(
        PROMPTS.scorer(debate.topic, proArgument, conArgument, nextRound),
        '', { preferFast: true }
      );
      // Extract JSON from response
      const jsonMatch = scoreResult.text.match(/\{[\s\S]*\}/);
      scores = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (err) {
      console.error('Scoring failed, using defaults:', err.message);
      scores = null;
    }

    if (!scores) {
      scores = {
        pro_logic: 70, pro_evidence: 65, pro_rhetoric: 70,
        con_logic: 70, con_evidence: 65, con_rhetoric: 70,
        explanation: 'Scoring engine encountered an issue. Default scores applied.'
      };
    }

    const proTotal = Math.round((scores.pro_logic + scores.pro_evidence + scores.pro_rhetoric) / 3);
    const conTotal = Math.round((scores.con_logic + scores.con_evidence + scores.con_rhetoric) / 3);

    // ---- Detect fallacies (parallel, using fast provider) ----
    let proFallacies = { fallacies_found: [], fallacy_count: 0 };
    let conFallacies = { fallacies_found: [], fallacy_count: 0 };

    try {
      const [proFallacyResult, conFallacyResult] = await Promise.allSettled([
        aiProvider.generate(PROMPTS.fallacyDetector(proArgument, 'PRO'), '', { preferFast: true }),
        aiProvider.generate(PROMPTS.fallacyDetector(conArgument, 'CON'), '', { preferFast: true }),
      ]);

      if (proFallacyResult.status === 'fulfilled') {
        const m = proFallacyResult.value.text.match(/\{[\s\S]*\}/);
        if (m) proFallacies = JSON.parse(m[0]);
      }
      if (conFallacyResult.status === 'fulfilled') {
        const m = conFallacyResult.value.text.match(/\{[\s\S]*\}/);
        if (m) conFallacies = JSON.parse(m[0]);
      }
    } catch (err) {
      console.warn('Fallacy detection failed:', err.message);
    }

    // Apply fallacy penalties
    const proFinalTotal = Math.max(0, proTotal - (proFallacies.fallacy_count || 0) * 5);
    const conFinalTotal = Math.max(0, conTotal - (conFallacies.fallacy_count || 0) * 5);

    // ---- Save round to DB ----
    run(
      `INSERT INTO rounds (debate_id, round_number, pro_argument, con_argument,
        pro_score_logic, pro_score_evidence, pro_score_rhetoric,
        con_score_logic, con_score_evidence, con_score_rhetoric,
        pro_fallacies, con_fallacies, pro_total, con_total, scoring_explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debateId, nextRound, proArgument, conArgument,
        scores.pro_logic, scores.pro_evidence, scores.pro_rhetoric,
        scores.con_logic, scores.con_evidence, scores.con_rhetoric,
        JSON.stringify(proFallacies.fallacies_found || []),
        JSON.stringify(conFallacies.fallacies_found || []),
        proFinalTotal, conFinalTotal,
        scores.explanation || ''
      ]
    );

    const roundResult = {
      round: nextRound,
      pro: {
        argument: proArgument,
        scores: { logic: scores.pro_logic, evidence: scores.pro_evidence, rhetoric: scores.pro_rhetoric },
        total: proFinalTotal,
        fallacies: proFallacies.fallacies_found || [],
      },
      con: {
        argument: conArgument,
        scores: { logic: scores.con_logic, evidence: scores.con_evidence, rhetoric: scores.con_rhetoric },
        total: conFinalTotal,
        fallacies: conFallacies.fallacies_found || [],
      },
      explanation: scores.explanation,
    };

    this.broadcast(debateId, { type: 'round_complete', ...roundResult });

    // ---- Check if debate is over ----
    if (nextRound >= debate.total_rounds) {
      await this.finishDebate(debateId);
    }

    return roundResult;
  }

  // ---- Finish debate and determine winner ----
  async finishDebate(debateId) {
    const rounds = all(`SELECT * FROM rounds WHERE debate_id = ? ORDER BY round_number`, [debateId]);
    const debate = get(`SELECT * FROM debates WHERE id = ?`, [debateId]);

    let proTotalAll = 0, conTotalAll = 0;
    rounds.forEach(r => {
      proTotalAll += r.pro_total || 0;
      conTotalAll += r.con_total || 0;
    });

    const winner = proTotalAll > conTotalAll ? 'pro' : proTotalAll < conTotalAll ? 'con' : 'draw';

    // Generate summary
    let summary = { summary: 'Debate completed.', key_moments: [], mvp_argument: 'N/A' };
    try {
      const summaryResult = await aiProvider.generate(
        PROMPTS.summaryGenerator(debate.topic, rounds, winner),
        '', { preferFast: true }
      );
      const m = summaryResult.text.match(/\{[\s\S]*\}/);
      if (m) summary = JSON.parse(m[0]);
    } catch (err) {
      console.warn('Summary generation failed:', err.message);
    }

    // Save to DB
    run(`UPDATE debates SET winner = ?, status = 'completed', pro_total_score = ?, con_total_score = ?, updated_at = datetime('now') WHERE id = ?`,
      [winner, proTotalAll, conTotalAll, debateId]);

    run(`INSERT INTO debate_history (debate_id, summary, key_moments, final_scores) VALUES (?, ?, ?, ?)`,
      [debateId, summary.summary, JSON.stringify(summary.key_moments), JSON.stringify({ pro: proTotalAll, con: conTotalAll })]);

    this.broadcast(debateId, {
      type: 'debate_complete',
      winner,
      proTotal: proTotalAll,
      conTotal: conTotalAll,
      summary,
    });

    return { winner, proTotal: proTotalAll, conTotal: conTotalAll, summary };
  }

  // ---- Vote ----
  vote(debateId, side) {
    const debate = get(`SELECT * FROM debates WHERE id = ?`, [debateId]);
    if (!debate) throw new Error('Debate not found');

    const currentRound = debate.current_round || 1;
    const round = get(`SELECT * FROM rounds WHERE debate_id = ? AND round_number = ?`, [debateId, currentRound]);

    if (round) {
      const proVotes = (round.audience_pro_votes || 0) + (side === 'pro' ? 1 : 0);
      const conVotes = (round.audience_con_votes || 0) + (side === 'con' ? 1 : 0);
      run(`UPDATE rounds SET audience_pro_votes = ?, audience_con_votes = ? WHERE debate_id = ? AND round_number = ?`,
        [proVotes, conVotes, debateId, currentRound]);

      this.broadcast(debateId, { type: 'vote_update', proVotes, conVotes, round: currentRound });
      return { proVotes, conVotes };
    }
    return { proVotes: 0, conVotes: 0 };
  }

  // ---- Get suggested topics ----
  getSuggestedTopics() {
    return SUGGESTED_TOPICS;
  }
}

module.exports = { DebateEngine };
