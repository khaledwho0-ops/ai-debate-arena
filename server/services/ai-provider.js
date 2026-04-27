// ============================================================
// AI DEBATE ARENA — Multi-Provider AI System
// Smart fallback: Gemini → Groq → GitHub Models → NVIDIA NIM
// ============================================================
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

class AIProvider {
  constructor() {
    // Initialize available providers
    this.providers = [];

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      this.providers.push('gemini');
      console.log('✅ Gemini API ready');
    }

    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      this.providers.push('groq');
      console.log('✅ Groq API ready');
    }

    if (process.env.GITHUB_TOKEN) {
      this.providers.push('github');
      console.log('✅ GitHub Models ready');
    }

    if (process.env.NVIDIA_API_KEY) {
      this.providers.push('nvidia');
      console.log('✅ NVIDIA NIM ready');
    }

    if (this.providers.length === 0) {
      console.error('❌ No AI providers configured! Add API keys to .env');
    } else {
      console.log(`🤖 ${this.providers.length} AI providers active: ${this.providers.join(', ')}`);
    }
  }

  // ---- Main generation with smart fallback ----
  async generate(prompt, systemPrompt = '', options = {}) {
    const { preferFast = false, maxTokens = 1024 } = options;

    // If preferFast, try Groq first (10x faster)
    const order = preferFast
      ? ['groq', 'gemini', 'github', 'nvidia']
      : ['gemini', 'groq', 'github', 'nvidia'];

    for (const provider of order) {
      if (!this.providers.includes(provider)) continue;
      try {
        const result = await this[`_call_${provider}`](prompt, systemPrompt, maxTokens);
        return { text: result, provider };
      } catch (err) {
        console.warn(`⚠️ ${provider} failed: ${err.message}. Trying next...`);
      }
    }

    throw new Error('All AI providers exhausted. Please check your API keys.');
  }

  // ---- Generate with streaming (returns async iterator) ----
  async *generateStream(prompt, systemPrompt = '', options = {}) {
    const { preferFast = false, maxTokens = 1024 } = options;

    // Try Groq first for streaming (fastest)
    if (preferFast && this.providers.includes('groq')) {
      try {
        yield* this._stream_groq(prompt, systemPrompt, maxTokens);
        return;
      } catch (err) {
        console.warn(`⚠️ Groq streaming failed: ${err.message}`);
      }
    }

    // Fall back to Gemini streaming
    if (this.providers.includes('gemini')) {
      try {
        yield* this._stream_gemini(prompt, systemPrompt, maxTokens);
        return;
      } catch (err) {
        console.warn(`⚠️ Gemini streaming failed: ${err.message}`);
      }
    }

    // Last resort: non-streaming fallback
    const result = await this.generate(prompt, systemPrompt, options);
    yield result.text;
  }

  // ---- Provider implementations ----

  async _call_gemini(prompt, systemPrompt, maxTokens) {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const result = await this.geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
    });
    return result.response.text();
  }

  async *_stream_gemini(prompt, systemPrompt, maxTokens) {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const result = await this.geminiModel.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
    });
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async _call_groq(prompt, systemPrompt, maxTokens) {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: maxTokens,
      temperature: 0.8,
    });
    return completion.choices[0]?.message?.content || '';
  }

  async *_stream_groq(prompt, systemPrompt, maxTokens) {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const stream = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: maxTokens,
      temperature: 0.8,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }

  async _call_github(prompt, systemPrompt, maxTokens) {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });

    if (!res.ok) throw new Error(`GitHub Models: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.choices[0]?.message?.content || '';
  }

  async _call_nvidia(prompt, systemPrompt, maxTokens) {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages,
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });

    if (!res.ok) throw new Error(`NVIDIA NIM: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.choices[0]?.message?.content || '';
  }
}

// Singleton
const aiProvider = new AIProvider();
module.exports = { aiProvider };
