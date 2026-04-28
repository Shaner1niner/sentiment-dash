#!/usr/bin/env python
from __future__ import annotations
import argparse, csv, json, math
from datetime import datetime, UTC
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
DAILY_LATEST = REPO_ROOT / "reply_agent" / "daily_context" / "seta_daily_context_latest.json"
NARRATIVE_LATEST = REPO_ROOT / "reply_agent" / "narrative_context" / "seta_narrative_context_latest.json"
STYLE_JSON = REPO_ROOT / "agent_reference" / "seta_style_guide_v2_2.json"
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "content_packets"

def load_json(p: Path, default: Any):
    if not p.exists(): return default
    return json.loads(p.read_text(encoding="utf-8"))

def by_term(obj):
    v = obj.get("by_term", {}) if isinstance(obj, dict) else {}
    return v if isinstance(v, dict) else {}

def clean(v):
    if v is None: return ""
    s = str(v).strip()
    return "" if s.lower() in {"nan","none","null"} else s

def phrase(words):
    if not isinstance(words, list): return ""
    raw = [clean(w).lower() for w in words if clean(w)]
    out, seen = [], set()
    for w in raw:
        if w == "basis" and "cost basis" in raw: continue
        if w not in seen:
            out.append(w); seen.add(w)
        if len(out) >= 3: break
    if len(out)==0: return ""
    if len(out)==1: return out[0]
    if len(out)==2: return out[0]+" and "+out[1]
    return out[0]+", "+out[1]+", and "+out[2]

def sort_key(item):
    d=item[1]
    try: r=int(d.get("decision_pressure_rank"))
    except Exception: r=9999
    try: p=float(d.get("decision_pressure"))
    except Exception: p=-9999
    return (r, -p)

def angle(d,n):
    st=clean(d.get("asset_state")).lower()
    struct=clean(d.get("structural_state")).lower()
    reg=clean(n.get("regime")).lower()
    if "churn" in reg or "noise" in reg: return "Signal versus narrative noise"
    if "diffusion" in st: return "Participation diffusion"
    if "disagreement" in st: return "Decision pressure / contested structure"
    if "repair" in st: return "Repair watch"
    if "decay" in st or "rejection" in struct: return "Validation risk"
    return "SETA context watch"

def website_note(term,d,n):
    take=clean(d.get("analyst_take")); state=clean(d.get("asset_state")); struct=clean(d.get("structural_state"))
    coh=clean(n.get("coherence_bucket")); kw=phrase(n.get("top_keywords"))
    parts=[]
    if take: parts.append(take)
    elif state: parts.append(f"{term} is currently in a {state} state.")
    if struct: parts.append(f"Structural read: {struct}.")
    if kw: parts.append(f"Narrative themes: {kw}.")
    if coh: parts.append(f"Narrative coherence is {coh}.")
    parts.append("This is context for interpretation, not a prediction.")
    return " ".join(parts)

def social_hook(term,d,n):
    state=clean(d.get("asset_state")) or "mixed"; struct=clean(d.get("structural_state")); rank=d.get("decision_pressure_rank")
    skew=clean(d.get("resolution_skew")); coh=clean(n.get("coherence_bucket")); kw=phrase(n.get("top_keywords"))
    if kw:
        return f"${term} reads as {state} with {coh or 'unclear'} narrative structure. Recent discussion is clustered around {kw}; useful context, not a trade signal."
    bits=[f"${term} reads as {state}"]
    if struct: bits.append(f"with {struct}")
    if rank not in (None,"","nan"): bits.append(f"decision-pressure rank {rank}")
    if skew and skew!="unknown": bits.append(f"{skew} skew")
    return "; ".join(bits)+". Useful context, not a guaranteed call."

