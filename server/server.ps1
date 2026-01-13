# ============================================
# SERVER.PS1 - Local TUI Dev Tool Backend
# Port: 2501
# ============================================

$port = 2501
$root = "d:\Dev\Web\local-tool-tui"
$frontend = "$root\frontend"
$dataDir = "$root\data"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "🐙 TUI Server is running on http://localhost:$port"
Write-Host "   Styles: Jules Google Scheme"
Write-Host "   Press Ctrl+C to stop."

function Get-MimeType($path) {
    switch ([System.IO.Path]::GetExtension($path)) {
        ".html" { return "text/html" }
        ".css" { return "text/css" }
        ".js" { return "application/javascript" }
        ".json" { return "application/json" }
        ".ttf" { return "font/ttf" }
        default { return "application/octet-stream" }
    }
}

function Send-Response($context, $content, $contentType, $statusCode = 200) {
    if ($content -is [string]) {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
    }
    else {
        $buffer = $content
    }
    
    $context.Response.ContentLength64 = $buffer.Length
    $context.Response.ContentType = "$contentType; charset=utf-8"
    $context.Response.StatusCode = $statusCode
    $context.Response.AddHeader("Access-Control-Allow-Origin", "*")
    
    try {
        $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    finally {
        $context.Response.OutputStream.Close()
        $context.Response.Close()
    }
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $url = $request.Url.LocalPath.ToLower()
    $method = $request.HttpMethod

    Write-Host "[$method] $url" -ForegroundColor Cyan

    try {
        # === STATIC FILES ===
        if (-not $url.StartsWith("/api")) {
            $filePath = "$frontend$url"
            if ($url -eq "/") { $filePath = "$frontend\index.html" }

            if (Test-Path $filePath) {
                # Read binary for fonts/images, text for code
                if ($filePath.EndsWith(".ttf")) {
                    $content = [System.IO.File]::ReadAllBytes($filePath)
                    Send-Response $context $content (Get-MimeType $filePath)
                }
                else {
                    $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
                    Send-Response $context $content (Get-MimeType $filePath)
                }
            }
            else {
                Send-Response $context "File Not Found" "text/plain" 404
            }
            continue
        }

        # === API HANDLERS ===
        
        # 1. GET /api/tasks
        if ($method -eq "GET" -and $url -eq "/api/tasks") {
            if (-not (Test-Path "$dataDir\tasks.json")) { 
                [System.IO.File]::WriteAllText("$dataDir\tasks.json", "{`"tasks`":[]}", [System.Text.Encoding]::UTF8)
            }
            $json = [System.IO.File]::ReadAllText("$dataDir\tasks.json", [System.Text.Encoding]::UTF8)
            Send-Response $context $json "application/json"
        }

        # 2. POST /api/tasks
        elseif ($method -eq "POST" -and $url -eq "/api/tasks") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            [System.IO.File]::WriteAllText("$dataDir\tasks.json", $body, [System.Text.Encoding]::UTF8)
            Send-Response $context "{`"status`":`"saved`"}" "application/json"
        }

        # === LINKS API ===
        
        # 3. GET /api/links
        elseif ($method -eq "GET" -and $url -eq "/api/links") {
            if (-not (Test-Path "$dataDir\links.json")) { 
                [System.IO.File]::WriteAllText("$dataDir\links.json", "{`"groups`":[]}", [System.Text.Encoding]::UTF8)
            }
            $json = [System.IO.File]::ReadAllText("$dataDir\links.json", [System.Text.Encoding]::UTF8)
            Send-Response $context $json "application/json"
        }

        # 4. POST /api/links
        elseif ($method -eq "POST" -and $url -eq "/api/links") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            [System.IO.File]::WriteAllText("$dataDir\links.json", $body, [System.Text.Encoding]::UTF8)
            Send-Response $context "{`"status`":`"saved`"}" "application/json"
        }

        # 5. POST /api/links/open - Open file/folder/app
        elseif ($method -eq "POST" -and $url -eq "/api/links/open") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd() | ConvertFrom-Json
            
            try {
                if ($body.type -eq "folder") {
                    explorer.exe $body.path
                }
                elseif ($body.type -eq "file") {
                    Invoke-Item $body.path
                }
                elseif ($body.type -eq "app") {
                    Start-Process $body.path
                }
                Send-Response $context "{`"status`":`"opened`"}" "application/json"
            }
            catch {
                Send-Response $context "{`"error`":`"Failed to open: $_`"}" "application/json" 500
            }
        }

        # === REMINDERS API ===
        elseif ($method -eq "GET" -and $url -eq "/api/reminders") {
            if (-not (Test-Path "$dataDir\reminders.json")) { 
                 [System.IO.File]::WriteAllText("$dataDir\reminders.json", "{`"reminders`":[]}", [System.Text.Encoding]::UTF8)
            }
            $json = [System.IO.File]::ReadAllText("$dataDir\reminders.json", [System.Text.Encoding]::UTF8)
            Send-Response $context $json "application/json"
        }
        elseif ($method -eq "POST" -and $url -eq "/api/reminders") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            [System.IO.File]::WriteAllText("$dataDir\reminders.json", $body, [System.Text.Encoding]::UTF8)
            Send-Response $context "{`"status`":`"saved`"}" "application/json"
        }

        # === AUTOMATION API ===
        elseif ($method -eq "GET" -and $url -eq "/api/automation") {
             if (-not (Test-Path "$dataDir\automation.json")) { 
                 [System.IO.File]::WriteAllText("$dataDir\automation.json", "{`"presets`":[]}", [System.Text.Encoding]::UTF8)
            }
            $json = [System.IO.File]::ReadAllText("$dataDir\automation.json", [System.Text.Encoding]::UTF8)
            Send-Response $context $json "application/json"
        }
        elseif ($method -eq "POST" -and $url -eq "/api/automation") {
             $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            [System.IO.File]::WriteAllText("$dataDir\automation.json", $body, [System.Text.Encoding]::UTF8)
            Send-Response $context "{`"status`":`"saved`"}" "application/json"
        }
        elseif ($method -eq "POST" -and $url -eq "/api/automation/run") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $req = $reader.ReadToEnd() | ConvertFrom-Json
            
            $json = [System.IO.File]::ReadAllText("$dataDir\automation.json", [System.Text.Encoding]::UTF8) | ConvertFrom-Json
            $preset = $json.presets | Where-Object { $_.id -eq $req.id }

            if ($preset) {
                foreach ($act in $preset.actions) {
                    if ($act.type -eq "open-app") { Start-Process $act.path }
                    elseif ($act.type -eq "open-folder") { explorer.exe $act.path }
                    elseif ($act.type -eq "shutdown") { Write-Host "Shutdown simulated" }
                }
                Send-Response $context "{`"status`":`"executed`"}" "application/json"
            } else {
                Send-Response $context "{`"error`":`"Preset not found`"}" "application/json" 404
            }
        }

    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Send-Response $context "{`"error`":`"Internal Server Error`"}" "application/json" 500
    }
}
