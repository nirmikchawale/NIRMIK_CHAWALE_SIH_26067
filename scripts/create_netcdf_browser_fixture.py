"""Create a tiny synthetic CF-NetCDF profile used only to verify browser ingestion.

This fixture is never exposed as scientific evidence. It exists solely for automated
acceptance testing of the user-facing NetCDF import path.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from netCDF4 import Dataset
import numpy as np


def create_fixture(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with Dataset(path, "w", format="NETCDF4") as dataset:
        dataset.Conventions = "CF-1.10"
        dataset.featureType = "profile"
        dataset.title = "Synthetic CTD browser-ingestion test fixture"
        dataset.source = "OceanTwin automated test fixture only"
        dataset.platform_id = "test-ctd-profile-001"

        dataset.createDimension("level", 4)

        lon = dataset.createVariable("longitude", "f8")
        lon.standard_name = "longitude"
        lon.units = "degrees_east"
        lon.axis = "X"
        lon.assignValue(68.25)

        lat = dataset.createVariable("latitude", "f8")
        lat.standard_name = "latitude"
        lat.units = "degrees_north"
        lat.axis = "Y"
        lat.assignValue(13.25)

        time = dataset.createVariable("time", "f8")
        time.standard_name = "time"
        time.units = "hours since 2024-01-02 00:00:00"
        time.axis = "T"
        time.assignValue(6.0)

        depth = dataset.createVariable("depth", "f8", ("level",))
        depth.standard_name = "depth"
        depth.units = "m"
        depth.positive = "down"
        depth.axis = "Z"
        depth[:] = np.asarray([5.0, 20.0, 50.0, 100.0], dtype=float)

        temperature = dataset.createVariable("temperature", "f4", ("level",), fill_value=np.float32(-9999.0))
        temperature.standard_name = "sea_water_temperature"
        temperature.units = "degree_Celsius"
        temperature[:] = np.asarray([28.4, 27.9, 26.6, 24.8], dtype=np.float32)

        salinity = dataset.createVariable("salinity", "f4", ("level",), fill_value=np.float32(-9999.0))
        salinity.standard_name = "sea_water_salinity"
        salinity.units = "1e-3"
        salinity[:] = np.asarray([35.10, 35.12, 35.18, 35.22], dtype=np.float32)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    create_fixture(args.output)
    print("Created NetCDF browser-ingestion test fixture:", args.output)


if __name__ == "__main__":
    main()
