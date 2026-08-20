$ErrorActionPreference = "Stop"

$pgHome = Join-Path $env:USERPROFILE "pgsql"
$pgBin = Join-Path $pgHome "bin"
$pgData = Join-Path $pgHome "data"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"
$pgReady = Join-Path $pgBin "pg_isready.exe"
$log = Join-Path $pgHome "postgres.log"

if (-not (Test-Path $pgCtl)) {
  throw "PostgreSQL not found at $pgHome. See LOCAL.md."
}

& $pgReady -h 127.0.0.1 -p 5432 | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Output "Postgres already running on 127.0.0.1:5432"
  exit 0
}

# Start via WMI so the server outlives the parent shell / job object.
$cmd = "`"$pgCtl`" -D `"$pgData`" -l `"$log`" start"
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine = $cmd
}
if ($result.ReturnValue -ne 0) {
  throw "Failed to start Postgres (WMI return $($result.ReturnValue)). Last log lines:`n$(Get-Content $log -Tail 40 -ErrorAction SilentlyContinue)"
}

for ($i = 0; $i -lt 20; $i++) {
  & $pgReady -h 127.0.0.1 -p 5432 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Output "Postgres ready on 127.0.0.1:5432"
    exit 0
  }
  Start-Sleep -Seconds 1
}

throw "Postgres did not become ready. Last log lines:`n$(Get-Content $log -Tail 40 -ErrorAction SilentlyContinue)"
