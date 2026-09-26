"""Plotly depth-aware views built directly from the cached model temperature array."""
from __future__ import annotations

import numpy as np
import plotly.graph_objects as go

from config import PANEL_BG, TEMP_COLORSCALE, TEXT
from .comparison_loader import EvidenceError


def volume_figure(model: dict, depth_index: int, vertical_exaggeration: float, opacity: float) -> go.Figure:
    temp = model["temperature"]
    depths = model["depth"]
    lats = model["latitude"]
    lons = model["longitude"]

    # Keep the figure responsive while retaining every model depth.
    lat_idx = np.arange(0, len(lats), 2)
    lon_idx = np.arange(0, len(lons), 2)
    d_idx = np.arange(len(depths))
    dd, yy, xx = np.meshgrid(d_idx, lat_idx, lon_idx, indexing="ij")

    z = depths[dd].ravel()
    y = lats[yy].ravel()
    x = lons[xx].ravel()
    c = temp[dd, yy, xx].ravel()
    keep = np.isfinite(c)
    if not np.any(keep):
        raise EvidenceError("No finite model temperature values are available for the 3D view.")

    cmin, cmax = model["temperature_min"], model["temperature_max"]
    fig = go.Figure()
    fig.add_trace(
        go.Scatter3d(
            x=x[keep],
            y=y[keep],
            z=z[keep],
            mode="markers",
            marker=dict(
                size=2.8,
                color=c[keep],
                colorscale=TEMP_COLORSCALE,
                cmin=cmin,
                cmax=cmax,
                opacity=float(opacity),
                colorbar=dict(title="Temperature<br>(°C)", thickness=13, len=0.72),
            ),
            name="3D model temperature",
            hovertemplate=(
                "Lon %{x:.3f}°E<br>Lat %{y:.3f}°N<br>Depth %{z:.2f} m"
                "<br>Temperature %{marker.color:.3f} °C<extra></extra>"
            ),
        )
    )

    selected = temp[depth_index]
    sy, sx = np.meshgrid(np.arange(len(lats)), np.arange(len(lons)), indexing="ij")
    sc = selected.ravel()
    valid = np.isfinite(sc)
    fig.add_trace(
        go.Scatter3d(
            x=np.tile(lons, len(lats))[valid],
            y=np.repeat(lats, len(lons))[valid],
            z=np.full(valid.sum(), float(depths[depth_index])),
            mode="markers",
            marker=dict(
                size=3.6,
                color=sc[valid],
                colorscale=TEMP_COLORSCALE,
                cmin=cmin,
                cmax=cmax,
                opacity=0.95,
                showscale=False,
                line=dict(width=0.2, color="rgba(255,255,255,0.35)"),
            ),
            name=f"Selected layer · {depths[depth_index]:.2f} m",
            hovertemplate=(
                "Selected depth %{z:.2f} m<br>Lon %{x:.3f}°E<br>Lat %{y:.3f}°N"
                "<br>Temperature %{marker.color:.3f} °C<extra></extra>"
            ),
        )
    )

    # vertical_exaggeration changes display geometry, not scientific depth values.
    z_aspect = 0.38 + 0.11 * float(vertical_exaggeration)
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor=PANEL_BG,
        height=520,
        margin=dict(l=0, r=0, t=16, b=0),
        legend=dict(orientation="h", y=0.98, x=0.01, bgcolor="rgba(6,17,31,0.55)"),
        font=dict(color=TEXT),
        scene=dict(
            bgcolor=PANEL_BG,
            xaxis=dict(title="Longitude (°E)", gridcolor="rgba(145,169,194,0.12)"),
            yaxis=dict(title="Latitude (°N)", gridcolor="rgba(145,169,194,0.12)"),
            zaxis=dict(
                title="Depth (m, positive down)",
                autorange="reversed",
                gridcolor="rgba(145,169,194,0.12)",
            ),
            aspectmode="manual",
            aspectratio=dict(x=1.45, y=1.0, z=z_aspect),
            camera=dict(eye=dict(x=1.55, y=1.55, z=0.85)),
        ),
    )
    return fig


def slice_figure(model: dict, depth_index: int) -> go.Figure:
    depths = model["depth"]
    if not 0 <= int(depth_index) < len(depths):
        raise EvidenceError("Selected model depth is outside the available depth indices.")
    values = model["temperature"][int(depth_index)]
    if not np.isfinite(values).any():
        raise EvidenceError(f"No model temperature exists at {depths[int(depth_index)]:.2f} m.")

    fig = go.Figure(
        go.Heatmap(
            x=model["longitude"],
            y=model["latitude"],
            z=values,
            colorscale=TEMP_COLORSCALE,
            zmin=model["temperature_min"],
            zmax=model["temperature_max"],
            colorbar=dict(title="Temperature<br>(°C)", thickness=13),
            hovertemplate="Lon %{x:.3f}°E<br>Lat %{y:.3f}°N<br>Temperature %{z:.3f} °C<extra></extra>",
        )
    )
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor=PANEL_BG,
        plot_bgcolor=PANEL_BG,
        height=430,
        margin=dict(l=60, r=20, t=18, b=55),
        font=dict(color=TEXT),
        xaxis=dict(title="Longitude (°E)", gridcolor="rgba(145,169,194,0.12)"),
        yaxis=dict(
            title="Latitude (°N)",
            gridcolor="rgba(145,169,194,0.12)",
            scaleanchor="x",
            scaleratio=1,
        ),
    )
    return fig
