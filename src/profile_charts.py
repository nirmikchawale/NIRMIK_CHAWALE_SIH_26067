"""Profile and residual charts based on the verified matched-level CSVs."""
from __future__ import annotations

import numpy as np
import plotly.graph_objects as go

from config import ARGO_COLOR, BIAS_COLORSCALE, MODEL_COLOR, PANEL_BG, TEXT, ZERO_COLOR


def _base_layout(height: int = 460):
    return dict(
        template="plotly_dark",
        paper_bgcolor=PANEL_BG,
        plot_bgcolor=PANEL_BG,
        height=height,
        margin=dict(l=65, r=28, t=25, b=55),
        font=dict(color=TEXT),
        hovermode="closest",
        xaxis=dict(gridcolor="rgba(145,169,194,0.13)", zeroline=False),
        yaxis=dict(gridcolor="rgba(145,169,194,0.13)", zeroline=False),
    )


def profile_figure(table) -> go.Figure:
    depth = table["observation_depth_m"]
    observed = table["observed_temperature"]
    model = table["model_temperature_interpolated"]

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=model,
            y=depth,
            mode="lines+markers",
            line=dict(color=MODEL_COLOR, width=3),
            marker=dict(size=5),
            name="Copernicus model",
            hovertemplate="Model %{x:.3f} °C<br>Depth %{y:.2f} m<extra></extra>",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=observed,
            y=depth,
            mode="lines+markers",
            line=dict(color=ARGO_COLOR, width=3),
            marker=dict(size=5),
            name="Argo observed",
            hovertemplate="Argo %{x:.3f} °C<br>Depth %{y:.2f} m<extra></extra>",
        )
    )
    layout = _base_layout()
    layout["xaxis"].update(title="Potential temperature (°C)")
    layout["yaxis"].update(title="Depth (m)", autorange="reversed")
    layout["legend"] = dict(orientation="h", y=1.08, x=0)
    fig.update_layout(**layout)
    return fig


def bias_figure(table) -> go.Figure:
    depth = table["observation_depth_m"].to_numpy(float)
    bias = table["signed_bias_celsius"].to_numpy(float)
    span = float(max(np.nanmax(np.abs(bias)), 0.05))

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=bias,
            y=depth,
            mode="lines+markers",
            line=dict(color="rgba(231,237,247,0.50)", width=1.5),
            marker=dict(
                size=8,
                color=bias,
                colorscale=BIAS_COLORSCALE,
                cmin=-span,
                cmax=span,
                colorbar=dict(title="Bias<br>(°C)", thickness=12, len=0.72),
                line=dict(width=0.5, color="rgba(255,255,255,0.55)"),
            ),
            name="Model − Observation",
            hovertemplate="Bias %{x:+.3f} °C<br>Depth %{y:.2f} m<extra></extra>",
        )
    )
    fig.add_vline(x=0, line_width=2, line_color=ZERO_COLOR)
    fig.add_annotation(
        x=-span * 0.62,
        y=float(np.nanmin(depth)),
        text="MODEL COOLER",
        showarrow=False,
        font=dict(color="#6AB6E3", size=10),
        yshift=-16,
    )
    fig.add_annotation(
        x=span * 0.62,
        y=float(np.nanmin(depth)),
        text="MODEL WARMER",
        showarrow=False,
        font=dict(color="#E59B68", size=10),
        yshift=-16,
    )
    layout = _base_layout()
    layout["xaxis"].update(title="Model − Observation (°C)", range=[-span * 1.15, span * 1.15])
    layout["yaxis"].update(title="Depth (m)", autorange="reversed")
    fig.update_layout(**layout)
    return fig
