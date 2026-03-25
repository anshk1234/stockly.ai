"""
predictor.py — Lightweight ML price-prediction model.
Uses GradientBoostingRegressor (scikit-learn) with walk-forward
cross-validation so the reported metrics are honest out-of-sample.
"""

from __future__ import annotations
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

from backend.processing import build_feature_matrix, FEATURE_COLS


@dataclass
class PredictionResult:
    predicted_price:   float
    confidence_lo:     float          # simple ±band
    confidence_hi:     float
    mae:               float
    rmse:              float
    r2:                float
    feature_importance: dict[str, float] = field(default_factory=dict)
    history_dates:     list            = field(default_factory=list)
    history_actual:    list            = field(default_factory=list)
    history_predicted: list            = field(default_factory=list)
    days_ahead:        int             = 1


# ── Public entry point ─────────────────────────────────────────────────────

def predict(df: pd.DataFrame, days_ahead: int = 5) -> PredictionResult | None:
    """
    Train a model on *df* (raw OHLCV) and return a PredictionResult.
    Returns None if data is insufficient.
    """
    feat_df = build_feature_matrix(df)
    if len(feat_df) < 60:           # need at least 60 rows after feature engineering
        return None

    X = feat_df[FEATURE_COLS].values
    y = feat_df["Target"].values
    dates = feat_df.index

    # ── Walk-forward split (80 / 20) ──────────────────────────────────────
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    scaler  = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    model = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=4,
        subsample=0.8,
        random_state=42,
    )
    model.fit(X_train, y_train)

    # ── Back-test metrics ──────────────────────────────────────────────────
    y_pred_test = model.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    ss_res = np.sum((y_test - y_pred_test) ** 2)
    ss_tot = np.sum((y_test - y_test.mean()) ** 2)
    r2   = 1 - ss_res / ss_tot if ss_tot else 0.0

    # ── Multi-day forward prediction ───────────────────────────────────────
    last_row    = feat_df[FEATURE_COLS].iloc[-1].values.copy()
    last_close  = float(feat_df["Close"].iloc[-1]) if "Close" in feat_df.columns else float(y[-1])
    predictions = []

    for _ in range(days_ahead):
        x_scaled = scaler.transform(last_row.reshape(1, -1))
        nxt = float(model.predict(x_scaled)[0])
        predictions.append(nxt)
        # Shift lag features forward
        last_row[1:5] = last_row[0:4]        # Lag_5 ← Lag_4 … Lag_2 ← Lag_1
        last_row[0]   = nxt                  # Lag_1 ← new prediction

    final_price = predictions[-1]
    margin      = rmse * 1.5                  # simple uncertainty band

    # ── Historical predicted vs actual (test window only) ─────────────────
    # Retrain on all data for the in-sample curve
    X_all = scaler.fit_transform(X)
    model.fit(X_all, y)
    y_all_pred = model.predict(X_all)

    importance = dict(zip(FEATURE_COLS, model.feature_importances_.tolist()))

    return PredictionResult(
        predicted_price   = round(final_price, 2),
        confidence_lo     = round(final_price - margin, 2),
        confidence_hi     = round(final_price + margin, 2),
        mae               = round(mae, 2),
        rmse              = round(rmse, 2),
        r2                = round(r2, 4),
        feature_importance= importance,
        history_dates     = list(dates),
        history_actual    = list(y),
        history_predicted = list(y_all_pred),
        days_ahead        = days_ahead,
    )
