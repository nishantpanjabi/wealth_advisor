from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
from flask import Flask, jsonify, request
from sklearn.ensemble import RandomForestRegressor


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

MODEL = None
FUND_UNIVERSE: list[dict[str, Any]] = []
MARKET_DATA: dict[str, dict[str, Any]] = {}

TARGET_ALLOCATIONS = {
    "CONSERVATIVE": {"EQUITY": 20.0, "DEBT": 50.0, "GOLD": 15.0, "LIQUID": 15.0, "expected_return": 7.2},
    "MODERATE": {"EQUITY": 50.0, "DEBT": 25.0, "GOLD": 15.0, "LIQUID": 10.0, "expected_return": 9.7},
    "AGGRESSIVE": {"EQUITY": 75.0, "DEBT": 10.0, "GOLD": 10.0, "LIQUID": 5.0, "expected_return": 12.0},
}

RISK_SCORE_MAP = {"CONSERVATIVE": 30, "MODERATE": 55, "AGGRESSIVE": 80}

app = Flask(__name__)


def load_fund_universe() -> list[dict[str, Any]]:
    with open(DATA_DIR / "fund_universe.json", "r", encoding="utf-8") as fh:
        return json.load(fh)


def load_market_data() -> dict[str, dict[str, Any]]:
    frame = pd.read_csv(DATA_DIR / "market_data.csv")
    latest = {}
    for _, row in frame.iterrows():
        latest[str(row["asset_class"]).upper()] = {
            "as_of": str(row["as_of"]),
            "return_adjustment": float(row["return_adjustment"]),
            "volatility_adjustment": float(row["volatility_adjustment"]),
            "market_regime": str(row["market_regime"]),
        }
    return latest


def train_model() -> RandomForestRegressor:
    frame = pd.read_csv(DATA_DIR / "training_samples.csv")
    features = frame.drop(columns=["label"])
    labels = frame["label"]
    model = RandomForestRegressor(n_estimators=120, random_state=42)
    model.fit(features, labels)
    return model


def ensure_model() -> RandomForestRegressor:
    global MODEL
    if MODEL is None:
        MODEL = train_model()
    return MODEL


def target_allocation(risk_category: str) -> dict[str, float]:
    return TARGET_ALLOCATIONS.get(risk_category.upper(), TARGET_ALLOCATIONS["MODERATE"])


def build_features(payload: dict[str, Any], fund: dict[str, Any]) -> dict[str, float]:
    risk_category = str(payload.get("riskCategory") or "MODERATE").upper()
    risk_score = RISK_SCORE_MAP.get(risk_category, 55)
    years = max(1, min(int(payload.get("years") or 10), 30))
    monthly_investment = float(payload.get("investmentAmount") or 0.0)
    portfolio = payload.get("portfolio") or {}
    goals = payload.get("goals") or []
    top_goal = goals[0] if goals else {}

    return {
        "risk_score": risk_score,
        "years": years,
        "monthly_investment": monthly_investment,
        "equity_pct": float(portfolio.get("equityPct") or 0.0),
        "debt_pct": float(portfolio.get("debtPct") or 0.0),
        "gold_pct": float(portfolio.get("goldPct") or 0.0),
        "liquid_pct": float(portfolio.get("liquidPct") or 0.0),
        "goal_priority": float(top_goal.get("priority") or 3),
        "is_emergency_goal": 1.0 if str(top_goal.get("goalType") or "").upper() == "EMERGENCY_FUND" else 0.0,
        "fund_expected_return": float(fund["expected_return"]),
        "fund_volatility": float(fund["volatility"]),
        "fund_goal_bias": float(fund["goal_bias"]),
        "fund_liquidity": float(fund["liquidity"]),
    }


