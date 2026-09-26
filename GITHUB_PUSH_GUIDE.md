# GitHub push guide

This folder is the GitHub-ready OceanTwin 3D repository.

## 1. Test before the first push

From PowerShell in this folder:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m streamlit run app.py
```

If you already have a working Python environment elsewhere, you may call that interpreter explicitly instead of creating a new `.venv`. Keep machine-specific paths out of commits.

## 2. Create the Git repository

```powershell
git init
git add .
git status
git commit -m "Initial OceanTwin 3D MVP"
```

Inspect `git status` before committing. `.venv`, secrets, caches, and local screenshots should not be staged.

## 3. Connect your GitHub repository

Create an empty repository on GitHub, then replace `<YOUR-REPO-URL>` below:

```powershell
git branch -M main
git remote add origin <YOUR-REPO-URL>
git push -u origin main
```

Example remote formats:

```text
https://github.com/<username>/OceanTwin-3D.git
git@github.com:<username>/OceanTwin-3D.git
```

## 4. Verify after push

On GitHub, confirm these are visible:

- `app.py`
- `src/`
- `tests/`
- `docs/`
- `data/glorys12_20240102_67E70E_12N14N_0m500m.nc`
- `data/comparison/`
- `requirements.txt`
- `README.md`
- `.github/workflows/tests.yml`

The bundled NetCDF subset is deliberately committed because it is small and makes the judge-facing MVP runnable offline. Do not later add full/global/raw Copernicus or Argo archives directly to Git.
