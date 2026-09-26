"""Reusable Plotly presentation layer; scientific coordinates/values are never changed."""
from __future__ import annotations

from .tokens import (
    ARGO_AMBER,
    GRIDLINE,
    MODEL_CYAN,
    NEGATIVE_BLUE,
    POSITIVE_CORAL,
    SURFACE,
    TEXT_MUTED,
    TEXT_PRIMARY,
    ZERO_NEUTRAL,
)

BIAS_SCALE = [
    [0.0, NEGATIVE_BLUE],
    [0.5, ZERO_NEUTRAL],
    [1.0, POSITIVE_CORAL],
]


def apply_plotly_theme(fig, *, kind: str | None = None, title: str | None = None):
    height = {
        "model": 430,
        "map": 430,
        "profile": 405,
        "bias": 405,
        "slice": 390,
    }.get(kind)

    layout = dict(
        paper_bgcolor=SURFACE,
        plot_bgcolor=SURFACE,
        font=dict(color=TEXT_PRIMARY, size=13),
        hoverlabel=dict(
            bgcolor="#102C40",
            bordercolor="rgba(150,183,207,.32)",
            font=dict(color=TEXT_PRIMARY, size=12),
        ),
        margin=dict(l=58, r=22, t=48 if title else 24, b=52),
        legend=dict(
            font=dict(color=TEXT_PRIMARY, size=12),
            bgcolor="rgba(4,17,29,.45)",
            bordercolor="rgba(150,183,207,.15)",
            borderwidth=1,
        ),
    )
    if height:
        layout["height"] = height
    if title:
        layout["title"] = dict(
            text=title,
            x=0.01,
            xanchor="left",
            font=dict(color=TEXT_PRIMARY, size=16),
        )
    fig.update_layout(**layout)

    if hasattr(fig.layout, "xaxis"):
        fig.update_xaxes(
            gridcolor=GRIDLINE,
            zerolinecolor=GRIDLINE,
            tickfont=dict(color=TEXT_MUTED, size=11),
            title_font=dict(color=TEXT_PRIMARY, size=12),
        )
    if hasattr(fig.layout, "yaxis"):
        fig.update_yaxes(
            gridcolor=GRIDLINE,
            zerolinecolor=GRIDLINE,
            tickfont=dict(color=TEXT_MUTED, size=11),
            title_font=dict(color=TEXT_PRIMARY, size=12),
        )

    if getattr(fig.layout, "scene", None):
        fig.update_layout(
            scene=dict(
                bgcolor=SURFACE,
                xaxis=dict(
                    gridcolor=GRIDLINE,
                    tickfont=dict(color=TEXT_MUTED, size=10),
                    title_font=dict(color=TEXT_PRIMARY, size=11),
                ),
                yaxis=dict(
                    gridcolor=GRIDLINE,
                    tickfont=dict(color=TEXT_MUTED, size=10),
                    title_font=dict(color=TEXT_PRIMARY, size=11),
                ),
                zaxis=dict(
                    gridcolor=GRIDLINE,
                    tickfont=dict(color=TEXT_MUTED, size=10),
                    title_font=dict(color=TEXT_PRIMARY, size=11),
                ),
            )
        )

    for trace in fig.data:
        name = str(getattr(trace, "name", "") or "")
        if name == "Copernicus model":
            if getattr(trace, "line", None) is not None:
                trace.line.color = MODEL_CYAN
            if getattr(trace, "marker", None) is not None:
                trace.marker.color = MODEL_CYAN
        elif name == "Argo observed":
            if getattr(trace, "line", None) is not None:
                trace.line.color = ARGO_AMBER
            if getattr(trace, "marker", None) is not None:
                trace.marker.color = ARGO_AMBER
        elif name == "Nearest Copernicus cell" and getattr(trace, "marker", None) is not None:
            trace.marker.color = MODEL_CYAN
        elif name == "Selected Argo profile" and getattr(trace, "marker", None) is not None:
            trace.marker.color = ARGO_AMBER
        elif name == "Model − Observation" and getattr(trace, "marker", None) is not None:
            trace.marker.colorscale = BIAS_SCALE

    return fig
