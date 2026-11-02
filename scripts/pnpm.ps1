# Run the project's package manager even in a fresh Windows PowerShell window.
$ErrorActionPreference = 'Stop'
$taskRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node'
$taskBundledNode = Join-Path $taskRuntime 'bin\node.exe'
$taskBundledPnpm = Join-Path $taskRuntime 'node_modules\pnpm\bin\pnpm.cjs'
if ((Test-Path -LiteralPath $taskBundledNode) -and (Test-Path -LiteralPath $taskBundledPnpm)) {
    $env:Path = "$(Join-Path $taskRuntime 'bin');$env:Path"
    & $taskBundledNode $taskBundledPnpm @args
} else {
    $taskPnpm = Get-Command pnpm -ErrorAction SilentlyContinue
    if (-not $taskPnpm) { throw 'Install Node 24 and pnpm 11.25.0, then retry.' }
    & $taskPnpm.Source @args
}
exit $LASTEXITCODE
