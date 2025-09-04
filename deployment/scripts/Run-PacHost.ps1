# Simple PowerShell web server for PAC file
# Run: powershell -ExecutionPolicy Bypass -File .\Run-PacHost.ps1
# configure your tenant ID first!
$tenantId = ""

$workingDir = [System.IO.Path]::GetTempPath()
Set-Location $workingDir
if ($tenantId -eq ""){
    Write-Host "Please set your tenant ID in the script."
    exit
}
Invoke-WebRequest -Uri "https://pac.azureidentity.us/$tenantId" -OutFile "$workingDir\proxy.pac"
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://+:8001/")
$listener.Start()
Write-Host "Serving files from $PWD on http://localhost:8001/ (Ctrl+C to stop)"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request  = $context.Request
    $response = $context.Response

    $path = Join-Path $PWD $request.Url.LocalPath.TrimStart('/')

    if (Test-Path $path) {
        $bytes = [IO.File]::ReadAllBytes($path)

        if ($path -like "*.pac") {
            $response.ContentType = "application/x-ns-proxy-autoconfig"
        } else {
            $response.ContentType = "application/octet-stream"
        }

        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $msg = "Not found"
        $bytes = [Text.Encoding]::UTF8.GetBytes($msg)
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $response.Close()
}