def recommend(payload: dict[str, Any]) -> dict[str, Any]:
    model = ensure_model()
    risk_category = str(payload.get("riskCategory") or "MODERATE").upper()
    years = max(1, min(int(payload.get("years") or 10), 30))
    investment_amount = float(payload.get("investmentAmount") or 0.0)
    portfolio = payload.get("portfolio") or {}
    target = target_allocation(risk_category)
    payload_market_data = payload.get("marketData") or {}

    scored_funds: list[dict[str, Any]] = []
    for fund in FUND_UNIVERSE:
        feature_row = pd.DataFrame([build_features(payload, fund)])
        predicted_score = float(model.predict(feature_row)[0])
        scored_funds.append(
            {
                "fundName": fund["fund_name"],
                "assetClass": fund["asset_class"],
                "predictedScore": round(max(0.0, min(predicted_score, 1.0)), 4),
                "expectedReturn": float(fund["expected_return"]),
                "rationale": build_rationale(fund, risk_category, years),
            }
        )

    best_per_asset: dict[str, dict[str, Any]] = {}
    for item in sorted(scored_funds, key=lambda x: x["predictedScore"], reverse=True):
        best_per_asset.setdefault(item["assetClass"], item)

    funds_to_buy: list[dict[str, Any]] = []
    for asset_class in ["EQUITY", "DEBT", "GOLD", "LIQUID"]:
        allocation = target.get(asset_class, 0.0)
        if allocation <= 0:
            continue
        chosen = best_per_asset.get(asset_class)
        if not chosen:
            continue
        market_snapshot = payload_market_data.get(asset_class) or MARKET_DATA.get(asset_class, {})
        funds_to_buy.append(
            {
                "fundName": chosen["fundName"],
                "assetClass": asset_class,
                "allocationPercent": allocation,
                "monthlySipAmount": round(investment_amount * allocation / 100.0, 2),
                "rationale": append_market_context(chosen["rationale"], market_snapshot),
                "score": round(chosen["predictedScore"] * 100.0, 2),
            }
        )

    rebalance_actions = []
    funds_to_sell = []
    current_allocations = {
        "EQUITY": float(portfolio.get("equityPct") or 0.0),
        "DEBT": float(portfolio.get("debtPct") or 0.0),
        "GOLD": float(portfolio.get("goldPct") or 0.0),
        "LIQUID": float(portfolio.get("liquidPct") or 0.0),
    }
    for asset_class, current_value in current_allocations.items():
        target_value = float(target.get(asset_class, 0.0))
        drift = target_value - current_value
        if abs(drift) < 4.0:
            action = "HOLD"
            rationale = "Current allocation is already close to target."
        elif drift > 0:
            action = "BUY"
            rationale = append_market_context(
                f"Raise {asset_class.lower()} exposure toward the model allocation.",
                payload_market_data.get(asset_class) or MARKET_DATA.get(asset_class, {}),
            )
        else:
            action = "SELL"
            rationale = append_market_context(
                f"Reduce {asset_class.lower()} exposure to lower concentration risk.",
                payload_market_data.get(asset_class) or MARKET_DATA.get(asset_class, {}),
            )
            funds_to_sell.append(f"{asset_class}: {rationale}")
        rebalance_actions.append(
            {
                "assetClass": asset_class,
                "action": action,
                "currentAllocationPct": round(current_value, 2),
                "targetAllocationPct": round(target_value, 2),
                "rationale": rationale,
            }
        )

    current_value = float((portfolio.get("totalCurrentValue") or 0.0))
    projected_value = project_value(current_value, investment_amount, target["expected_return"] / 100.0, years)

    goals = payload.get("goals") or []
    top_goal_name = goals[0]["name"] if goals else "your goals"
    return {
        "projectedValueAtMaturity": round(projected_value, 2),
        "fundsToBuy": funds_to_buy,
        "fundsToSell": funds_to_sell,
        "rebalanceActions": rebalance_actions,
        "keyReasons": [
            f"Matched to {risk_category.lower()} risk appetite.",
            f"Aligned to {years}-year investment horizon.",
            f"Prioritized for {top_goal_name}.",
            summarize_market_regimes(payload_market_data),
        ],
        "modelSource": "python-random-forest",
    }


def project_value(current_value: float, monthly_investment: float, annual_return: float, years: int) -> float:
    monthly_rate = annual_return / 12.0
    months = years * 12
    current_growth = current_value * ((1 + annual_return) ** years)
    sip_growth = (
        monthly_investment * months
        if monthly_rate == 0
        else monthly_investment * (((1 + monthly_rate) ** months - 1) / monthly_rate)
    )
    return current_growth + sip_growth


def build_rationale(fund: dict[str, Any], risk_category: str, years: int) -> str:
    asset_class = fund["asset_class"].lower()
    if years <= 3 and asset_class in {"debt", "liquid"}:
        return f"Favored for shorter horizon with better stability in {asset_class} exposure."
    if risk_category == "AGGRESSIVE" and asset_class == "equity":
        return "Favored for long-term growth and stronger return potential."
    if asset_class == "gold":
        return "Adds diversification and downside hedge during stressed markets."
    return f"Suitable {asset_class} sleeve for a {risk_category.lower()} portfolio."


def append_market_context(text: str, market_snapshot: dict[str, Any]) -> str:
    if not market_snapshot:
        return text
    regime = market_snapshot.get("market_regime") or market_snapshot.get("marketRegime")
    return f"{text} Market regime: {regime}."


def summarize_market_regimes(payload_market_data: dict[str, Any]) -> str:
    active_market_data = payload_market_data or MARKET_DATA
    if not active_market_data:
        return "Local market data snapshot unavailable."
    parts = []
    for asset_class, snapshot in active_market_data.items():
        parts.append(f"{asset_class.lower()}={snapshot.get('market_regime') or snapshot.get('marketRegime')}")
    return "Market snapshot: " + ", ".join(parts) + "."


@app.get("/health")
def health() -> Any:
    return jsonify({"status": "ok", "modelLoaded": MODEL is not None, "funds": len(FUND_UNIVERSE)})


@app.post("/ml/train")
def train_endpoint() -> Any:
    global MODEL
    MODEL = train_model()
    return jsonify({"status": "trained", "samples": len(pd.read_csv(DATA_DIR / "training_samples.csv"))})


@app.get("/ml/market-data")
def market_data_endpoint() -> Any:
    return jsonify({"marketData": MARKET_DATA})


@app.post("/ml/market-data/refresh")
def market_data_refresh_endpoint() -> Any:
    global MARKET_DATA
    MARKET_DATA = load_market_data()
    return jsonify({"status": "refreshed", "marketData": MARKET_DATA})


@app.post("/ml/recommend")
def recommend_endpoint() -> Any:
    payload = request.get_json(force=True, silent=False) or {}
    return jsonify(recommend(payload))


if __name__ == "__main__":
    FUND_UNIVERSE = load_fund_universe()
    MARKET_DATA = load_market_data()
    ensure_model()
    app.run(host="0.0.0.0", port=5000, debug=True)
