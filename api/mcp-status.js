/**
 * Vercel Serverless Function: /api/mcp-status
 */
import { checkMcpConnection, MCP_SERVERS } from './mcp.js';

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

    const status = await checkMcpConnection();

    const responsePayload = {
      success: true,
      data: status,
      freeTierStatus: {
        polymarket: '100% Free (No key needed)',
        fmp: status.servers.fmp?.keyConfigured ? 'FMP Free Tier Active' : 'Key required for FMP'
      },
      mcpEndpoints: {
        polymarket: MCP_SERVERS.polymarket.smitheryUrl,
        fmp: MCP_SERVERS.fmp.smitheryUrl
      }
    };

    if (res && typeof res.status === 'function') {
      return res.status(200).json(responsePayload);
    }
    return responsePayload;
  } catch (err) {
    const errorPayload = {
      success: false,
      error: err?.message || 'MCP check failed'
    };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    return errorPayload;
  }
}