def build_rows(daily,narrative,max_terms):
    dt=by_term(daily); nt=by_term(narrative)
    items=[(t,d) for t,d in dt.items() if isinstance(d,dict)]
    items.sort(key=sort_key)
    rows=[]
    for term,d in items[:max_terms]:
        n=nt.get(term,{}) if isinstance(nt.get(term),dict) else {}
        rows.append({"term":term,"universe":clean(d.get("universe")),"content_angle":angle(d,n),"short_note":clean(d.get("analyst_take")) or website_note(term,d,n),"social_hook":social_hook(term,d,n),"website_note":website_note(term,d,n),"asset_state":d.get("asset_state"),"decision_pressure_rank":d.get("decision_pressure_rank"),"decision_pressure":d.get("decision_pressure"),"structural_state":d.get("structural_state"),"resolution_skew":d.get("resolution_skew"),"narrative_regime":n.get("regime"),"narrative_coherence_bucket":n.get("coherence_bucket"),"narrative_top_keywords":n.get("top_keywords",[])})
    return rows


def clean_json_value(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, dict):
        return {k: clean_json_value(x) for k, x in v.items()}
    if isinstance(v, list):
        return [clean_json_value(x) for x in v]
    return v


def clean_json_value(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, dict):
        return {k: clean_json_value(x) for k, x in v.items()}
    if isinstance(v, list):
        return [clean_json_value(x) for x in v]
    return v

def write_csv(path,rows):
    fields=["term","universe","content_angle","short_note","social_hook","website_note","asset_state","decision_pressure_rank","decision_pressure","structural_state","resolution_skew","narrative_regime","narrative_coherence_bucket","narrative_top_keywords"]
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open("w",encoding="utf-8",newline="") as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader()
        for r in rows:
            w.writerow({k: json.dumps(r.get(k),ensure_ascii=False) if isinstance(r.get(k),(list,dict)) else ("" if r.get(k) is None else r.get(k)) for k in fields})

def md_packet(packet):
    lines=[f"# SETA Daily Content Packet — {packet.get('date')}","","Generated for editorial/product review. Not financial advice and not an auto-posting output.","","## Style Doctrine","","- SETA explains behavior beneath price.","- Sentiment is context, not a trigger.","- Separate crypto from equities.","- Prefer yes-and framing over chart fights.","","## Suggested Daily Hooks",""]
    for r in packet.get("rows",[]):
        lines += [f"### ${r.get('term')} — {r.get('content_angle')}","",f"**Social hook:** {r.get('social_hook')}","",f"**Website note:** {r.get('website_note')}",""]
    return "\n".join(lines)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--out-dir",default=str(DEFAULT_OUT_DIR)); ap.add_argument("--max-terms",type=int,default=12); args=ap.parse_args()
    daily=load_json(DAILY_LATEST,{}); narrative=load_json(NARRATIVE_LATEST,{}); style=load_json(STYLE_JSON,{})
    if not daily: raise SystemExit(f"[ERROR] Missing or empty daily context: {DAILY_LATEST}")
    date=daily.get("date") or datetime.now(UTC).strftime("%Y-%m-%d")
    rows=build_rows(daily,narrative,args.max_terms)
    packet={"schema_version":"seta_daily_content_packet_v1","created_at_utc":datetime.now(UTC).isoformat(timespec="seconds"),"date":date,"draft_only":True,"posting_performed":False,"style_guide_version":style.get("schema_version","2.2"),"style_core_identity":style.get("core_identity","SETA explains behavior beneath price."),"source_files":{"daily_context":str(DAILY_LATEST),"narrative_context":str(NARRATIVE_LATEST),"style_guide":str(STYLE_JSON)},"rows":rows}
    out=Path(args.out_dir); out.mkdir(parents=True,exist_ok=True)
    jp=out/f"seta_daily_content_packet_{date}.json"; mp=out/f"seta_daily_content_packet_{date}.md"; cp=out/f"seta_daily_content_packet_{date}.csv"
    jp.write_text(json.dumps(clean_json_value(packet),indent=2,ensure_ascii=False,allow_nan=False),encoding="utf-8"); mp.write_text(md_packet(packet),encoding="utf-8"); write_csv(cp,rows)
    summary={"json_path":str(jp),"markdown_path":str(mp),"csv_path":str(cp),"date":date,"rows":len(rows),"draft_only":True,"posting_performed":False}
    print("="*72); print("SETA daily content packet complete"); print(json.dumps(summary,indent=2,ensure_ascii=False))
    return 0
if __name__=="__main__": raise SystemExit(main())
