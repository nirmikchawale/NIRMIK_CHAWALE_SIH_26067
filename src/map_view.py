"""Offline geographic context plot for model/Argo collocation."""
from __future__ import annotations

import plotly.graph_objects as go

from config import ARGO_COLOR, MODEL_COLOR, MUTED, PANEL_BG, TEXT


def map_figure(model: dict, summary: dict) -> go.Figure:
    lon = model["longitude"]
    lat = model["latitude"]
    xmin, xmax = float(lon.min()), float(lon.max())
    ymin, ymax = float(lat.min()), float(lat.max())

    obs_lon = float(summary["observation_longitude"])
    obs_lat = float(summary["observation_latitude"])
    cell_lon = float(summary["model_cell_longitude"])
    cell_lat = float(summary["model_cell_latitude"])
    distance = float(summary["spatial_distance_km"])

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=[xmin, xmax, xmax, xmin, xmin],
            y=[ymin, ymin, ymax, ymax, ymin],
            mode="lines",
            line=dict(color="rgba(109,114,246,0.65)", width=2),
            name="Model subset boundary",
            hoverinfo="skip",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=[obs_lon, cell_lon],
            y=[obs_lat, cell_lat],
            mode="lines",
            line=dict(color="rgba(231,237,247,0.65)", width=2, dash="dot"),
            name="Collocation separation",
            hoverinfo="skip",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=[cell_lon],
            y=[cell_lat],
            mode="markers",
            marker=dict(size=13, color=MODEL_COLOR, symbol="square"),
            name="Nearest Copernicus cell",
            hovertemplate="Model cell<br>%{x:.5f}°E<br>%{y:.5f}°N<extra></extra>",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=[obs_lon],
            y=[obs_lat],
            mode="markers",
            marker=dict(size=15, color=ARGO_COLOR, symbol="circle", line=dict(width=2, color="#D7FFFF")),
            name="Selected Argo profile",
            hovertemplate="Argo profile<br>%{x:.5f}°E<br>%{y:.5f}°N<extra></extra>",
        )
    )
    fig.add_annotation(
        x=(obs_lon + cell_lon) / 2,
        y=(obs_lat + cell_lat) / 2,
        text=f"{distance:.3f} km",
        showarrow=True,
        arrowhead=0,
        ax=55,
        ay=-34,
        bgcolor="rgba(6,17,31,0.88)",
        bordercolor="rgba(231,237,247,0.25)",
        font=dict(color=TEXT, size=12),
    )
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor=PANEL_BG,
        plot_bgcolor=PANEL_BG,
        margin=dict(l=45, r=20, t=12, b=45),
        height=520,
        legend=dict(orientation="h", y=1.08, x=0, font=dict(size=11)),
        xaxis=dict(
            title="Longitude (°E)",
            range=[xmin - 0.05, xmax + 0.05],
            gridcolor="rgba(145,169,194,0.13)",
            zeroline=False,
        ),
        yaxis=dict(
            title="Latitude (°N)",
            range=[ymin - 0.05, ymax + 0.05],
            gridcolor="rgba(145,169,194,0.13)",
            zeroline=False,
            scaleanchor="x",
            scaleratio=1,
        ),
        font=dict(color=TEXT),
    )
    return fig
