param(
    [int]$Port = 9002,
    [string]$FileToHost = "gsaEFP.pac"
)
if (-not (Test-Path $FileToHost)) {
    Write-Host "Error: $FileToHost not found."
    exit 1
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$Port/")
$listener.Start()
Write-Host "Serving $FileToHost on port $Port"
Write-Host "Press Ctrl+C to stop."
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
       $path = $request.Url.AbsolutePath
        if ($path -eq "/") { $path = "/" + $FileToHost }		      if ($path -eq "/" + $FileToHost -and (Test-Path $FileToHost)) {
            $bytes = [System.IO.File]::ReadAllBytes($FileToHost)
            $response.ContentType = "application/x-ns-proxy-autoconfig"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Shutting down the server..."
    $listener.Stop()
}
