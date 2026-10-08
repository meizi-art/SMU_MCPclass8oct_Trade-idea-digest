import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { checkMcpConnection, generateTop3TradeIdeas, MCP_SERVERS } from './api/mcp.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json());

  // MCP Servers health & connection status
  app.get('/api/mcp-status', async (_req, res) => {
    try {
      const status = await checkMcpConnection();
      res.json({
        success: true,
        data: status,
        mcpEndpoints: {
          polymarket: MCP_SERVERS.polymarket.smitheryUrl,
          fmp: MCP_SERVERS.fmp.smitheryUrl
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'MCP check failed' });
    }
  });

  // Top 3 Trade Ideas generator endpoint
  app.post('/api/generate-trade-ideas', async (req, res) => {
    try {
      const {
        sectors = ['Technology'],
        country = 'United States',
        exchange = 'NYSE',
        multiplier = 10,
        riskTolerance = 'Medium',
        initialCapital = 1000,
        timeframe = '1 Month'
      } = req.body || {};

      // First retrieve baseline ideas from crowd intelligence pool & MCP metrics
      const baselineIdeas = generateTop3TradeIdeas({
        sectors,
        country,
        exchange,
        multiplier: Number(multiplier) || 10,
        riskTolerance,
        initialCapital: Number(initialCapital) || 1000,
        timeframe
      });

      // If GEMINI_API_KEY is available, use Gemini 3.8 Flash to enhance analysis
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
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

We have live crowd intelligence signals from:
1) Polymarket prediction markets (crowd probabilities, event contracts)
2) Financial Modeling Prep (equity fundamentals, valuation ratios, momentum)
3) Social media sentiment buzz & Google News trending catalysts

Here is our candidate pool data:
${JSON.stringify(baselineIdeas, null, 2)}

Provide the Top 3 trade ideas strictly matching the user's constraints.
For each of the 3 ideas, format the response as a JSON array of 3 objects with these keys:
- "rank" (number 1, 2, or 3)
- "ticker" (e.g. "NVDA", "LLY", "PLTR")
- "exchange" (e.g. "NASDAQ", "NYSE")
- "name" (company name)
- "predictedChange" (e.g. "+12.4%")
- "headline" (A crisp, powerful single-line thesis connecting social buzz, Google news, or Polymarket crowd probability, e.g. "AI chip demand surge — social buzz up 340%, prediction market 78% bullish")
- "riskProfile" ("Low", "Medium", or "High")
- "confidenceRating" (e.g. "94%")
- "recommendedAllocation" (e.g. "$450")
- "targetReturnMultiplier" ("${multiplier}X")
- "crowdSignal" (A concise note on Polymarket odds or social buzz)
- "newsCatalyst" (The specific breaking news or fundamental trigger)

Return ONLY valid JSON (no markdown formatting or code fences).`;

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
              return res.json({
                success: true,
                generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                aiEnhanced: true,
                ideas: parsed.slice(0, 3)
              });
            }
          }
        } catch (aiErr) {
          console.warn('Gemini enhancement skipped or failed, using quantitative MCP signals:', aiErr);
        }
      }

      // Return high-conviction ideas derived from MCP data
      return res.json({
        success: true,
        generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        aiEnhanced: false,
        ideas: baselineIdeas
      });
    } catch (err: any) {
      console.error('Error generating trade ideas:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal error' });
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DealHunter X Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
