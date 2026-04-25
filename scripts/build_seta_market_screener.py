
from __future__ import annotations

"""
Build SETA market screener v2.

Inputs expected in SOURCE_DIR:
  - final_combined_data_enriched_chart_history.csv
  - seta_alert_audit_365d.csv
  - seta_alert_events_365d.csv

Output:
  - seta_market_screener_365d.csv

Design rules:
  1. Public-comparable price TA stays conventional: RSI, MACD, MACD signal, histogram are not z-scored or altered.
  2. SETA relationship scores may use rolling z-scores, slopes, spreads, recency decay, and nonlinear scoring.
  3. Direction scores are 0-100:
       0 = bearish / negative
      50 = neutral
     100 = bullish / positive
  4. Attention priority scores are 0-100:
       0 = low review priority
     100 = high review priority
"""

import argparse
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

import numpy as np
import pandas as pd


DEFAULT_SOURCE_DIR = Path(r"G:\My Drive\Tableau_AutoSync")
DEFAULT_OUTPUT_FILENAME = "seta_market_screener_365d.csv"
SCREENER_MODEL_VERSION = "phase_g_matrix_v1_2026_04_25"


# ---------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------

def n(v, default=np.nan) -> float:
    """Coerce a scalar to float, returning default for missing/non-numeric."""
    try:
        if v is None or (isinstance(v, float) and math.isnan(v)):
            return default
        out = float(v)
        return out if math.isfinite(out) else default
    except Exception:
        return default


def clamp(v, lo=0.0, hi=100.0) -> float:
    v = n(v, np.nan)
    if np.isnan(v):
        return np.nan
    return float(max(lo, min(hi, v)))


def sign(v, eps=1e-12) -> int:
    v = n(v, 0.0)
    if v > eps:
        return 1
    if v < -eps:
        return -1
    return 0


def direction_sign(label) -> int:
    s = str(label or "").strip().lower()
    if "bull" in s:
        return 1
    if "bear" in s:
        return -1
    return 0


def safe_div(a, b, default=np.nan):
    a, b = n(a), n(b)
    if np.isnan(a) or np.isnan(b) or abs(b) < 1e-12:
        return default
    return a / b


def pct_vs(value, ref):
    return safe_div(n(value) - n(ref), n(ref))


def existing_cols(df: pd.DataFrame, cols: Iterable[str]) -> list[str]:
    return [c for c in cols if c in df.columns]


def first_existing(df: pd.DataFrame, *cols: str) -> Optional[str]:
    lower_to_real = {str(c).lower(): c for c in df.columns}
    for c in cols:
        if c in df.columns:
            return c
        real = lower_to_real.get(str(c).lower())
        if real is not None:
            return real
    return None


def to_date(s):
    return pd.to_datetime(s, errors="coerce").dt.normalize()


def days_since(date_value, asof_date) -> float:
    if pd.isna(date_value) or pd.isna(asof_date):
        return np.nan
    return float((pd.Timestamp(asof_date).normalize() - pd.Timestamp(date_value).normalize()).days)


def recency_decay(days, half_life_days=7.0) -> float:
    days = n(days, np.nan)
    if np.isnan(days) or days < 0:
        return 0.0
    return float(math.exp(-days / float(half_life_days)))


def recency_bucket(days) -> str:
    d = n(days, np.nan)
    if np.isnan(d):
        return "none"
    if d <= 0:
        return "today"
    if d <= 3:
        return "1-3d"
    if d <= 7:
        return "4-7d"
    if d <= 30:
        return "8-30d"
    return "stale"


def score_to_label(score, bullish="Bullish", bearish="Bearish", neutral="Neutral", weak_band=7.5) -> str:
    x = n(score, np.nan)
    if np.isnan(x):
        return "Unknown"
    if x >= 50 + weak_band:
        return bullish
    if x <= 50 - weak_band:
        return bearish
    return neutral


def format_reason(items: list[str], term: str | None = None) -> str:
    items = [str(x).strip() for x in items if str(x).strip()]
    if not items:
        items = ["signals mostly neutral", "no fresh confirmed event"]
    prefix = f"{term} ranked high because: " if term else ""
    return prefix + "; ".join(items[:7]) + "."


def rolling_z_by_term(df: pd.DataFrame, col: str, window=126, min_periods=20) -> pd.Series:
    if col not in df.columns:
        return pd.Series(np.nan, index=df.index)

    def _z(s: pd.Series) -> pd.Series:
        x = pd.to_numeric(s, errors="coerce")
        mu = x.rolling(window, min_periods=min_periods).mean()
        sd = x.rolling(window, min_periods=min_periods).std()
        return (x - mu) / sd.replace(0, np.nan)

    return df.groupby("term", group_keys=False)[col].apply(_z)


def group_diff(df: pd.DataFrame, col: str, periods=1) -> pd.Series:
    if col not in df.columns:
        return pd.Series(np.nan, index=df.index)
    return df.groupby("term")[col].diff(periods)


def latest_by_term(df: pd.DataFrame) -> pd.DataFrame:
    return df.sort_values(["term", "date"]).groupby("term", as_index=False).tail(1).copy()


# ---------------------------------------------------------------------
# Indicator matrix + archetype helpers
# ---------------------------------------------------------------------

def value_label_0_100(score, bullish="Bullish", bearish="Bearish", neutral="Neutral") -> str:
    x = n(score, np.nan)
    if np.isnan(x):
        return "Unknown"
    if x >= 70:
        return f"Strong {bullish}"
    if x >= 57.5:
        return bullish
    if x <= 30:
        return f"Strong {bearish}"
    if x <= 42.5:
        return bearish
    return neutral


def strength_label_0_100(score) -> str:
    x = n(score, np.nan)
    if np.isnan(x):
        return "Unknown"
    d = abs(x - 50.0)
    if d >= 35:
        return "Extreme"
    if d >= 25:
        return "Strong"
    if d >= 12.5:
        return "Moderate"
    if d >= 5:
        return "Light"
    return "Neutral"


def confidence_label(score) -> str:
    x = n(score, np.nan)
    if np.isnan(x):
        return "Unknown"
    if x >= 75:
        return "High"
    if x >= 55:
        return "Medium"
    if x >= 35:
        return "Low / Mixed"
    return "Low"


def matrix_interpretation(indicator_name: str, row: pd.Series, score) -> str:
    term = row.get("term", "Asset")
    s = n(score, np.nan)
    dlabel = value_label_0_100(s)
    il = str(indicator_name)
    if np.isnan(s):
        return f"{term}: {il} is unavailable for the latest row."
    if il == "bollinger_direction_score":
        return f"{term}: overlap/Bollinger pressure is {dlabel.lower()}, with 50 representing inside-overlap neutrality."
    if il == "attention_adjusted_bollinger_score":
        return f"{term}: overlap signal after participation adjustment is {dlabel.lower()}."
    if il == "price_macd_direction_score":
        return f"{term}: classical price MACD momentum is {dlabel.lower()} based on line/signal, histogram, slope, and zero-line context."
    if il == "sentiment_macd_direction_score":
        return f"{term}: sentiment MACD momentum is {dlabel.lower()}; this measures sentiment direction, not just agreement with price."
    if il == "sent_price_macd_crossover_score":
        cross = row.get("sent_price_macd_cross", "")
        days = row.get("sent_price_macd_cross_days", "")
        return f"{term}: sentiment-vs-price MACD crossover score is {dlabel.lower()} ({cross or 'no fresh cross'}, days={days})."
    if il == "sent_price_macd_joint_slope_score":
        return f"{term}: sentiment/price MACD joint-slope state is {row.get('sent_price_macd_joint_slope_label', 'Unknown')}."
    if il == "macd_family_direction_score":
        return f"{term}: sentiment-enhanced MACD family reads {row.get('macd_family_label', dlabel)}."
    if il == "price_rsi_state_score":
        return f"{term}: price RSI state is {dlabel.lower()} ({row.get('price_rsi_risk_label', 'risk unknown')})."
    if il == "sentiment_rsi_state_score":
        return f"{term}: sentiment RSI state is {dlabel.lower()} ({row.get('sentiment_rsi_risk_label', 'risk unknown')})."
    if il == "sent_price_rsi_relationship_score":
        return f"{term}: sentiment-vs-price RSI relationship is {row.get('sent_price_rsi_relationship_label', dlabel)}."
    if il == "sent_ribbon_direction_score":
        return f"{term}: sentiment ribbon direction is {dlabel.lower()} ({row.get('sent_ribbon_label', 'label unknown')})."
    if il == "sent_ribbon_structure_score":
        return f"{term}: sentiment ribbon structure/confidence is {confidence_label(s).lower()}."
    if il == "attention_participation_score":
        return f"{term}: attention/participation is {confidence_label(s).lower()} and can raise review priority when aligned with signal direction."
    if il == "signal_dispersion_score":
        return f"{term}: family-level disagreement is {strength_label_0_100(50 + min(50, s)).lower()}; higher dispersion means more conflict."
    if il == "signal_consensus_direction_score":
        return f"{term}: overall signal consensus is {dlabel.lower()}."
    return f"{term}: {il} is {dlabel.lower()} with {strength_label_0_100(s).lower()} directional strength."


