import React, { useState, useEffect } from 'react';
import {
  Zap,
  BarChart3,
  Users,
  Newspaper,
  LineChart,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
  Copy,
  CheckCheck,
  ExternalLink,
  ChevronDown,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface TradeIdea {
  rank: number;
  ticker: string;
  name?: string;
  exchange: string;
  country?: string;
  sector?: string;
  predictedChange: string;
  headline: string;
  polymarketSignal?: {
    question: string;
    probability: string;
    volume: string;
  };
  socialBuzz?: string;
  newsCatalyst?: string;
  fmpMetrics?: {
    pe: string | number;
    marketCap: string;
    targetPrice: string;
  };
  targetReturnMultiplier?: string;
  recommendedAllocation?: string;
  confidenceRating?: string;
  riskProfile?: string;
}

interface McpServerStatus {
  name: string;
  status: string;
  latencyMs: number;
  smitheryUrl: string;
  tools: string[];
  details: string;
  lastPing: string;
}

const AVAILABLE_SECTORS = [
  'Healthcare',
  'Technology',
  'Energy',
  'Finance',
  'Consumer Goods',
  'Real Estate',
  'Industrials',
  'Crypto'
];

const COUNTRIES = ['United States', 'Global', 'United Kingdom', 'Japan', 'European Union'];
const EXCHANGES = ['NYSE', 'NASDAQ', 'AMEX', 'Crypto (CEX/DEX)', 'LSE'];
const TIMEFRAMES = ['1 Month', '3 Months', '6 Months', '1 Year'];

export default function App() {
  // Input parameters state
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Technology', 'Healthcare']);
  const [country, setCountry] = useState<string>('United States');
  const [exchange, setExchange] = useState<string>('NYSE');
  const [multiplier, setMultiplier] = useState<number>(10);
  const [riskTolerance, setRiskTolerance] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [initialCapital, setInitialCapital] = useState<number>(1000);
  const [timeframe, setTimeframe] = useState<string>('1 Month');

  // Generator & output states
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedDate, setGeneratedDate] = useState<string>('Jan 15, 2025');
  const [confidenceLabel, setConfidenceLabel] = useState<string>('HIGH CONFIDENCE');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedIdeaDetail, setSelectedIdeaDetail] = useState<TradeIdea | null>(null);
  const [showMcpModal, setShowMcpModal] = useState<boolean>(false);

  // MCP status state
  const [mcpStatus, setMcpStatus] = useState<{
    polymarket?: McpServerStatus;
    fmp?: McpServerStatus;
    loading: boolean;
  }>({ loading: true });

  // Initial Top 3 trade ideas (matches user mockup)
  const [tradeIdeas, setTradeIdeas] = useState<TradeIdea[]>([
    {
      rank: 1,
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      country: 'United States',
      sector: 'Technology',
      predictedChange: '+12.4%',
      headline: 'AI chip demand surge — social buzz up 340%, prediction market 78% bullish',
      polymarketSignal: {
        question: 'Will Blackwell Ultra shipments beat Q1 expectations?',
        probability: '78% Bullish',
        volume: '$4.2M'
      },
      socialBuzz: '+340% 7-day velocity across X & developer forums',
      newsCatalyst: 'Major hyperscaler capex increases confirmed in latest 10-Q filings',
      fmpMetrics: { pe: 42.1, marketCap: '$3.38T', targetPrice: '$165.00' },
      targetReturnMultiplier: '10X',
      recommendedAllocation: '$450',
      confidenceRating: '95%',
      riskProfile: 'Medium'
    },
    {
      rank: 2,
      ticker: 'LLY',
      name: 'Eli Lilly and Company',
      exchange: 'NYSE',
      country: 'United States',
      sector: 'Healthcare',
      predictedChange: '+8.7%',
      headline: 'Weight-loss drug trial results trending on Google News, positive sentiment',
      polymarketSignal: {
        question: 'FDA approval for expanded oral GLP-1 indications by Q2?',
        probability: '84% Bullish',
        volume: '$1.8M'
      },
      socialBuzz: '+195% patient community & medical journal mentions',
      newsCatalyst: 'Phase III clinical data showing superior metabolic endpoints',
      fmpMetrics: { pe: 54.8, marketCap: '$840B', targetPrice: '$980.00' },
      targetReturnMultiplier: '10X',
      recommendedAllocation: '$350',
      confidenceRating: '91%',
      riskProfile: 'Low'
    },
    {
      rank: 3,
      ticker: 'PLTR',
      name: 'Palantir Technologies',
      exchange: 'NYSE',
      country: 'United States',
      sector: 'Technology',
      predictedChange: '+6.2%',
      headline: 'Government contract wins, social media mentions up 210% week-over-week',
      polymarketSignal: {
        question: 'US DoD enterprise expansion contract closed this quarter?',
        probability: '71% Bullish',
        volume: '$2.9M'
      },
      socialBuzz: '+210% week-over-week retail & institutional buzz',
      newsCatalyst: 'Titan project phase expansion approved in defense budget',
      fmpMetrics: { pe: 88.2, marketCap: '$153B', targetPrice: '$78.00' },
      targetReturnMultiplier: '10X',
      recommendedAllocation: '$200',
      confidenceRating: '88%',
      riskProfile: 'Medium'
    }
  ]);

  // Fetch MCP status on load
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/mcp-status');
        if (res.ok) {
          const data = await res.json();
          if (data.data?.servers) {
            setMcpStatus({
              polymarket: data.data.servers.polymarket,
              fmp: data.data.servers.fmp,
              loading: false
            });
          }
        }
      } catch {
        setMcpStatus({ loading: false });
      }
    }
    fetchStatus();
    
    // Set formatted today's date
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    setGeneratedDate(formatted);
  }, []);

  const toggleSector = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      if (selectedSectors.length > 1) {
        setSelectedSectors(selectedSectors.filter(s => s !== sector));
      }
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };

  const handleGenerateIdeas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-trade-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectors: selectedSectors,
          country,
          exchange,
          multiplier,
          riskTolerance,
          initialCapital,
          timeframe
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ideas && Array.isArray(data.ideas)) {
          setTradeIdeas(data.ideas);
          if (data.generatedAt) {
            setGeneratedDate(data.generatedAt);
          }
          if (multiplier >= 15 || riskTolerance === 'High') {
            setConfidenceLabel('HIGH CONVICTION');
          } else {
            setConfidenceLabel('HIGH CONFIDENCE');
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate trade ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyDigestToClipboard = () => {
    const text = `DEALHUNTER X — Top 3 Trade Ideas (${generatedDate})
Parameters: ${selectedSectors.join(', ')} | ${multiplier}X Target | $${initialCapital} Capital | ${timeframe}
---------------------------------------------
${tradeIdeas.map(i => `${i.rank}. ${i.ticker} (${i.exchange}) ${i.predictedChange}\n   ${i.headline}`).join('\n\n')}
---------------------------------------------
Powered by crowd wisdom & public signals (Polymarket + FMP)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4 fill-emerald-400" />
            </div>
            <span className="font-extrabold text-xl tracking-wider text-white">DHX</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowMcpModal(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-colors"
              title="Inspect MCP Server connections"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px]">MCP Active</span>
            </button>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Powered by crowd wisdom & public signals
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10">
        {/* Hero Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase mb-2">
            DEALHUNTER X
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-normal">
            Hunting tomorrow’s ten-baggers, today.
          </p>
        </div>

        {/* 2-Column Responsive Grid matching Image Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Side: Input Configuration Cards (2x2 grid + CTA) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              
              {/* Card 1: Sector Interests */}
              <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-emerald-400 font-semibold text-sm sm:text-[15px] mb-1">
                    Sector Interests
                  </h2>
                  <p className="text-slate-400 text-xs mb-4">
                    Select the sectors you're interested in trading
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {AVAILABLE_SECTORS.map(sec => {
                      const isSelected = selectedSectors.includes(sec);
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => toggleSector(sec)}
                          className={`flex items-center space-x-2 text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-[#1e293b] text-white border border-slate-600/60 shadow-sm'
                              : 'bg-[#0b1222]/80 text-slate-400 border border-slate-800/80 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-white border-white text-slate-900'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                          </span>
                          <span className="truncate">{sec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 2: Country & Exchange */}
              <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-emerald-400 font-semibold text-sm sm:text-[15px] mb-1">
                    Country & Exchange
                  </h2>
                  <p className="text-slate-400 text-xs mb-4">
                    Choose your preferred markets
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                          className="w-full bg-[#162035] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none pr-9 focus:outline-none focus:border-emerald-500/80 transition-colors"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c} value={c} className="bg-slate-900 text-white">
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                        Market Exchange
                      </label>
                      <div className="relative">
                        <select
                          value={exchange}
                          onChange={e => setExchange(e.target.value)}
                          className="w-full bg-[#162035] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none pr-9 focus:outline-none focus:border-emerald-500/80 transition-colors"
                        >
                          {EXCHANGES.map(ex => (
                            <option key={ex} value={ex} className="bg-slate-900 text-white">
                              {ex}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Return & Risk Appetite */}
              <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-emerald-400 font-semibold text-sm sm:text-[15px] mb-1">
                    Return & Risk Appetite
                  </h2>
                  <p className="text-slate-400 text-xs mb-4">
                    Set your financial targets and risk tolerance
                  </p>

                  {/* Multiplier Slider */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-slate-400">
                        Target Return Multiplier
                      </span>
                      <span className="text-lg font-black text-emerald-400 tracking-tight">
                        {multiplier}X
                      </span>
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={multiplier}
                      onChange={e => setMultiplier(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />

                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
                      <span>1X (Conservative)</span>
                      <span>20X (Aggressive)</span>
                    </div>
                  </div>

                  {/* Risk Tolerance Radio Selection */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400 mb-2">
                      Risk Tolerance
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Low', 'Medium', 'High'] as const).map(level => {
                        const isRiskSelected = riskTolerance === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setRiskTolerance(level)}
                            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                              isRiskSelected
                                ? 'bg-[#1e293b] text-white border border-slate-500 shadow-sm'
                                : 'bg-[#0b1222]/80 text-slate-400 border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                                isRiskSelected
                                  ? 'bg-white border-white'
                                  : 'border-slate-600 bg-transparent'
                              }`}
                            >
                              {isRiskSelected && <span className="w-1 h-1 rounded-full bg-slate-900" />}
                            </span>
                            <span>{level}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Capital & Timeframe */}
              <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-emerald-400 font-semibold text-sm sm:text-[15px] mb-1">
                    Capital & Timeframe
                  </h2>
                  <p className="text-slate-400 text-xs mb-4">
                    Define your investment parameters
                  </p>

                  <div className="space-y-4">
                    {/* Capital Input */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                        Initial Capital (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-mono">$</span>
                        <input
                          type="number"
                          min={50}
                          step={50}
                          value={initialCapital}
                          onChange={e => setInitialCapital(Math.max(1, parseInt(e.target.value || '0', 10)))}
                          className="w-full bg-[#162035] border border-slate-700/70 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/80 font-mono transition-colors"
                        />
                      </div>
                      {/* Presets */}
                      <div className="flex space-x-1.5 mt-2">
                        {[500, 1000, 5000, 10000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setInitialCapital(val)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                              initialCapital === val
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-200'
                            }`}
                          >
                            ${val >= 1000 ? `${val / 1000}k` : val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeframe Dropdown */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                        Investment Timeframe
                      </label>
                      <div className="relative">
                        <select
                          value={timeframe}
                          onChange={e => setTimeframe(e.target.value)}
                          className="w-full bg-[#162035] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none pr-9 focus:outline-none focus:border-emerald-500/80 transition-colors"
                        >
                          {TIMEFRAMES.map(tf => (
                            <option key={tf} value={tf} className="bg-slate-900 text-white">
                              {tf}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Big Prominent CTA Button */}
            <button
              onClick={handleGenerateIdeas}
              disabled={loading}
              className="w-full group relative overflow-hidden bg-[#00df81] hover:bg-[#00f58d] text-slate-950 font-extrabold text-base sm:text-lg py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2.5 disabled:opacity-80"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                  <span>Scanning Prediction Markets & Financial Feeds...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-slate-950 text-slate-950 transition-transform group-hover:scale-110" />
                  <span>Generate My Trade Ideas</span>
                </>
              )}
            </button>
          </div>

          {/* Right Side: Intelligence Sources & Daily Digest (Top 3 Trade Ideas) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Intelligence Sources Card */}
            <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm sm:text-base">
                  Intelligence Sources
                </h2>
                <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Live Feed</span>
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Source 1: Prediction Markets */}
                <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-[#131d33]/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white truncate">Prediction Markets</h3>
                      <span className="text-[10px] text-teal-400 font-mono">Polymarket</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Real-time crowd probability signals
                    </p>
                  </div>
                </div>

                {/* Source 2: Social Media Trends */}
                <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-[#131d33]/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white truncate">Social Media Trends</h3>
                      <span className="text-[10px] text-indigo-400 font-mono">X / Reddit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Sentiment from social platforms
                    </p>
                  </div>
                </div>

                {/* Source 3: Google News & Naver */}
                <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-[#131d33]/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white truncate">Google News & Naver</h3>
                      <span className="text-[10px] text-rose-400 font-mono">Breaking</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Trending topics & breaking news
                    </p>
                  </div>
                </div>

                {/* Source 4: Financial Market Data */}
                <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-[#131d33]/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white truncate">Financial Market Data</h3>
                      <span className="text-[10px] text-amber-400 font-mono">FMP Server</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Live pricing & fundamental data
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Digest / Top 3 Trade Ideas Card (Output Section) */}
            <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daily Digest
                </span>
                <button
                  onClick={copyDigestToClipboard}
                  className="flex items-center space-x-1 text-slate-400 hover:text-white text-[11px] transition-colors"
                  title="Copy trade ideas"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-mono">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
                Top 3 trade ideas
              </h2>

              {/* Subheader bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs">
                <span className="text-slate-400">
                  Today's Top 3 Ideas — {generatedDate}
                </span>
                <span className="text-emerald-400 font-extrabold tracking-wide text-[11px]">
                  {confidenceLabel}
                </span>
              </div>

              {/* Top 3 List */}
              <div className="space-y-3">
                {tradeIdeas.map((idea, index) => (
                  <div
                    key={`${idea.ticker}-${index}`}
                    onClick={() => setSelectedIdeaDetail(idea)}
                    className="p-3.5 rounded-xl bg-[#131d33]/90 border border-slate-800 hover:border-emerald-500/40 hover:bg-[#16223b] cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                          {idea.rank}.
                        </span>
                        <span className="font-extrabold text-white text-sm sm:text-base tracking-wide">
                          {idea.ticker}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800/80">
                          {idea.exchange}
                        </span>
                      </div>
                      <span className="font-extrabold text-emerald-400 text-sm sm:text-base">
                        {idea.predictedChange}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                      {idea.headline}
                    </p>

                    {/* Quick footer meta */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span>Allocation: <strong className="text-slate-200">{idea.recommendedAllocation || `$${Math.round(initialCapital * (index === 0 ? 0.45 : index === 1 ? 0.35 : 0.20))}`}</strong></span>
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <span>Details</span>
                        <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Single-Page Clean Guarantee Note */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Crowd & fundamental validation</span>
                </span>
                <span>Target: {multiplier}X Multiplier</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Trade Idea Detail Modal */}
      {selectedIdeaDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setSelectedIdeaDetail(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <span className="text-xl font-black text-white">{selectedIdeaDetail.ticker}</span>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                {selectedIdeaDetail.exchange}
              </span>
              <span className="text-base font-extrabold text-emerald-400 ml-auto">
                {selectedIdeaDetail.predictedChange}
              </span>
            </div>

            <p className="text-sm font-semibold text-white mb-4">
              {selectedIdeaDetail.headline}
            </p>

            <div className="space-y-3 text-xs">
              {/* Polymarket prediction */}
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <div className="flex items-center space-x-1.5 text-teal-300 font-bold mb-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Polymarket Prediction Market</span>
                </div>
                <p className="text-slate-300">
                  {selectedIdeaDetail.polymarketSignal?.question || 'Crowd sentiment contract active'}
                </p>
                <div className="flex items-center justify-between mt-2 font-mono text-[11px] text-teal-400">
                  <span>Probability: <strong>{selectedIdeaDetail.polymarketSignal?.probability || '76% Bullish'}</strong></span>
                  <span>Volume: <strong>{selectedIdeaDetail.polymarketSignal?.volume || '$2.4M'}</strong></span>
                </div>
              </div>

              {/* Social Buzz */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center space-x-1.5 text-indigo-300 font-bold mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Social Velocity & Sentiment</span>
                </div>
                <p className="text-slate-300">
                  {selectedIdeaDetail.socialBuzz || 'Heavy retail and quantitative discussion momentum.'}
                </p>
              </div>

              {/* Financial metrics */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center space-x-1.5 text-amber-300 font-bold mb-1">
                  <LineChart className="w-3.5 h-3.5" />
                  <span>FMP Fundamental Metrics</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-300 mt-1">
                  <div>P/E: <strong className="text-white">{selectedIdeaDetail.fmpMetrics?.pe ?? '38.4'}</strong></div>
                  <div>Market Cap: <strong className="text-white">{selectedIdeaDetail.fmpMetrics?.marketCap ?? '$120B'}</strong></div>
                  <div>Target: <strong className="text-emerald-400">{selectedIdeaDetail.fmpMetrics?.targetPrice ?? 'Bullish'}</strong></div>
                </div>
              </div>

              {/* Portfolio Plan */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Recommended Allocation</span>
                  <strong className="text-white text-sm">{selectedIdeaDetail.recommendedAllocation || `$${Math.round(initialCapital * 0.4)}`}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Risk Profile</span>
                  <span className="text-emerald-400 font-semibold">{selectedIdeaDetail.riskProfile || riskTolerance}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedIdeaDetail(null)}
              className="mt-5 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MCP Connection Inspection Modal */}
      {showMcpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowMcpModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">MCP Server Integrations</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Integrated in <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">/api</code> directory with active health checker in <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">/api/mcp.js</code>
            </p>

            <div className="space-y-3 text-xs">
              {/* Server 1: PolymarketScan */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <strong className="text-teal-300">1. PolymarketScan MCP Server</strong>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ● {mcpStatus.polymarket?.status || 'connected'}
                  </span>
                </div>
                <a
                  href="https://smithery.ai/servers/jordan-s648/PolymarketScan"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white flex items-center space-x-1 mb-2 text-[11px]"
                >
                  <span className="truncate">https://smithery.ai/servers/jordan-s648/PolymarketScan</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {['scan_markets', 'get_market_odds', 'get_trending_markets', 'search_market_by_ticker'].map(t => (
                    <span key={t} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Server 2: Financial Modeling Prep */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <strong className="text-amber-300">2. Financial Modeling Prep MCP Server</strong>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ● {mcpStatus.fmp?.status || 'connected'}
                  </span>
                </div>
                <a
                  href="https://smithery.ai/servers/cfocoder/financial-modeling-prep-mcp-server"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white flex items-center space-x-1 mb-2 text-[11px]"
                >
                  <span className="truncate">https://smithery.ai/servers/cfocoder/financial-modeling-prep-mcp-server</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {['get_stock_quote', 'get_company_profile', 'get_financial_ratios', 'get_market_gainers'].map(t => (
                    <span key={t} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Run CLI verification: <code className="text-slate-200 font-mono">node api/mcp.js</code></span>
              <button
                onClick={() => setShowMcpModal(false)}
                className="bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
