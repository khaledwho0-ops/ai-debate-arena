// ============================================================
// AI DEBATE ARENA — Full API Routes
// ============================================================
const express = require('express');
const { DebateEngine } = require('../services/debate-engine');
const { all, get } = require('../db');

module.exports = function (broadcast) {
  const router = express.Router();
  const engine = new DebateEngine(broadcast);

  // ---- GET /api/debates — List all debates ----
  router.get('/', (req, res) => {
    try {
      const debates = all(`SELECT * FROM debates ORDER BY created_at DESC LIMIT 50`);
      res.json({ debates });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---- GET /api/debates/topics — Get suggested topics ----
  router.get('/topics', (req, res) => {
    res.json({ topics: engine.getSuggestedTopics() });
  });

  // ---- POST /api/debates — Create new debate ----
  router.post('/', (req, res) => {
    try {
      const { topic, language = 'en', rounds = 5 } = req.body;
      if (!topic || topic.trim().length < 5) {
        return res.status(400).json({ error: 'Topic must be at least 5 characters long.' });
      }
      if (rounds < 1 || rounds > 10) {
        return res.status(400).json({ error: 'Rounds must be between 1 and 10.' });
      }
      const debate = engine.createDebate(topic.trim(), language, rounds);
      res.status(201).json(debate);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---- GET /api/debates/:id — Get debate state ----
  router.get('/:id', (req, res) => {
    try {
      const debate = engine.getDebate(req.params.id);
      if (!debate) return res.status(404).json({ error: 'Debate not found' });
      res.json(debate);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---- POST /api/debates/:id/round — Run next round ----
  router.post('/:id/round', async (req, res) => {
    try {
      const result = await engine.runRound(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // ---- POST /api/debates/:id/vote — Vote for a side ----
  router.post('/:id/vote', (req, res) => {
    try {
      const { side } = req.body;
      if (!['pro', 'con'].includes(side)) {
        return res.status(400).json({ error: 'Side must be "pro" or "con"' });
      }
      const result = engine.vote(req.params.id, side);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // ---- GET /api/debates/:id/scores — Get all round scores ----
  router.get('/:id/scores', (req, res) => {
    try {
      const rounds = all(`SELECT * FROM rounds WHERE debate_id = ? ORDER BY round_number`, [req.params.id]);
      res.json({ rounds });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
