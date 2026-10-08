/**
 * Vercel Serverless Function: /api/generate-trade-ideas
 */
import { generateTop3TradeIdeas } from './mcp.js';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  try {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req && req.method === 'OPTIONS') {
      return res?.status ? res.status(200).end() : null;
    }

    // Parse body safely whether Express or Vercel Serverless
    let body = req?.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const {
      sectors = ['Technology'],
      country = 'United States',
      exchange = 'NYSE',
      multiplier = 10,
      riskTolerance = 'Medium',
      initialCapital = 1000,
      timeframe = '1 Month'
    } = body;

    // Generate baseline ideas from crowd intelligence pool & free tier MCP metrics
    const baselineIdeas = generateTop3TradeIdeas({
      sectors,
      country,
      exchange,
      multiplier: Number(multiplier) || 10,
      riskTolerance,
      initialCapital: Number(initialCapital) || 1000,
      timeframe
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const prompt = `You are the lead algorithmic analyst at DealHunter X ("Hunting tomorrow's ten-baggers, today").
A user provided the following trading parameters:
- Sectors of interest: ${Array.isArray(sectors) ? sectors.join(', ') : sectors}
- Country: ${country}
- Target Exchange: ${exchange}
- Target Return Multiplier: ${multiplier}X
- Risk Tolerance: ${riskTolerance}
- Initial Capital: $${initialCapital}
- Timeframe: ${timeframe}

Signals available:
1) Polymarket prediction markets (100% Free crowd probability & open volume)
2) Financial Modeling Prep free-tier equity fundamentals (live prices, market cap, P/E ratios)
3) Social buzz and Google News catalysts

Candidate pool data:
${JSON.stringify(baselineIdeas, null, 2)}

Provide the Top 3 trade ideas strictly matching the user constraints. Format as a JSON array of 3 objects with:
"rank", "ticker", "exchange", "name", "predictedChange", "headline", "riskProfile", "confidenceRating", "recommendedAllocation", "targetReturnMultiplier", "crowdSignal", "newsCatalyst".
Return ONLY valid JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text?.trim() || '';
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            const result = {
              success: true,
              generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              aiEnhanced: true,
              ideas: parsed.slice(0, 3)
            };
            if (res && typeof res.status === 'function') {
              return res.status(200).json(result);
            }
            return result;
          }
        }
      } catch (aiErr) {
        // Fallback to quantitative baseline on any AI error
      }
    }

    const finalResult = {
      success: true,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      aiEnhanced: false,
      ideas: baselineIdeas
    };

    if (res && typeof res.status === 'function') {
      return res.status(200).json(finalResult);
    }
    return finalResult;
  } catch (err) {
    const errorPayload = {
      success: false,
      error: err?.message || 'Error generating trade ideas'
    };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    return errorPayload;
  }
}
