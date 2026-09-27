$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
python backend/manage.py migrate
if ($LASTEXITCODE -ne 0) { throw 'Database setup failed' }
python backend/manage.py seed_catalog
$pythonPath = (Get-Command python).Source
Start-Process -FilePath $pythonPath -ArgumentList 'backend/manage.py runserver 127.0.0.1:8000 --noreload' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden
npm.cmd run dev
