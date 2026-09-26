"""Streamlit entry point for OceanTwin 3D."""
import streamlit as st

st.set_page_config(
    page_title="OceanTwin 3D | The Optimizers",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded",
)

from oceantwin.application import main

main()
