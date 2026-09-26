# Troubleshooting

## `streamlit` is not recognized

Use the environment interpreter directly:

```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py
```

## Wrong Python environment

```powershell
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -m pip list
```

If `.venv` does not exist, create it with a known installed Python interpreter.

## Missing package

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Port already in use

```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py --server.port 8502
```

## Missing model/comparison file

Restore the packaged `data/` directory. Do not substitute unknown data during judging. The app should report the missing local evidence explicitly rather than synthesize values.

## 3D rendering issue

Use **Use 2D compatibility fallback** in the sidebar. This retains the actual model temperature data and selected depth.

## Cache issue

Stop the app and run:

```powershell
.\.venv\Scripts\python.exe -m streamlit cache clear
```

Then restart the app.

## Corrupted processed output

Run tests. If comparison loaders fail, restore the final frozen package rather than hand-editing scientific CSV/JSON evidence.

## Test failure

Do not demonstrate until the cause is identified. Preserve the failing output, compare source hashes against `data_manifest.json`, and restore from the frozen ZIP if necessary.
