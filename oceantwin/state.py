"""Pure helpers for resettable, read-only judge-demo state."""
from __future__ import annotations


def default_state(default_profile_id: str, default_depth_index: int) -> dict:
    return {
        "selected_profile_id": default_profile_id,
        "enabled_variable": "Temperature",
        "show_metadata": False,
        "model_depth_index": int(default_depth_index),
        "vertical_exaggeration": 5.0,
        "point_opacity": 0.50,
        "force_2d": False,
        "reset_confirmation": False,
    }


def profile_label(summary: dict) -> str:
    direction = "descending" if str(summary.get("direction", "")).upper() == "D" else "ascending"
    return f"Float {summary['platform_id']} · cycle {summary['cycle']} · {direction}"


def normalize_state(session_state, defaults: dict, profile_ids: list[str], depth_count: int | None) -> None:
    for key, value in defaults.items():
        if key not in session_state:
            session_state[key] = value

    if session_state.get("selected_profile_id") not in profile_ids:
        session_state["selected_profile_id"] = defaults["selected_profile_id"]

    if depth_count is not None:
        depth_index = int(session_state.get("model_depth_index", defaults["model_depth_index"]))
        if not 0 <= depth_index < depth_count:
            session_state["model_depth_index"] = defaults["model_depth_index"]

    session_state["enabled_variable"] = "Temperature"


def restore_verified_demo(session_state, defaults: dict) -> None:
    for key, value in defaults.items():
        session_state[key] = value
    session_state["reset_confirmation"] = True