def build_indicator_matrix(out: pd.DataFrame) -> pd.DataFrame:
    specs = [
        ("Summary", "signal_consensus_direction_score", 1.00, "direction"),
        ("Summary", "signal_consensus_confidence_score", 0.00, "confidence"),
        ("Summary", "signal_dispersion_score", 0.00, "dispersion"),
        ("Bollinger / Overlap", "bollinger_direction_score", 0.22, "direction"),
        ("Bollinger / Overlap", "bollinger_confidence_score", 0.00, "confidence"),
        ("Bollinger / Overlap", "bollinger_watch_cluster_score", 0.08, "direction"),
        ("Bollinger / Overlap", "attention_adjusted_bollinger_score", 0.12, "direction"),
        ("MACD", "price_macd_direction_score", 0.30, "direction"),
        ("MACD", "sentiment_macd_direction_score", 0.25, "direction"),
        ("MACD", "sent_price_macd_spread_score", 0.15, "direction"),
        ("MACD", "sent_price_macd_crossover_score", 0.10, "direction"),
        ("MACD", "sent_price_macd_joint_slope_score", 0.20, "direction"),
        ("MACD", "macd_family_direction_score", 0.20, "direction"),
        ("RSI", "price_rsi_state_score", 0.10, "direction"),
        ("RSI", "sentiment_rsi_state_score", 0.10, "direction"),
        ("RSI", "sent_price_rsi_relationship_score", 0.10, "direction"),
        ("RSI", "stoch_rsi_timing_score", 0.05, "direction"),
        ("RSI", "rsi_family_state_score", 0.10, "direction"),
        ("Sentiment Ribbon", "sent_ribbon_direction_score", 0.16, "direction"),
        ("Sentiment Ribbon", "sent_ribbon_structure_score", 0.00, "confidence"),
        ("Sentiment Ribbon", "sent_ribbon_transition_risk_score", 0.00, "risk"),
        ("MA Trend", "ma_trend_direction_score", 0.12, "direction"),
        ("Attention", "attention_participation_score", 0.00, "attention"),
        ("Attention", "attention_confirmation_score", 0.00, "confidence"),
    ]
    rows = []
    for _, r in out.iterrows():
        term = r.get("term")
        latest_date = r.get("latest_data_date")
        priority = n(r.get("screener_attention_priority_score"), np.nan)
        for family, name, consensus_weight, role in specs:
            if name not in out.columns:
                continue
            raw = r.get(name)
            score = n(raw, np.nan)
            if np.isnan(score):
                direction_label = "Unknown"
                strength = "Unknown"
                conf = "Unknown"
                contribution = np.nan
            else:
                if role == "dispersion":
                    direction_label = "High Conflict" if score >= 22 else ("Low Conflict" if score < 14 else "Moderate Conflict")
                    strength = strength_label_0_100(50 + min(50, score))
                    conf = "Lower" if score >= 22 else "Higher"
                    contribution = np.nan
                elif role in ("confidence", "attention"):
                    direction_label = confidence_label(score)
                    strength = confidence_label(score)
                    conf = confidence_label(score)
                    contribution = np.nan
                elif role == "risk":
                    direction_label = "High Risk" if score >= 60 else ("Moderate Risk" if score >= 30 else "Low Risk")
                    strength = direction_label
                    conf = "n/a"
                    contribution = np.nan
                else:
                    direction_label = value_label_0_100(score)
                    strength = strength_label_0_100(score)
                    conf = confidence_label(n(r.get("signal_consensus_confidence_score"), 50))
                    contribution = (score - 50.0) * consensus_weight
            priority_contribution = np.nan
            if name in ["signal_consensus_direction_score", "attention_participation_score", "attention_confirmation_score", "bollinger_confidence_score"] and not np.isnan(score):
                priority_contribution = abs(score - 50.0) if name == "signal_consensus_direction_score" else score / 2.0
            rows.append({
                "term": term,
                "latest_data_date": latest_date,
                "indicator_family": family,
                "indicator_name": name,
                "indicator_role": role,
                "raw_value": raw,
                "score_0_100": score,
                "direction_label": direction_label,
                "strength_label": strength,
                "confidence_label": conf,
                "contribution_to_consensus": contribution,
                "contribution_to_attention_priority": priority_contribution,
                "screener_attention_priority_score": priority,
                "interpretation": matrix_interpretation(name, r, score),
            })
    matrix = pd.DataFrame(rows)
    if not matrix.empty:
        matrix = matrix.sort_values(["term", "indicator_family", "indicator_name"]).reset_index(drop=True)
    return matrix


def _archetype_candidate(name, direction, confidence, boost, summary, risk_note, matched, missing=""):
    return {
        "archetype_name": name,
        "archetype_direction": direction,
        "archetype_confidence": clamp(confidence),
        "archetype_priority_boost": clamp(boost),
        "archetype_summary": summary,
        "archetype_risk_note": risk_note,
        "matched_conditions": matched,
        "missing_confirmations": missing,
    }


def match_archetypes_for_row(row: pd.Series) -> list[dict]:
    term = row.get("term", "Asset")
    archetypes = []
    cons = n(row.get("signal_consensus_direction_score"), 50)
    priority = n(row.get("screener_attention_priority_score"), 0)
    dispersion = n(row.get("signal_dispersion_score"), 50)
    conf = n(row.get("signal_consensus_confidence_score"), 50)
    attn = n(row.get("attention_participation_score"), 50)
    boll = n(row.get("bollinger_direction_score"), 50)
    sent_macd = n(row.get("sentiment_macd_direction_score"), 50)
    price_macd = n(row.get("price_macd_direction_score"), 50)
    days_conf = n(row.get("days_since_latest_confirmed"), np.nan)
    latest_conf_dir = str(row.get("latest_confirmed_event_direction") or "").lower()
    recent_watch = n(row.get("recent_watch_count_7d"), 0)
    recent_confirmed = n(row.get("recent_confirmed_count_7d"), 0)
    joint = str(row.get("sent_price_macd_joint_slope_label") or "")
    rsi_risk = f"{row.get('price_rsi_risk_label', '')} {row.get('sentiment_rsi_risk_label', '')}".lower()
    ribbon_label = str(row.get("sent_ribbon_label") or "").lower()

    if days_conf <= 7 and "bull" in latest_conf_dir and boll >= 60:
        archetypes.append(_archetype_candidate("Fresh Bullish Reversal", "Bullish", max(conf, 70), 90, f"{term} has a fresh confirmed bullish overlap event with supportive Bollinger pressure.", "Mean-reversion/reversal setups still need price follow-through after the confirmed event.", "latest confirmed <= 7d; confirmed direction bullish; Bollinger direction above neutral", "Watch for price confirmation and follow-through volume"))
    if days_conf <= 7 and "bear" in latest_conf_dir and boll <= 40:
        archetypes.append(_archetype_candidate("Fresh Bearish Fade", "Bearish", max(conf, 70), 90, f"{term} has a fresh confirmed bearish overlap event with negative Bollinger pressure.", "Bearish fades can squeeze if price momentum and participation reverse upward.", "latest confirmed <= 7d; confirmed direction bearish; Bollinger direction below neutral", "Watch for failed-break re-entry or improving MACD slopes"))
    if ("Sentiment Repair" in joint or (sent_macd >= 62 and price_macd < 55)):
        archetypes.append(_archetype_candidate("Sentiment Repair Ahead of Price", "Bullish", min(90, 55 + max(0, sent_macd - price_macd)), 70, f"{term} shows sentiment MACD repair before price momentum has fully confirmed.", "Early repair signals are useful but less reliable until price MACD confirms.", "sentiment MACD improving; price MACD lagging or mixed", "Price MACD confirmation still missing" if price_macd < 55 else ""))
    if ("Deteriorating" in joint or (sent_macd <= 38 and price_macd > 45)):
        archetypes.append(_archetype_candidate("Narrative Deterioration Despite Price Strength", "Bearish", min(90, 55 + max(0, price_macd - sent_macd)), 70, f"{term} shows weakening sentiment momentum while price momentum is not yet fully broken.", "This can be an early warning rather than an immediate breakdown signal.", "sentiment MACD deteriorating; price MACD still better than sentiment", "Price breakdown confirmation still missing" if price_macd > 45 else ""))
    if cons >= 65 and dispersion < 18 and attn >= 55:
        archetypes.append(_archetype_candidate("Clean Bullish Consensus", "Bullish", min(95, conf + 10), 80, f"{term} has broad bullish agreement across signal families with confirming attention.", "Clean consensus can still be extended if RSI risk labels show overbought conditions.", "consensus bullish; dispersion low; attention elevated"))
    if cons <= 35 and dispersion < 18 and attn >= 55:
        archetypes.append(_archetype_candidate("Clean Bearish Consensus", "Bearish", min(95, conf + 10), 80, f"{term} has broad bearish agreement across signal families with confirming attention.", "Clean bearish consensus can still reverse sharply if it is already washed out.", "consensus bearish; dispersion low; attention elevated"))
    if priority >= 65 and dispersion >= 22:
        archetypes.append(_archetype_candidate("High-Attention Conflict", "Mixed", max(45, conf - 10), 65, f"{term} is high-priority, but major signal families disagree.", "Treat as a research candidate rather than a clean directional setup.", "attention priority high; signal dispersion elevated", "Wait for one or more families to resolve the conflict"))
    if recent_watch >= 3 and recent_confirmed == 0:
        archetypes.append(_archetype_candidate("Watch Cluster Building", "Mixed", 55 + min(25, recent_watch * 3), 60, f"{term} has multiple recent watch candidates but no recent confirmed alert.", "Clusters can precede confirmation, but they are not confirmation by themselves.", "recent watch count elevated; recent confirmed count zero", "Needs confirmed event, volume, or volatility gate"))
    if days_conf > 30 and n(row.get("confirmed_count"), 0) > 0:
        archetypes.append(_archetype_candidate("Stale Confirmed Event", "Stale", 45, 25, f"{term} has historical confirmed events, but the latest confirmed signal is stale.", "Do not overweight old confirmations unless the current family scores still support them.", "latest confirmed event older than 30 days", "Fresh event or current consensus confirmation missing"))
    if "coiling" in ribbon_label or n(row.get("sent_ribbon_transition_risk_score"), 0) >= 45:
        archetypes.append(_archetype_candidate("Compression Coil / Transition Risk", "Mixed", 55, 55, f"{term} has a sentiment ribbon compression or transition-risk profile.", "Compression can precede expansion, but direction should come from follow-through and consensus.", "ribbon coiling/compression or transition-risk elevated"))
    if "overbought" in rsi_risk or "exhaustion" in rsi_risk:
        archetypes.append(_archetype_candidate("Overextended / Exhaustion Risk", "Risk", 60, 50, f"{term} has RSI extension risk even if directional scores remain constructive.", "Strength can persist, but risk/reward may be less favorable after extension.", "price or sentiment RSI shows overbought/exhaustion risk"))
    if priority < 35 and abs(cons - 50) < 10:
        archetypes.append(_archetype_candidate("Quiet Neutral", "Neutral", 65, 5, f"{term} has low review priority and mostly neutral signal state.", "No immediate setup from the current screener state.", "priority low; consensus near neutral"))
    if not archetypes:
        archetypes.append(_archetype_candidate("Monitor", value_label_0_100(cons, bullish="Bullish", bearish="Bearish", neutral="Neutral"), conf, max(10, min(60, priority)), f"{term} does not match a high-conviction archetype; monitor current signal family scores.", "No single setup family dominates the current profile.", "fallback monitor profile"))
    archetypes.sort(key=lambda x: (n(x["archetype_priority_boost"], 0), n(x["archetype_confidence"], 0)), reverse=True)
    return archetypes


