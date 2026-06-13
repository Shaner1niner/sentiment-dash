// Asset Briefing Synthesis Helper v1
//
// Deterministic contract helper for combined Asset Briefing reads.
// No UI side effects, no payload mutation, no open-ended prose generation.
// See docs/ASSET_BRIEFING_SYNTHESIS_CONTRACT_V1.md.

const POSITIVE_WORDS = [
  'improving', 'repair', 'constructive', 'strong', 'firm', 'stabilizing',
  'positive', 'aligned', 'expansion', 'confirmation', 'broadening', 'supportive'
];

const NEGATIVE_WORDS = [
  'weak', 'fading', 'deteriorating', 'soft', 'negative', 'risk-off',
  'breakdown', 'distribution', 'narrow', 'thin', 'fragile', 'unconfirmed'
];

const CRYPTO_ASSETS = new Set(['BTC', 'ETH', 'SOL', 'AVAX', 'BNB', 'DOGE', 'LINK', 'XRP']);
const ETF_ASSETS = new Set(['SPY', 'QQQ', 'GLD', 'TLT', 'DXY', 'XLE']);

function cleanText(value) {
  return String(value || '').trim();
}

function lowerText(value) {
  return cleanText(value).toLowerCase();
}

function firstDefined(row, keys) {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function scoreText(text) {
  const value = lowerText(text);
  if (!value) return 0;
  let score = 0;
  POSITIVE_WORDS.forEach((word) => { if (value.includes(word)) score += 1; });
  NEGATIVE_WORDS.forEach((word) => { if (value.includes(word)) score -= 1; });
  return score;
}

function scoreNumeric(value, positiveThreshold = 0.08, negativeThreshold = -0.08) {
  const n = numberOrNull(value);
  if (n === null) return 0;
  if (n >= positiveThreshold) return 1;
  if (n <= negativeThreshold) return -1;
  return 0;
}

function classifyAssetLayer(asset) {
  const ticker = cleanText(asset).toUpperCase();
  if (CRYPTO_ASSETS.has(ticker)) return 'crypto';
  if (ETF_ASSETS.has(ticker)) return 'etf_macro';
  return 'equity';
}

function classifyMomentum(input = {}) {
  const text = [
    input.momentum_state,
    input.momentum_label,
    input.macd_state,
    input.hist_state,
    input.technical_state,
    input.structure_trend_label,
    input.structure_state,
    input.regime_label
  ].map(lowerText).join(' ');

  const explicit = lowerText(firstDefined(input, ['momentum_state', 'momentumState']));
  if (explicit) return explicit.replace(/\s+/g, '_');

  if (text.includes('fading') || text.includes('weakening') || text.includes('deteriorating')) return 'fading';
  if (text.includes('stabilizing') || text.includes('repair')) return 'stabilizing';
  if (text.includes('strong') || text.includes('improving') || text.includes('positive')) return 'improving';

  const histScore = scoreNumeric(firstDefined(input, ['hist', 'histogram', 'macd_hist', 'macd_histogram']), 0.02, -0.02);
  const macdScore = scoreNumeric(firstDefined(input, ['macd', 'macd_value']), 0.02, -0.02);
  const rsi = numberOrNull(firstDefined(input, ['rsi', 'RSI']));

  if (macdScore > 0 && histScore < 0) return 'trend_present_impulse_fading';
  if (macdScore < 0 && histScore < 0) return 'weak';
  if (macdScore > 0 && histScore >= 0) return 'improving';
  if (rsi !== null && rsi >= 55) return 'firm';
  if (rsi !== null && rsi <= 45) return 'soft';
  return 'mixed';
}

function classifySentiment(input = {}) {
  const explicit = lowerText(firstDefined(input, ['sentiment_state', 'sentimentState']));
  if (explicit) return explicit.replace(/\s+/g, '_');

  const text = [
    input.sentiment_label,
    input.sentiment_summary,
    input.emotional_state,
    input.primary_read,
    input.what_seta_sees
  ].map(lowerText).join(' ');

  if (text.includes('improving') || text.includes('repair') || text.includes('stabilizing')) return 'improving';
  if (text.includes('deteriorating') || text.includes('weakening') || text.includes('negative')) return 'deteriorating';

  const zScore = scoreNumeric(firstDefined(input, ['sentiment_z', 'sentimentZ', 'sentiment_zscore']), 0.4, -0.4);
  const compoundScore = scoreNumeric(firstDefined(input, ['combined_compound', 'sentiment_score', 'weighted_sentiment']), 0.08, -0.08);
  const score = zScore || compoundScore || scoreText(text);
  if (score > 0) return 'improving';
  if (score < 0) return 'weak';
  return 'mixed';
}

function classifyParticipation(input = {}) {
  const explicit = lowerText(firstDefined(input, ['participation_state', 'participationState', 'breadth_state']));
  if (explicit) return explicit.replace(/\s+/g, '_');

  const text = [
    input.participation_quality,
    input.participation_summary,
    input.breadth_label,
    input.source_mix_summary,
    input.evidence
  ].map(lowerText).join(' ');

  if (text.includes('broad') || text.includes('distributed') || text.includes('broadening')) return 'broad';
  if (text.includes('narrow') || text.includes('concentrated') || text.includes('thin')) return 'narrow';
  if (text.includes('quiet') || text.includes('mixed')) return 'mixed';

  const breadthPositive = numberOrNull(firstDefined(input, ['breadth_positive', 'positive_sector_count']));
  const breadthTotal = numberOrNull(firstDefined(input, ['breadth_total', 'sector_count']));
  if (breadthPositive !== null && breadthTotal) {
    const ratio = breadthPositive / breadthTotal;
    if (ratio >= 0.65) return 'broad';
    if (ratio <= 0.35) return 'narrow';
  }
  return 'mixed';
}

function classifyAttention(input = {}) {
  const explicit = lowerText(firstDefined(input, ['attention_state', 'attentionState', 'attention_label']));
  if (explicit) return explicit.replace(/\s+/g, '_');

  const text = [
    input.attention_summary,
    input.market_tape_summary,
    input.participation_quality,
    input.evidence
  ].map(lowerText).join(' ');

  if (text.includes('elevated') || text.includes('active') || text.includes('high')) return 'elevated';
  if (text.includes('quiet') || text.includes('low')) return 'quiet';
  if (text.includes('concentrated')) return 'concentrated';
  return 'mixed';
}

function classifyRegime(input = {}) {
  const explicit = lowerText(firstDefined(input, ['regime_posture', 'regimePosture']));
  if (explicit) return explicit.replace(/\s+/g, '_');

  const text = [
    input.regime_label,
    input.structure_state,
    input.primary_read,
    input.what_seta_sees,
    input.signal_state
  ].map(lowerText).join(' ');

  if (text.includes('breakdown') || text.includes('distribution')) return 'weak_structure';
  if (text.includes('repair')) return 'repair';
  if (text.includes('confirmed') || text.includes('confirmation')) return 'confirmation_context';
  if (text.includes('improving') || text.includes('constructive')) return 'constructive';
  return 'mixed';
}

function deriveCombinedState(parts) {
  const { regime, momentum, sentiment, participation, attention } = parts;
  const momentumWeak = ['weak', 'soft', 'fading', 'trend_present_impulse_fading'].includes(momentum);
  const momentumImproving = ['improving', 'firm', 'stabilizing'].includes(momentum);
  const sentimentImproving = ['improving', 'positive', 'stabilizing'].includes(sentiment);
  const sentimentWeak = ['weak', 'deteriorating', 'negative'].includes(sentiment);
  const participationNarrow = ['narrow', 'thin', 'concentrated'].includes(participation);
  const participationBroad = ['broad', 'broadening', 'distributed'].includes(participation);
  const weakRegime = ['weak_structure', 'distribution_breakdown'].includes(regime);
  const attentionElevated = ['elevated', 'active', 'concentrated'].includes(attention);

  if (sentimentImproving && momentumWeak) return 'sentiment_price_divergence';
  if (momentumImproving && sentimentWeak) return 'mechanical_repair_with_emotional_drag';
  if (weakRegime && (sentimentImproving || momentumImproving)) return 'breakdown_with_improving_internals';
  if (attentionElevated && participationNarrow && !momentumImproving) return 'attention_without_validation';
  if (momentum === 'trend_present_impulse_fading') return 'momentum_fade';
  if (sentimentImproving && participationNarrow) return 'fragile_repair';
  if (sentimentImproving || momentumImproving) return participationBroad ? 'qualified_confirmation' : 'early_repair';
  if (momentumImproving && sentimentImproving && participationBroad) return 'clean_confirmation';
  if (weakRegime) return 'deterioration_with_residual_strength';
  return 'mixed_structure';
}

function deriveConfirmationQuality(parts, combinedState) {
  if (combinedState === 'clean_confirmation') return 'clean_confirmation';
  if (combinedState === 'qualified_confirmation') return 'qualified_confirmation';
  if (combinedState === 'attention_without_validation') return 'attention_without_validation';
  if (combinedState === 'sentiment_price_divergence') return 'incomplete_confirmation';
  if (combinedState === 'fragile_repair') return 'repair_not_confirmed';
  if (combinedState === 'momentum_fade') return 'fragile_confirmation';
  if (combinedState === 'breakdown_with_improving_internals') return 'repair_not_confirmed';
  if (combinedState === 'mechanical_repair_with_emotional_drag') return 'incomplete_confirmation';
  return 'incomplete_confirmation';
}

function derivePrimaryTension(parts, combinedState) {
  const { momentum, sentiment, participation, attention } = parts;
  if (combinedState === 'sentiment_price_divergence') return 'sentiment repair is outpacing price confirmation';
  if (combinedState === 'mechanical_repair_with_emotional_drag') return 'price mechanics are stabilizing before sentiment has confirmed the repair';
  if (combinedState === 'attention_without_validation') return 'attention is elevated without broad structural validation';
  if (combinedState === 'momentum_fade') return 'trend structure remains present while impulse quality fades';
  if (combinedState === 'fragile_repair') return 'repair is visible but participation remains narrow';
  if (combinedState === 'breakdown_with_improving_internals') return 'internals are improving inside a still-soft broader structure';
  if (participation === 'narrow') return 'confirmation is limited by narrow participation';
  if (attention === 'elevated') return 'attention is active, so validation quality matters more than activity level';
  if (momentum === 'mixed' || sentiment === 'mixed') return 'signals are mixed, so confirmation quality remains the focus';
  return 'signals are aligned enough that durability and breadth become the next test';
}

function deriveWatchNext(parts, combinedState) {
  if (combinedState === 'sentiment_price_divergence') return 'whether price momentum stabilizes enough to confirm sentiment repair';
  if (combinedState === 'attention_without_validation') return 'whether attention broadens into participation and structure';
  if (combinedState === 'momentum_fade') return 'whether impulse quality stabilizes or keeps fading';
  if (combinedState === 'fragile_repair') return 'whether participation broadens beyond the current repair pocket';
  if (combinedState === 'breakdown_with_improving_internals') return 'whether improving internals can lift the broader structure';
  return 'whether confirmation quality broadens across momentum, sentiment, and participation';
}

function phraseForCombinedState(state) {
  const map = {
    clean_confirmation: 'clean confirmation',
    qualified_confirmation: 'qualified confirmation',
    early_repair: 'early repair',
    fragile_repair: 'fragile repair',
    momentum_fade: 'momentum fade',
    sentiment_price_divergence: 'sentiment-price divergence',
    attention_without_validation: 'attention without validation',
    breakdown_with_improving_internals: 'breakdown with improving internals',
    deterioration_with_residual_strength: 'deterioration with residual strength',
    mechanical_repair_with_emotional_drag: 'mechanical repair with emotional drag',
    mixed_structure: 'mixed structure'
  };
  return map[state] || 'mixed structure';
}

function languageNounForAssetLayer(layer) {
  if (layer === 'crypto') return 'narrative and participation quality';
  if (layer === 'etf_macro') return 'breadth and macro confirmation quality';
  return 'leadership and participation quality';
}

export function synthesizeAssetBriefing(input = {}) {
  const asset = cleanText(firstDefined(input, ['asset', 'ticker', 'term'])) || 'Asset';
  const assetLayer = classifyAssetLayer(asset);
  const parts = {
    regime: classifyRegime(input),
    momentum: classifyMomentum(input),
    sentiment: classifySentiment(input),
    participation: classifyParticipation(input),
    attention: classifyAttention(input)
  };
  const combinedState = deriveCombinedState(parts);
  const confirmationQuality = deriveConfirmationQuality(parts, combinedState);
  const primaryTension = derivePrimaryTension(parts, combinedState);
  const watchNext = deriveWatchNext(parts, combinedState);

  return {
    schema: 'asset_briefing_synthesis_v1',
    asset,
    asset_layer: assetLayer,
    combined_state: combinedState,
    combined_state_label: phraseForCombinedState(combinedState),
    regime_posture: parts.regime,
    momentum_state: parts.momentum,
    sentiment_state: parts.sentiment,
    participation_state: parts.participation,
    attention_state: parts.attention,
    confirmation_quality: confirmationQuality,
    primary_tension: primaryTension,
    watch_next: watchNext,
    language_focus: languageNounForAssetLayer(assetLayer),
    safety: {
      educational_context_only: true,
      no_trade_instruction: true,
      no_price_target: true
    }
  };
}

export function assetBriefingSynthesisPreview(input = {}) {
  const result = synthesizeAssetBriefing(input);
  return `${result.asset} reads as ${result.combined_state_label}. The primary tension is ${result.primary_tension}, so confirmation quality remains ${result.confirmation_quality.replace(/_/g, ' ')}. Watch next: ${result.watch_next}.`;
}

export const ASSET_BRIEFING_SYNTHESIS_STATES = Object.freeze([
  'clean_confirmation',
  'qualified_confirmation',
  'early_repair',
  'fragile_repair',
  'momentum_fade',
  'sentiment_price_divergence',
  'attention_without_validation',
  'breakdown_with_improving_internals',
  'deterioration_with_residual_strength',
  'mechanical_repair_with_emotional_drag',
  'mixed_structure'
]);

if (typeof window !== 'undefined') {
  window.SETA_ASSET_BRIEFING_SYNTHESIS = Object.freeze({
    synthesizeAssetBriefing,
    assetBriefingSynthesisPreview,
    ASSET_BRIEFING_SYNTHESIS_STATES
  });
}
