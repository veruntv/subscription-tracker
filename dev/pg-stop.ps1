$ErrorActionPreference = "Stop"

$pgHome = Join-Path $env:USERPROFILE "pgsql"
$pgCtl = Join-Path $pgHome "bin\pg_ctl.exe"
$pgData = Join-Path $pgHome "data"

if (-not (Test-Path $pgCtl)) {
  throw "PostgreSQL not found at $pgHome. See LOCAL.md."
}

& $pgCtl -D $pgData stop -m fast
if ($LASTEXITCODE -eq 0) {
  Write-Output "Postgres stopped"
  exit 0
}

Write-Output "Postgres was not running (or stop failed with exit $LASTEXITCODE)"
exit 0