def build_signal_archetypes(out: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, r in out.iterrows():
        matches = match_archetypes_for_row(r)
        primary = matches[0]
        secondary = matches[1] if len(matches) > 1 else None
        all_names = "; ".join([m["archetype_name"] for m in matches[:5]])
        rows.append({
            "term": r.get("term"),
            "latest_data_date": r.get("latest_data_date"),
            "primary_archetype": primary["archetype_name"],
            "secondary_archetype": secondary["archetype_name"] if secondary else "",
            "archetype_direction": primary["archetype_direction"],
            "archetype_confidence": primary["archetype_confidence"],
            "archetype_priority_boost": primary["archetype_priority_boost"],
            "archetype_summary": primary["archetype_summary"],
            "archetype_risk_note": primary["archetype_risk_note"],
            "matched_conditions": primary["matched_conditions"],
            "missing_confirmations": primary["missing_confirmations"],
            "all_matched_archetypes": all_names,
            "screener_attention_priority_score": r.get("screener_attention_priority_score"),
            "signal_consensus_direction_score": r.get("signal_consensus_direction_score"),
            "signal_consensus_direction_label": r.get("signal_consensus_direction_label"),
            "signal_dispersion_score": r.get("signal_dispersion_score"),
            "macd_family_label": r.get("macd_family_label"),
            "sent_price_macd_joint_slope_label": r.get("sent_price_macd_joint_slope_label"),
            "rsi_family_label": r.get("rsi_family_label"),
            "sent_ribbon_label": r.get("sent_ribbon_label"),
        })
    archetypes = pd.DataFrame(rows)
    if not archetypes.empty:
        archetypes = archetypes.sort_values(["screener_attention_priority_score", "term"], ascending=[False, True]).reset_index(drop=True)
    return archetypes


def derive_sidecar_filename(output_filename: str, kind: str) -> str:
    name = str(output_filename)
    if "market_screener" in name:
        return name.replace("market_screener", kind)
    stem = Path(name).stem
    suffix = Path(name).suffix or ".csv"
    return f"{stem}_{kind}{suffix}"


# ---------------------------------------------------------------------
# Score helpers
# ---------------------------------------------------------------------

def rsi_state_score(rsi) -> float:
    """0 bearish, 50 neutral, 100 bullish, with extension/exhaustion treated separately by labels."""
    x = n(rsi, np.nan)
    if np.isnan(x):
        return np.nan
    # Constructive momentum is 50-70. Very high remains bullish but is riskier, not infinitely stronger.
    if x < 20:
        return 38.0   # washed out; bearish state but reversal potential
    if x < 30:
        return 42.0
    if x < 40:
        return 35.0
    if x < 50:
        return 45.0
    if x < 55:
        return 58.0
    if x < 65:
        return 70.0
    if x < 75:
        return 78.0
    if x < 85:
        return 68.0   # strong but extended
    return 58.0       # very extended / exhaustion risk


def rsi_risk_label(rsi) -> str:
    x = n(rsi, np.nan)
    if np.isnan(x):
        return "Unknown"
    if x >= 85:
        return "Extreme overbought / exhaustion risk"
    if x >= 75:
        return "Overbought momentum"
    if x >= 65:
        return "Strong / extended"
    if x >= 55:
        return "Constructive momentum"
    if x >= 45:
        return "Neutral"
    if x >= 35:
        return "Weak / bearish bias"
    if x >= 25:
        return "Oversold watch"
    return "Washed out / reversal potential"


def stoch_timing_score(k, d, k_slope=np.nan) -> float:
    k, d, ks = n(k, np.nan), n(d, np.nan), n(k_slope, 0.0)
    if np.isnan(k) or np.isnan(d):
        return np.nan
    base = 50.0
    base += 22.0 * sign(k - d)
    base += 12.0 * sign(ks)

    # Recovery from oversold is constructive; rollover from overbought is cautionary.
    if k < 20 and k > d:
        base += 12
    if k > 80 and k < d:
        base -= 12
    if k > 90:
        base -= 5
    if k < 10:
        base += 5
    return clamp(base)


def macd_price_direction_score(row) -> float:
    macd = n(row.get("macd"))
    sig = n(row.get("macd_signal"))
    hist = n(row.get("macd_histogram"))
    hist_slope = n(row.get("macd_histogram_slope"), 0.0)
    macd_slope = n(row.get("macd_signal_slope"), 0.0)
    if np.isnan(macd) or np.isnan(sig):
        return np.nan

    score = 50.0
    score += 16.0 * sign(macd - sig)
    score += 14.0 * sign(hist)
    score += 12.0 * sign(hist_slope)
    score += 8.0 * sign(macd)
    score += 6.0 * sign(macd_slope)
    return clamp(score)


def macd_sentiment_direction_score(row) -> float:
    sm = n(row.get("sentiment_macd"))
    ss = n(row.get("sentiment_macd_signal"))
    sh = n(row.get("sentiment_macd_histogram"))
    ss_slope = n(row.get("sentiment_macd_signal_slope"), 0.0)
    ss_accel = n(row.get("sentiment_macd_signal_accel"), 0.0)
    if np.isnan(sm) or np.isnan(ss):
        return np.nan

    score = 50.0
    score += 22.0 * sign(sm - ss)
    score += 18.0 * sign(sh)
    score += 18.0 * sign(ss_slope)
    score += 8.0 * sign(ss_accel)
    return clamp(score)


def macd_joint_slope(row) -> tuple[float, str]:
    ps = n(row.get("macd_signal_slope"), np.nan)
    ss = n(row.get("sentiment_macd_signal_slope"), np.nan)
    if np.isnan(ps) or np.isnan(ss):
        return np.nan, "Unknown"

    psg = sign(ps)
    ssg = sign(ss)

    if psg > 0 and ssg > 0:
        return 82.0, "Both Rising"
    if psg < 0 and ssg < 0:
        return 18.0, "Both Falling"
    if ssg > 0 and psg <= 0:
        return 66.0, "Sentiment Repair / Price Lagging"
    if ssg < 0 and psg >= 0:
        return 34.0, "Price Rising / Sentiment Deteriorating"
    return 50.0, "Mixed / Neutral"


def macd_family_label(score, joint_label, cross_label) -> str:
    s = n(score, np.nan)
    if np.isnan(s):
        return "Unknown"
    if cross_label == "Bullish Sentiment-over-Price Cross" and s >= 55:
        return "Bullish Sentiment Leadership"
    if cross_label == "Bearish Sentiment-under-Price Cross" and s <= 45:
        return "Bearish Sentiment Deterioration"
    if joint_label == "Both Rising" and s >= 55:
        return "Bullish Confirmation"
    if joint_label == "Both Falling" and s <= 45:
        return "Bearish Confirmation"
    if joint_label == "Sentiment Repair / Price Lagging":
        return "Positive Divergence / Sentiment Repair"
    if joint_label == "Price Rising / Sentiment Deteriorating":
        return "Negative Divergence / Narrative Weakening"
    return score_to_label(s, bullish="Bullish Momentum", bearish="Bearish Momentum", neutral="Mixed / Neutral")


def ma_trend_direction_score(row) -> float:
    pairs = [
        ("close_ma_7", "close_ma_21"),
        ("close_ma_21", "close_ma_50"),
        ("close_ma_50", "close_ma_100"),
        ("close_ma_100", "close_ma_200"),
        ("combined_compound_ma_7", "combined_compound_ma_21"),
        ("combined_compound_ma_21", "combined_compound_ma_50"),
        ("combined_compound_ma_50", "combined_compound_ma_100"),
        ("combined_compound_ma_100", "combined_compound_ma_200"),
    ]
    signs = []
    for a, b in pairs:
        av, bv = n(row.get(a)), n(row.get(b))
        if not np.isnan(av) and not np.isnan(bv):
            signs.append(sign(av - bv))
    if not signs:
        return np.nan
    return clamp(50.0 + 50.0 * float(np.mean(signs)))


def sentiment_ribbon_scores(row) -> tuple[float, float, str, float]:
    """Return direction_score, structure_score, label, transition_risk_score."""
    direction = ma_trend_direction_score(row)

    # Sentiment-only stack where available.
    sent_pairs = [
        ("combined_compound_ma_7", "combined_compound_ma_21"),
        ("combined_compound_ma_21", "combined_compound_ma_50"),
        ("combined_compound_ma_50", "combined_compound_ma_100"),
        ("combined_compound_ma_100", "combined_compound_ma_200"),
    ]
    sent_signs = []
    for a, b in sent_pairs:
        av, bv = n(row.get(a)), n(row.get(b))
        if not np.isnan(av) and not np.isnan(bv):
            sent_signs.append(sign(av - bv))
    if sent_signs:
        direction = clamp(50.0 + 50.0 * float(np.mean(sent_signs)))

    slope21 = n(row.get("combined_compound_ma_21_slope"), n(row.get("combined_compound_ma_21_pct_change"), 0.0))
    if not np.isnan(direction):
        direction = clamp(direction + 8.0 * sign(slope21))

    # Structure/confidence is separate from direction.
    stack_coherence = abs(direction - 50.0) * 2.0 if not np.isnan(direction) else 0.0
    upstream_conf = n(row.get("sent_ribbon_regime_confidence"), np.nan)
    if np.isnan(upstream_conf):
        structure = clamp(45.0 + 0.45 * stack_coherence)
    else:
        structure = clamp(0.55 * upstream_conf + 0.45 * stack_coherence)

    transition_flag = n(row.get("sent_ribbon_transition_flag"), 0.0)
    compression_flag = n(row.get("sent_ribbon_compression_flag"), 0.0)
    transition_risk = clamp(20.0 * (transition_flag > 0) + 15.0 * (compression_flag > 0) + max(0.0, 55.0 - structure))

    if np.isnan(direction):
        label = "Unknown"
    elif direction >= 65:
        label = "Bullish Expansion" if structure >= 60 else "Bullish / Low Structure"
    elif direction <= 35:
        label = "Bearish Expansion" if structure >= 60 else "Bearish / Low Structure"
    else:
        label = "Neutral / Coiling" if compression_flag else "Mixed / Neutral"

    return direction, structure, label, transition_risk


def relationship_score_from_spread_and_slopes(spread_z, spread_slope, price_slope, sent_slope):
    score = 50.0 + 18.0 * math.tanh(n(spread_z, 0.0) / 2.0)
    score += 10.0 * math.tanh(n(spread_slope, 0.0) * 3.0)
    psg, ssg = sign(price_slope), sign(sent_slope)
    if psg > 0 and ssg > 0:
        score += 10
    elif psg < 0 and ssg < 0:
        score -= 10
    elif ssg > 0 and psg <= 0:
        score += 7
    elif ssg < 0 and psg >= 0:
        score -= 7
    return clamp(score)


# ---------------------------------------------------------------------
# Event aggregations
# ---------------------------------------------------------------------

def add_event_aggregates(events: pd.DataFrame, asof_by_term: pd.Series) -> pd.DataFrame:
    if events.empty:
        return pd.DataFrame(columns=["term"])

    e = events.copy()
    e["date"] = to_date(e["date"])
    e["dir_sign"] = e["alert_direction"].map(direction_sign)
    e["is_confirmed"] = e["alert_tier"].astype(str).str.lower().eq("confirmed")
    e["is_watch"] = e["alert_tier"].astype(str).str.lower().eq("watch")

    rows = []
    for term, g in e.groupby("term"):
        asof = asof_by_term.get(term, e["date"].max())
        recent7 = g[g["date"] >= asof - pd.Timedelta(days=7)]
        recent30 = g[g["date"] >= asof - pd.Timedelta(days=30)]
        watch7 = recent7[recent7["is_watch"]]
        conf7 = recent7[recent7["is_confirmed"]]

        def _dir_count(frame, sgn):
            return int((frame["dir_sign"] == sgn).sum())

        rows.append({
            "term": term,
            "recent_watch_count_7d": int(len(watch7)),
            "recent_bullish_watch_count_7d": _dir_count(watch7, 1),
            "recent_bearish_watch_count_7d": _dir_count(watch7, -1),
            "recent_confirmed_count_7d": int(len(conf7)),
            "recent_bullish_confirmed_count_7d": _dir_count(conf7, 1),
            "recent_bearish_confirmed_count_7d": _dir_count(conf7, -1),
            "recent_event_count_30d": int(len(recent30)),
            "recent_avg_alert_quality_30d": pd.to_numeric(recent30.get("alert_quality_score"), errors="coerce").mean() if len(recent30) else np.nan,
        })
    return pd.DataFrame(rows)


def latest_event_tables(events: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    if events.empty:
        return pd.DataFrame(columns=["term"]), pd.DataFrame(columns=["term"])
    e = events.copy()
    e["date"] = to_date(e["date"])
    latest_event = latest_by_term(e)
    confirmed = e[e["alert_tier"].astype(str).str.lower().eq("confirmed")].copy()
    latest_confirmed = latest_by_term(confirmed) if not confirmed.empty else pd.DataFrame(columns=["term"])
    return latest_event, latest_confirmed


# ---------------------------------------------------------------------
# Validation / run summary
# ---------------------------------------------------------------------

def print_validation_summary(screener: pd.DataFrame, archetypes: pd.DataFrame, indicator_matrix: pd.DataFrame) -> None:
    """Print a compact daily sanity-check summary for logs / Task Scheduler output."""
    print("\n=== SETA Screener Validation Summary ===")

    if screener.empty:
        print("[WARN] Screener output is empty.")
        print("=== End validation summary ===\n")
        return

    rank_col = "screener_attention_priority_rank"
    score_col = "screener_attention_priority_score"
    if rank_col in screener.columns:
        top = screener.sort_values(rank_col, na_position="last").head(10)
    elif score_col in screener.columns:
        top = screener.sort_values(score_col, ascending=False, na_position="last").head(10)
    else:
        top = screener.head(10)

    print("\nTop 10 attention priority:")
    for _, row in top.iterrows():
        term = str(row.get("term", ""))
        score = row.get(score_col, np.nan)
        direction = str(row.get("signal_consensus_direction_label", ""))
        archetype = str(row.get("primary_archetype", ""))
        bucket = str(row.get("screener_action_bucket", ""))
        try:
            score_txt = f"{float(score):.1f}"
        except Exception:
            score_txt = str(score)
        print(f"  {term:>6} | {score_txt:>5} | {direction:<16} | {bucket:<28} | {archetype}")

    if "primary_archetype" in screener.columns:
        print("\nPrimary archetype distribution:")
        counts = screener["primary_archetype"].fillna("Missing").astype(str).value_counts().head(20)
        for name, count in counts.items():
            print(f"  {name}: {count}")

    if "screener_action_bucket" in screener.columns:
        print("\nAction bucket distribution:")
        counts = screener["screener_action_bucket"].fillna("Missing").astype(str).value_counts().head(20)
        for name, count in counts.items():
            print(f"  {name}: {count}")

    for col in ["latest_data_date", "latest_close", "screener_attention_priority_score", "primary_archetype"]:
        if col in screener.columns:
            missing = int(screener[col].isna().sum())
            print(f"\nMissing {col}: {missing}")

    if not archetypes.empty and "archetype_direction" in archetypes.columns:
        print("\nArchetype direction distribution:")
        counts = archetypes["archetype_direction"].fillna("Missing").astype(str).value_counts().head(20)
        for name, count in counts.items():
            print(f"  {name}: {count}")

    print(f"\nOutput dimensions: screener={len(screener)} rows x {len(screener.columns)} cols | matrix={len(indicator_matrix)} rows | archetypes={len(archetypes)} rows")
    print(f"Model version: {SCREENER_MODEL_VERSION}")
    print("=== End validation summary ===\n")

# ---------------------------------------------------------------------
# Main builder
# ---------------------------------------------------------------------

def build_screener(source_dir: Path, output_filename: str = DEFAULT_OUTPUT_FILENAME, matrix_filename: str | None = None, archetypes_filename: str | None = None) -> Path:
    source_dir = Path(source_dir)
    chart_path = source_dir / "final_combined_data_enriched_chart_history.csv"
    audit_path = source_dir / "seta_alert_audit_365d.csv"
    events_path = source_dir / "seta_alert_events_365d.csv"
    output_path = source_dir / output_filename
    matrix_path = source_dir / (matrix_filename or derive_sidecar_filename(output_filename, "indicator_matrix"))
    archetypes_path = source_dir / (archetypes_filename or derive_sidecar_filename(output_filename, "signal_archetypes"))
    generated_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for p in [chart_path, audit_path, events_path]:
        if not p.exists():
            raise FileNotFoundError(f"Missing required input: {p}")

    chart = pd.read_csv(chart_path, low_memory=False)
    audit = pd.read_csv(audit_path, low_memory=False)
    events = pd.read_csv(events_path, low_memory=False)

    for df in [chart, audit, events]:
        if "term" not in df.columns:
            raise ValueError("All input files must contain a 'term' column.")
        df["term"] = df["term"].astype(str).str.strip().str.upper()

    chart["date"] = to_date(chart["date"])
    events["date"] = to_date(events["date"])

    chart = chart.dropna(subset=["date"]).sort_values(["term", "date"]).copy()
    events = events.dropna(subset=["date"]).sort_values(["term", "date"]).copy()

    # Slopes and relationship z-scores are derived for SETA scoring only.
    chart["macd_histogram_slope"] = group_diff(chart, "macd_histogram")
    chart["macd_signal_slope"] = group_diff(chart, "macd_signal")
    chart["sentiment_macd_signal_slope"] = group_diff(chart, "sentiment_macd_signal")
    chart["sentiment_macd_signal_accel"] = group_diff(chart, "sentiment_macd_signal_slope")

    chart["price_macd_signal_z"] = rolling_z_by_term(chart, "macd_signal", window=126, min_periods=20)
    chart["sentiment_macd_signal_z"] = rolling_z_by_term(chart, "sentiment_macd_signal", window=126, min_periods=20)
    chart["sent_price_macd_spread_z"] = chart["sentiment_macd_signal_z"] - chart["price_macd_signal_z"]
    chart["sent_price_macd_spread_slope"] = group_diff(chart, "sent_price_macd_spread_z")

    # Public-comparable raw/scaled crossover:
    # sentiment MACD signal crossed over/under price MACD signal.
    scaled_sent_sig_col = first_existing(chart, "scaled_sentiment_macd_signal", "sentiment_macd_signal")
    chart["sent_price_macd_signal_spread"] = pd.to_numeric(chart[scaled_sent_sig_col], errors="coerce") - pd.to_numeric(chart["macd_signal"], errors="coerce")
    chart["sent_price_macd_cross"] = np.where(
        (chart["sent_price_macd_signal_spread"] > 0) & (chart.groupby("term")["sent_price_macd_signal_spread"].shift(1) <= 0),
        "bullish",
        np.where(
            (chart["sent_price_macd_signal_spread"] < 0) & (chart.groupby("term")["sent_price_macd_signal_spread"].shift(1) >= 0),
            "bearish",
            "",
        ),
    )

    chart["rsi_slope"] = group_diff(chart, "rsi")
    chart["sentiment_rsi_slope"] = group_diff(chart, "sentiment_rsi")
    chart["stochastic_rsi_slope"] = group_diff(chart, "stochastic_rsi")
    chart["sent_price_rsi_spread"] = pd.to_numeric(chart.get("sentiment_rsi"), errors="coerce") - pd.to_numeric(chart.get("rsi"), errors="coerce")
    chart["sent_price_rsi_spread_z"] = rolling_z_by_term(chart, "sent_price_rsi_spread", window=60, min_periods=20)
    chart["sent_price_rsi_spread_slope"] = group_diff(chart, "sent_price_rsi_spread_z")

    # Useful market context.
    chart["volume_ma_20"] = chart.groupby("term")["volume"].transform(lambda s: pd.to_numeric(s, errors="coerce").rolling(20, min_periods=5).mean())
    chart["volume_pct_vs_20d"] = (pd.to_numeric(chart["volume"], errors="coerce") - chart["volume_ma_20"]) / chart["volume_ma_20"].replace(0, np.nan)
    for ma in [21, 50, 200]:
        col = f"close_ma_{ma}"
        if col in chart.columns:
            chart[f"close_pct_vs_ma_{ma}"] = (pd.to_numeric(chart["close"], errors="coerce") - pd.to_numeric(chart[col], errors="coerce")) / pd.to_numeric(chart[col], errors="coerce").replace(0, np.nan)

    latest_chart = latest_by_term(chart)
    asof_by_term = latest_chart.set_index("term")["date"]

    latest_event, latest_confirmed = latest_event_tables(events)
    event_aggs = add_event_aggregates(events, asof_by_term)

    out = audit.copy()

    # Merge latest chart row.
    chart_cols = existing_cols(latest_chart, [
        "term", "date", "close", "volume", "volume_pct_vs_20d",
        "close_pct_vs_ma_21", "close_pct_vs_ma_50", "close_pct_vs_ma_200",
        "high_volume_7", "high_volume_20", "High_Volume_20",
        "rsi", "sentiment_rsi", "stochastic_rsi", "stochastic_rsi_d", "sentiment_stochastic_rsi_d",
        "macd", "macd_signal", "macd_histogram", "sentiment_macd", "sentiment_macd_signal",
        "scaled_sentiment_macd", "scaled_sentiment_macd_signal", "sentiment_macd_histogram",
        "macd_signal_cross", "macd_cross_significance", "sentiment_macd_signal_direction",
        "macd_histogram_slope", "macd_signal_slope", "sentiment_macd_signal_slope", "sentiment_macd_signal_accel",
        "sent_price_macd_signal_spread", "sent_price_macd_spread_z", "sent_price_macd_spread_slope", "sent_price_macd_cross",
        "rsi_slope", "sentiment_rsi_slope", "sent_price_rsi_spread", "sent_price_rsi_spread_z", "sent_price_rsi_spread_slope", "stochastic_rsi_slope",
        "boll_overlap_state", "boll_overlap_event_type", "boll_volatility_flag",
        "sent_ribbon_regime_raw", "sent_ribbon_regime_score", "sent_ribbon_regime_confidence",
        "sent_ribbon_compression_flag", "sent_ribbon_transition_flag", "sent_ribbon_transition_type",
        "sent_ribbon_width_z", "sent_ribbon_center_slope_21_z",
        "attention_level_score", "attention_conviction_score_signed", "attention_regime_score",
        "combined_engagement_z", "x_engagement_sum_z", "reddit_engagement_sum_z", "bsky_engagement_sum_z",
        "news_engagement_sum", "news_proxy_engagement_raw",
        "close_ma_7", "close_ma_21", "close_ma_50", "close_ma_100", "close_ma_200",
        "combined_compound_ma_7", "combined_compound_ma_21", "combined_compound_ma_50", "combined_compound_ma_100", "combined_compound_ma_200",
        "combined_compound_ma_21_pct_change",
    ])
    out = out.merge(
        latest_chart[chart_cols].rename(columns={"date": "latest_data_date", "close": "latest_close", "volume": "latest_volume"}),
        on="term",
        how="left",
    )

    # Merge latest event and latest confirmed event.
    event_cols = existing_cols(latest_event, [
        "term", "date", "alert_tier", "alert_direction", "alert_quality_score",
        "overlap_state", "overlap_event_type", "close", "volume", "high_volume_20",
        "boll_volatility_flag", "sent_ribbon_regime_raw", "sent_ribbon_regime_score", "sent_ribbon_regime_confidence",
        "attention_level_score", "attention_conviction_score_signed", "attention_regime_label",
        "combined_engagement_z", "combined_spike_z", "seta_dashboard_summary_label",
    ])
    out = out.merge(
        latest_event[event_cols].rename(columns={
            "date": "latest_event_date",
            "alert_tier": "latest_event_tier",
            "alert_direction": "latest_event_direction",
            "alert_quality_score": "latest_event_quality_score",
            "overlap_state": "latest_event_overlap_state",
            "overlap_event_type": "latest_event_overlap_event_type",
            "close": "latest_event_close",
            "volume": "latest_event_volume",
            "high_volume_20": "latest_event_high_volume_20",
            "boll_volatility_flag": "latest_event_boll_volatility_flag",
            "sent_ribbon_regime_raw": "latest_event_sent_ribbon_regime",
            "sent_ribbon_regime_score": "latest_event_sent_ribbon_regime_score",
            "sent_ribbon_regime_confidence": "latest_event_sent_ribbon_regime_confidence",
            "attention_level_score": "latest_event_attention_level_score",
            "attention_conviction_score_signed": "latest_event_attention_conviction_score_signed",
            "attention_regime_label": "latest_event_attention_regime_label",
            "combined_engagement_z": "latest_event_combined_engagement_z",
            "combined_spike_z": "latest_event_combined_spike_z",
            "seta_dashboard_summary_label": "latest_event_dashboard_summary_label",
        }),
        on="term",
        how="left",
    )

    confirmed_cols = existing_cols(latest_confirmed, [
        "term", "date", "alert_direction", "alert_quality_score", "close", "seta_dashboard_summary_label"
    ])
    if confirmed_cols:
        out = out.merge(
            latest_confirmed[confirmed_cols].rename(columns={
                "date": "latest_confirmed_event_date",
                "alert_direction": "latest_confirmed_event_direction",
                "alert_quality_score": "latest_confirmed_quality_score",
                "close": "latest_confirmed_close",
                "seta_dashboard_summary_label": "latest_confirmed_dashboard_summary_label",
            }),
            on="term",
            how="left",
        )

    if not event_aggs.empty:
        out = out.merge(event_aggs, on="term", how="left")

    # Freshness / recency.
    out["latest_data_date"] = pd.to_datetime(out["latest_data_date"], errors="coerce")
    for c in ["latest_event_date", "latest_confirmed_event_date", "latest_confirmed_date", "latest_alert_date", "date_min", "date_max"]:
        if c in out.columns:
            out[c] = pd.to_datetime(out[c], errors="coerce")

    out["asof_date"] = out["latest_data_date"]
    out["days_since_latest_data"] = out.apply(lambda r: days_since(r.get("latest_data_date"), r.get("asof_date")), axis=1)
    out["days_since_latest_event"] = out.apply(lambda r: days_since(r.get("latest_event_date"), r.get("asof_date")), axis=1)
    out["days_since_latest_confirmed"] = out.apply(lambda r: days_since(r.get("latest_confirmed_event_date"), r.get("asof_date")), axis=1)
    out["latest_event_recency_bucket"] = out["days_since_latest_event"].map(recency_bucket)
    out["latest_confirmed_recency_bucket"] = out["days_since_latest_confirmed"].map(recency_bucket)

    # Alert balance.
    out["confirmed_bull_bear_spread"] = pd.to_numeric(out.get("bullish_confirmed_count"), errors="coerce").fillna(0) - pd.to_numeric(out.get("bearish_confirmed_count"), errors="coerce").fillna(0)
    out["confirmed_to_watch_ratio"] = [
        safe_div(c, w, 0.0) for c, w in zip(out.get("confirmed_count", 0), out.get("watch_count", 0))
    ]
    out["watch_to_outside_ratio"] = [
        safe_div(w, o, 0.0) for w, o in zip(out.get("watch_count", 0), out.get("outside_count", 0))
    ]
    out["alert_density"] = [
        safe_div(c, rows, 0.0) for c, rows in zip(out.get("confirmed_count", 0), out.get("rows", 0))
    ]
    out["net_confirmed_direction"] = np.where(out["confirmed_bull_bear_spread"] > 0, "Bullish",
                                      np.where(out["confirmed_bull_bear_spread"] < 0, "Bearish", "Mixed / Neutral"))

    # Scores.
    score_rows = []
    for _, row in out.iterrows():
        term = row.get("term")
        reasons = []
        flags = {}

        # Bollinger / overlap score.
        latest_tier = str(row.get("latest_event_tier") or "").lower()
        latest_dir = direction_sign(row.get("latest_event_direction"))
        conf_dir = direction_sign(row.get("latest_confirmed_event_direction") or row.get("latest_confirmed_direction"))
        latest_quality = n(row.get("latest_event_quality_score"), n(row.get("max_alert_quality_score"), 0.0))
        conf_quality = n(row.get("latest_confirmed_quality_score"), latest_quality)
        days_conf = n(row.get("days_since_latest_confirmed"), np.nan)
        days_event = n(row.get("days_since_latest_event"), np.nan)

        event_signed = 0.0
        if conf_dir:
            decay = recency_decay(days_conf, half_life_days=10.0)
            event_signed += conf_dir * (32.0 + min(conf_quality, 100.0) * 0.12) * decay
            flags["reason_fresh_confirmed_event"] = int(days_conf <= 7)
            if days_conf <= 7:
                reasons.append(f"fresh confirmed {'bullish' if conf_dir > 0 else 'bearish'} overlap event")
        elif latest_dir and "watch" in latest_tier:
            decay = recency_decay(days_event, half_life_days=7.0)
            event_signed += latest_dir * (18.0 + min(latest_quality, 100.0) * 0.06) * decay
            flags["reason_high_quality_watch"] = int(days_event <= 7 and latest_quality >= 60)
            if days_event <= 7:
                reasons.append(f"fresh {'bullish' if latest_dir > 0 else 'bearish'} watch candidate")

        watch_cluster = n(row.get("recent_bullish_watch_count_7d"), 0) - n(row.get("recent_bearish_watch_count_7d"), 0)
        confirmed_cluster = n(row.get("recent_bullish_confirmed_count_7d"), 0) - n(row.get("recent_bearish_confirmed_count_7d"), 0)
        cluster_signed = clamp(abs(watch_cluster) * 3.0 + abs(confirmed_cluster) * 8.0, 0, 18) * sign(watch_cluster + 2 * confirmed_cluster)
        if abs(cluster_signed) >= 6:
            reasons.append("clustered recent overlap/watch activity")

        bollinger_direction_score = clamp(50.0 + event_signed + cluster_signed)
        bollinger_recency_decay = recency_decay(min(days_conf if not np.isnan(days_conf) else 999, days_event if not np.isnan(days_event) else 999), 10.0)
        bollinger_watch_cluster_score = clamp(50.0 + cluster_signed)
        bollinger_confidence_score = clamp(
            0.35 * n(row.get("confirmed_rate"), 0) * 100
            + 0.35 * min(n(row.get("max_alert_quality_score"), latest_quality), 100)
            + 0.20 * bollinger_recency_decay * 100
            + 0.10 * min(n(row.get("recent_event_count_30d"), 0) * 5, 100)
        )

        # Attention participation and confirmation.
        att_level = n(row.get("attention_level_score"), n(row.get("latest_event_attention_level_score"), n(row.get("avg_attention_level_score"), 50)))
        att_regime = n(row.get("attention_regime_score"), 50)
        engagement_z = n(row.get("combined_engagement_z"), n(row.get("latest_event_combined_engagement_z"), n(row.get("avg_combined_engagement_z"), 0)))
        conviction = n(row.get("attention_conviction_score_signed"), n(row.get("latest_event_attention_conviction_score_signed"), 0))
        attention_participation_score = clamp(0.45 * att_level + 0.25 * att_regime + 0.30 * (50 + 18 * math.tanh(engagement_z / 2.0)))
        boll_dir_sgn = sign(bollinger_direction_score - 50)
        conviction_sgn = sign(conviction)
        attention_confirmation_score = clamp(50 + 20 * (attention_participation_score >= 60) + 20 * (boll_dir_sgn != 0 and conviction_sgn == boll_dir_sgn) - 18 * (boll_dir_sgn != 0 and conviction_sgn == -boll_dir_sgn))
        flags["reason_high_attention"] = int(attention_participation_score >= 65)
        if attention_participation_score >= 65:
            reasons.append("attention elevated")

        att_mult = 1.0
        if attention_participation_score >= 65 and boll_dir_sgn != 0 and conviction_sgn == boll_dir_sgn:
            att_mult = 1.20
        elif attention_participation_score >= 65:
            att_mult = 1.10
        elif attention_participation_score <= 35:
            att_mult = 0.85
        if boll_dir_sgn != 0 and conviction_sgn == -boll_dir_sgn:
            att_mult *= 0.80
        attention_adjusted_bollinger_score = clamp(50 + (bollinger_direction_score - 50) * att_mult)

        # MACD family.
        price_macd_direction_score = macd_price_direction_score(row)
        sentiment_macd_direction_score = macd_sentiment_direction_score(row)
        joint_slope_score, joint_slope_label = macd_joint_slope(row)
        spread_z = n(row.get("sent_price_macd_spread_z"), 0.0)
        spread_slope = n(row.get("sent_price_macd_spread_slope"), 0.0)
        sent_price_macd_spread_score = clamp(50 + 24 * math.tanh(spread_z / 2.0) + 10 * math.tanh(spread_slope * 3.0))

        # Crossover score from latest cross in history is computed later from latest row marker if fresh,
        # and from current spread state if no fresh cross exists.
        cross = str(row.get("sent_price_macd_cross") or "").lower()
        cross_dir = 1 if cross == "bullish" else (-1 if cross == "bearish" else 0)
        sent_price_macd_cross_days = 0.0 if cross_dir else np.nan
        if not cross_dir:
            # No current-day cross; infer a soft crossover state from spread and let it stay near neutral.
            cross_dir = sign(row.get("sent_price_macd_signal_spread"))
            sent_price_macd_crossover_score = clamp(50 + 8 * cross_dir * min(abs(spread_z), 2.0) / 2.0)
            cross_label = "No Fresh Cross"
        else:
            sent_price_macd_crossover_score = clamp(50 + 35 * cross_dir * recency_decay(sent_price_macd_cross_days, half_life_days=7.0))
            cross_label = "Bullish Sentiment-over-Price Cross" if cross_dir > 0 else "Bearish Sentiment-under-Price Cross"
            reasons.append(cross_label.lower())

        macd_family_direction_score = clamp(
            0.30 * price_macd_direction_score
            + 0.25 * sentiment_macd_direction_score
            + 0.20 * joint_slope_score
            + 0.15 * sent_price_macd_spread_score
            + 0.10 * sent_price_macd_crossover_score
        )
        macd_label = macd_family_label(macd_family_direction_score, joint_slope_label, cross_label)
        if macd_family_direction_score >= 62:
            reasons.append("MACD family improving")
        elif macd_family_direction_score <= 38:
            reasons.append("MACD family deteriorating")

        # RSI family.
        price_rsi_state_score = rsi_state_score(row.get("rsi"))
        sentiment_rsi_state_score = rsi_state_score(row.get("sentiment_rsi"))
        price_rsi_risk_label = rsi_risk_label(row.get("rsi"))
        sentiment_rsi_risk_label = rsi_risk_label(row.get("sentiment_rsi"))

        rsi_relationship_score = relationship_score_from_spread_and_slopes(
            row.get("sent_price_rsi_spread_z"),
            row.get("sent_price_rsi_spread_slope"),
            row.get("rsi_slope"),
            row.get("sentiment_rsi_slope"),
        )
        if sign(row.get("sentiment_rsi_slope")) > 0 and sign(row.get("rsi_slope")) <= 0:
            rsi_relationship_label = "Sentiment RSI Repair / Price Lagging"
        elif sign(row.get("sentiment_rsi_slope")) < 0 and sign(row.get("rsi_slope")) >= 0:
            rsi_relationship_label = "Sentiment RSI Deterioration / Price Holding"
        elif sign(row.get("sentiment_rsi_slope")) > 0 and sign(row.get("rsi_slope")) > 0:
            rsi_relationship_label = "Both RSI Rising"
        elif sign(row.get("sentiment_rsi_slope")) < 0 and sign(row.get("rsi_slope")) < 0:
            rsi_relationship_label = "Both RSI Falling"
        else:
            rsi_relationship_label = "Mixed / Neutral"

        stoch_score = stoch_timing_score(row.get("stochastic_rsi"), row.get("stochastic_rsi_d"), row.get("stochastic_rsi_slope"))
        rsi_family_state_score = clamp(
            0.35 * price_rsi_state_score
            + 0.25 * sentiment_rsi_state_score
            + 0.25 * rsi_relationship_score
            + 0.15 * stoch_score
        )
        rsi_family_label = score_to_label(rsi_family_state_score, bullish="RSI Constructive", bearish="RSI Weak", neutral="RSI Mixed / Neutral")
        rsi_alignment_score = clamp(100 - abs(n(row.get("rsi"), 50) - n(row.get("sentiment_rsi"), 50)))

        # Sentiment ribbon and MA trend.
        ma_score = ma_trend_direction_score(row)
        sent_ribbon_direction_score, sent_ribbon_structure_score, sent_ribbon_label, sent_ribbon_transition_risk_score = sentiment_ribbon_scores(row)

        # Consensus: use deviations from neutral; Bollinger gets nonlinear influence at extremes.
        family_scores = {
            "ma_trend_direction_score": ma_score,
            "sent_ribbon_direction_score": sent_ribbon_direction_score,
            "bollinger_direction_score": attention_adjusted_bollinger_score,
            "macd_family_direction_score": macd_family_direction_score,
            "rsi_family_state_score": rsi_family_state_score,
        }
        deviations = {k: n(v, 50.0) - 50.0 for k, v in family_scores.items()}
        boll_ext = abs(deviations["bollinger_direction_score"]) / 50.0

        weights = {
            "ma_trend_direction_score": 0.15,
            "sent_ribbon_direction_score": 0.15,
            "bollinger_direction_score": 0.25 * boll_ext,  # near-neutral Bollinger contributes less
            "macd_family_direction_score": 0.30,
            "rsi_family_state_score": 0.15,
        }
        wsum = sum(weights.values()) or 1.0
        signal_consensus_score_signed = sum(deviations[k] * weights[k] for k in weights) / wsum
        signal_consensus_direction_score = clamp(50 + signal_consensus_score_signed)
        signal_consensus_direction_label = score_to_label(signal_consensus_direction_score, bullish="Bullish", bearish="Bearish", neutral="Mixed / Neutral")
        signal_dispersion_score = float(np.nanstd([n(v, np.nan) for v in family_scores.values()]))
        signal_consensus_confidence_score = clamp(70 - signal_dispersion_score + abs(signal_consensus_score_signed) * 0.75 + bollinger_confidence_score * 0.15)

        if signal_dispersion_score >= 22:
            reasons.append("signals conflicted / high dispersion")
            flags["reason_high_dispersion"] = 1
        else:
            reasons.append("low dispersion")
            flags["reason_low_dispersion"] = 1

        if abs(signal_consensus_score_signed) >= 18:
            reasons.append(f"consensus direction {signal_consensus_direction_label.lower()}")

        # Priority is review/attention priority, not bullish/bearish strength.
        recency_score = clamp(max(
            recency_decay(days_conf, 10.0) * 100 if not np.isnan(days_conf) else 0,
            recency_decay(days_event, 7.0) * 85 if not np.isnan(days_event) else 0,
        ))
        quality_score = clamp(max(latest_quality, conf_quality, n(row.get("max_alert_quality_score"), 0)))
        consensus_magnitude = clamp(abs(signal_consensus_score_signed) * 2.0)
        confirmed_rate_score = clamp(n(row.get("confirmed_rate"), 0) * 100)
        screener_attention_priority_score = clamp(
            0.25 * consensus_magnitude
            + 0.25 * recency_score
            + 0.20 * quality_score
            + 0.20 * attention_participation_score
            + 0.10 * signal_consensus_confidence_score
        )

        if not np.isnan(days_conf) and days_conf <= 7 and screener_attention_priority_score >= 60:
            action_bucket = "Fresh Confirmed Event"
        elif latest_tier == "watch" and not np.isnan(days_event) and days_event <= 7 and quality_score >= 55:
            action_bucket = "High-Quality Watch"
        elif signal_dispersion_score >= 22 and screener_attention_priority_score >= 55:
            action_bucket = "Conflicted / High Dispersion"
        elif signal_consensus_direction_score >= 65 and attention_confirmation_score >= 55:
            action_bucket = "Consensus Bullish"
        elif signal_consensus_direction_score <= 35 and attention_confirmation_score >= 55:
            action_bucket = "Consensus Bearish"
        elif not np.isnan(days_conf) and days_conf > 30:
            action_bucket = "Stale Confirmed"
        elif screener_attention_priority_score < 35:
            action_bucket = "Quiet / Ignore"
        else:
            action_bucket = "Monitor"

        flags.setdefault("reason_fresh_confirmed_event", 0)
        flags.setdefault("reason_high_attention", 0)
        flags.setdefault("reason_bollinger_extreme", int(abs(bollinger_direction_score - 50) >= 25))
        flags.setdefault("reason_macd_improving", int(macd_family_direction_score >= 62))
        flags.setdefault("reason_sentiment_momentum", int(sentiment_macd_direction_score >= 62 or sentiment_macd_direction_score <= 38))
        flags.setdefault("reason_low_dispersion", int(signal_dispersion_score < 18))
        flags.setdefault("reason_high_dispersion", int(signal_dispersion_score >= 22))
        flags.setdefault("reason_stale_event", int((not np.isnan(days_conf)) and days_conf > 30))
        flags.setdefault("reason_conflicted_signals", int(signal_dispersion_score >= 22))

        score_rows.append({
            "term": term,
            "bollinger_direction_score": bollinger_direction_score,
            "bollinger_confidence_score": bollinger_confidence_score,
            "bollinger_recency_decay": bollinger_recency_decay,
            "bollinger_watch_cluster_score": bollinger_watch_cluster_score,
            "attention_adjusted_bollinger_score": attention_adjusted_bollinger_score,

            "price_macd_direction_score": price_macd_direction_score,
            "sentiment_macd_direction_score": sentiment_macd_direction_score,
            "sent_price_macd_spread_score": sent_price_macd_spread_score,
            "sent_price_macd_cross": cross if cross else "",
            "sent_price_macd_cross_days": sent_price_macd_cross_days,
            "sent_price_macd_crossover_score": sent_price_macd_crossover_score,
            "sent_price_macd_joint_slope_score": joint_slope_score,
            "sent_price_macd_joint_slope_label": joint_slope_label,
            "macd_family_direction_score": macd_family_direction_score,
            "macd_family_label": macd_label,

            "price_rsi_state_score": price_rsi_state_score,
            "sentiment_rsi_state_score": sentiment_rsi_state_score,
            "price_rsi_risk_label": price_rsi_risk_label,
            "sentiment_rsi_risk_label": sentiment_rsi_risk_label,
            "sent_price_rsi_relationship_score": rsi_relationship_score,
            "sent_price_rsi_relationship_label": rsi_relationship_label,
            "stoch_rsi_timing_score": stoch_score,
            "rsi_alignment_score": rsi_alignment_score,
            "rsi_family_state_score": rsi_family_state_score,
            "rsi_family_label": rsi_family_label,

            "sent_ribbon_direction_score": sent_ribbon_direction_score,
            "sent_ribbon_structure_score": sent_ribbon_structure_score,
            "sent_ribbon_label": sent_ribbon_label,
            "sent_ribbon_transition_risk_score": sent_ribbon_transition_risk_score,
            "ma_trend_direction_score": ma_score,

            "signal_consensus_direction_score": signal_consensus_direction_score,
            "signal_consensus_score_signed": signal_consensus_score_signed,
            "signal_consensus_direction_label": signal_consensus_direction_label,
            "signal_dispersion_score": signal_dispersion_score,
            "signal_consensus_confidence_score": signal_consensus_confidence_score,

            "attention_participation_score": attention_participation_score,
            "attention_confirmation_score": attention_confirmation_score,
            "screener_attention_priority_score": screener_attention_priority_score,
            "screener_action_bucket": action_bucket,
            "screener_reason_summary": format_reason(reasons, term=term),
            **flags,
        })

    scores = pd.DataFrame(score_rows)
    out = out.merge(scores, on="term", how="left")
    if "sent_price_macd_cross_x" in out.columns or "sent_price_macd_cross_y" in out.columns:
        left = out["sent_price_macd_cross_x"] if "sent_price_macd_cross_x" in out.columns else pd.Series("", index=out.index)
        right = out["sent_price_macd_cross_y"] if "sent_price_macd_cross_y" in out.columns else pd.Series("", index=out.index)
        out["sent_price_macd_cross"] = right.where(right.astype(str).str.len() > 0, left)
        out = out.drop(columns=[c for c in ["sent_price_macd_cross_x", "sent_price_macd_cross_y"] if c in out.columns])

    out["screener_attention_priority_rank"] = out["screener_attention_priority_score"].rank(method="dense", ascending=False).astype("Int64")

    archetypes = build_signal_archetypes(out)
    if not archetypes.empty:
        archetype_cols = [
            "term", "primary_archetype", "secondary_archetype", "archetype_direction",
            "archetype_confidence", "archetype_priority_boost", "archetype_summary", "archetype_risk_note",
            "matched_conditions", "missing_confirmations", "all_matched_archetypes",
        ]
        out = out.merge(archetypes[[c for c in archetype_cols if c in archetypes.columns]], on="term", how="left")

    indicator_matrix = build_indicator_matrix(out)

    # Attach model metadata to all deliverables for future debugging / reproducibility.
    out["screener_model_version"] = SCREENER_MODEL_VERSION
    out["screener_generated_at_utc"] = generated_at_utc
    if not indicator_matrix.empty:
        indicator_matrix["screener_model_version"] = SCREENER_MODEL_VERSION
        indicator_matrix["screener_generated_at_utc"] = generated_at_utc
    if not archetypes.empty:
        archetypes["screener_model_version"] = SCREENER_MODEL_VERSION
        archetypes["screener_generated_at_utc"] = generated_at_utc

    # Final friendly labels and derived buckets.
    out["latest_event_recency_bucket"] = out["days_since_latest_event"].map(recency_bucket)
    out["latest_confirmed_recency_bucket"] = out["days_since_latest_confirmed"].map(recency_bucket)

    # Human-safe date formatting at the end.
    date_cols = [c for c in out.columns if "date" in c.lower()]
    for c in date_cols:
        out[c] = pd.to_datetime(out[c], errors="coerce").dt.strftime("%Y-%m-%d")

    preferred_order = [
        "screener_model_version", "screener_generated_at_utc",
        "screener_attention_priority_rank",
        "term", "asset_universe", "primary_sector",
        "screener_attention_priority_score", "screener_action_bucket", "primary_archetype", "secondary_archetype", "archetype_direction", "archetype_confidence", "archetype_summary", "archetype_risk_note", "screener_reason_summary",
        "signal_consensus_direction_score", "signal_consensus_direction_label", "signal_consensus_score_signed",
        "signal_dispersion_score", "signal_consensus_confidence_score",
        "latest_data_date", "latest_close", "latest_volume", "volume_pct_vs_20d",
        "close_pct_vs_ma_21", "close_pct_vs_ma_50", "close_pct_vs_ma_200",
        "days_since_latest_event", "latest_event_recency_bucket",
        "days_since_latest_confirmed", "latest_confirmed_recency_bucket",
        "latest_event_tier", "latest_event_direction", "latest_event_quality_score", "latest_event_dashboard_summary_label",
        "latest_confirmed_event_date", "latest_confirmed_event_direction", "latest_confirmed_quality_score", "latest_confirmed_dashboard_summary_label",

        "bollinger_direction_score", "bollinger_confidence_score", "bollinger_recency_decay", "bollinger_watch_cluster_score", "attention_adjusted_bollinger_score",
        "outside_count", "watch_count", "confirmed_count", "confirmed_rate", "bullish_confirmed_count", "bearish_confirmed_count",
        "confirmed_bull_bear_spread", "confirmed_to_watch_ratio", "watch_to_outside_ratio", "alert_density",

        "price_macd_direction_score", "sentiment_macd_direction_score", "sent_price_macd_spread_score",
        "sent_price_macd_signal_spread", "sent_price_macd_spread_z", "sent_price_macd_spread_slope",
        "sent_price_macd_cross", "sent_price_macd_cross_days", "sent_price_macd_crossover_score",
        "sent_price_macd_joint_slope_score", "sent_price_macd_joint_slope_label",
        "macd_family_direction_score", "macd_family_label",
        "macd", "macd_signal", "macd_histogram", "sentiment_macd", "sentiment_macd_signal", "scaled_sentiment_macd_signal",

        "price_rsi_state_score", "sentiment_rsi_state_score", "price_rsi_risk_label", "sentiment_rsi_risk_label",
        "sent_price_rsi_spread", "sent_price_rsi_spread_z", "sent_price_rsi_spread_slope",
        "sent_price_rsi_relationship_score", "sent_price_rsi_relationship_label",
        "stoch_rsi_timing_score", "rsi_alignment_score", "rsi_family_state_score", "rsi_family_label",
        "rsi", "sentiment_rsi", "stochastic_rsi", "stochastic_rsi_d", "sentiment_stochastic_rsi_d",

        "sent_ribbon_direction_score", "sent_ribbon_structure_score", "sent_ribbon_label", "sent_ribbon_transition_risk_score",
        "sent_ribbon_regime_raw", "sent_ribbon_regime_score", "sent_ribbon_regime_confidence",
        "sent_ribbon_compression_flag", "sent_ribbon_transition_flag", "sent_ribbon_transition_type", "sent_ribbon_width_z", "sent_ribbon_center_slope_21_z",
        "ma_trend_direction_score",

        "attention_participation_score", "attention_confirmation_score",
        "attention_level_score", "attention_conviction_score_signed", "attention_regime_score",
        "avg_attention_level_score", "avg_combined_engagement_z", "combined_engagement_z",
        "x_engagement_sum_z", "reddit_engagement_sum_z", "bsky_engagement_sum_z", "news_engagement_sum", "news_proxy_engagement_raw",

        "recent_watch_count_7d", "recent_bullish_watch_count_7d", "recent_bearish_watch_count_7d",
        "recent_confirmed_count_7d", "recent_bullish_confirmed_count_7d", "recent_bearish_confirmed_count_7d", "recent_event_count_30d", "recent_avg_alert_quality_30d",

        "reason_fresh_confirmed_event", "reason_high_attention", "reason_bollinger_extreme", "reason_macd_improving",
        "reason_sentiment_momentum", "reason_low_dispersion", "reason_high_dispersion", "reason_stale_event", "reason_conflicted_signals",
    ]
    ordered = [c for c in preferred_order if c in out.columns]
    ordered += [c for c in out.columns if c not in ordered]
    out = out[ordered].sort_values(["screener_attention_priority_rank", "term"], na_position="last")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output_path, index=False)
    if not indicator_matrix.empty:
        indicator_matrix.to_csv(matrix_path, index=False)
    if not archetypes.empty:
        archetypes.to_csv(archetypes_path, index=False)

    print(f"[OK] wrote {output_path}")
    print(f"[OK] wrote {matrix_path} ({len(indicator_matrix)} rows)")
    print(f"[OK] wrote {archetypes_path} ({len(archetypes)} rows)")
    print(f"[OK] screener rows={len(out)} cols={len(out.columns)}")
    print_validation_summary(out, archetypes, indicator_matrix)

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Build SETA market screener v2 CSV.")
    parser.add_argument("--source-dir", default=str(DEFAULT_SOURCE_DIR), help="Directory containing the source CSVs.")
    parser.add_argument("--output-filename", default=DEFAULT_OUTPUT_FILENAME, help="Output CSV filename.")
    parser.add_argument("--matrix-filename", default=None, help="Optional indicator matrix CSV filename.")
    parser.add_argument("--archetypes-filename", default=None, help="Optional signal archetypes CSV filename.")
    args = parser.parse_args()

    build_screener(Path(args.source_dir), args.output_filename, args.matrix_filename, args.archetypes_filename)


if __name__ == "__main__":
    main()
