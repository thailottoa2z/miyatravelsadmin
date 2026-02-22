# IIS Deployment Script for Miya Travels Admin
# Run as Administrator

param(
    [Parameter(Mandatory=$false)]
    [string]$IISPath = "C:\inetpub\wwwroot\miyatravels",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendPort = 3000,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "MiyaTravelsAdminBackend"
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "Error: Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "Starting IIS Deployment for Miya Travels Admin..." -ForegroundColor Green

# Step 1: Build the Application
Write-Host "`n[Step 1] Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully!" -ForegroundColor Green

# Step 2: Create IIS deployment directory
Write-Host "`n[Step 2] Setting up IIS directory..." -ForegroundColor Yellow
if (-not (Test-Path $IISPath)) {
    New-Item -ItemType Directory -Path $IISPath -Force | Out-Null
    Write-Host "Created directory: $IISPath" -ForegroundColor Green
}

# Step 3: Copy frontend files
Write-Host "`n[Step 3] Deploying frontend..." -ForegroundColor Yellow
$frontendSource = ".\dist"
if (Test-Path $frontendSource) {
    Copy-Item -Path "$frontendSource\*" -Destination $IISPath -Recurse -Force
    Write-Host "Frontend deployed to: $IISPath" -ForegroundColor Green
} else {
    Write-Host "Frontend dist folder not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Copy web.config
Write-Host "`n[Step 4] Adding web.config for SPA routing..." -ForegroundColor Yellow
$webConfigContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Router" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_PATH}" pattern="^/api" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeType fileExtension=".js" mimeType="application/javascript" />
      <mimeType fileExtension=".mjs" mimeType="application/javascript" />
      <mimeType fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>
  </system.webServer>
</configuration>
'@

$webConfigPath = Join-Path $IISPath "web.config"
Set-Content -Path $webConfigPath -Value $webConfigContent -Force
Write-Host "web.config created at: $webConfigPath" -ForegroundColor Green

# Step 5: Prepare backend
Write-Host "`n[Step 5] Preparing backend..." -ForegroundColor Yellow
$backendPath = "C:\services\miyatravels-backend"
if (-not (Test-Path $backendPath)) {
    New-Item -ItemType Directory -Path $backendPath -Force | Out-Null
}

Copy-Item -Path ".\dist\index.cjs" -Destination "$backendPath\index.cjs" -Force
Write-Host "Backend prepared at: $backendPath" -ForegroundColor Green

# Step 6: Set up or update Windows Service
Write-Host "`n[Step 6] Configuring Node.js Windows Service..." -ForegroundColor Yellow

# Check if NSSM is available
$nssmPath = "C:\tools\nssm\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Host "NSSM not found at: $nssmPath" -ForegroundColor Yellow
    Write-Host "Download from: https://nssm.cc/download" -ForegroundColor Cyan
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "  1. Download nssm-2.24-101-g897c7ad.zip"
    Write-Host "  2. Extract to C:\tools\nssm"
    Write-Host "  3. Run this script again"
} else {
    # Stop existing service if running
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "Stopping existing service: $ServiceName" -ForegroundColor Yellow
        & $nssmPath stop $ServiceName | Out-Null
        Start-Sleep -Seconds 2
    }
    
    # Create or update service
    if ($service) {
        Write-Host "Updating service: $ServiceName" -ForegroundColor Yellow
        & $nssmPath set $ServiceName AppDirectory $backendPath | Out-Null
    } else {
        Write-Host "Creating new service: $ServiceName" -ForegroundColor Yellow
        $nodePath = (Get-Command node | Select-Object -ExpandProperty Source)
        & $nssmPath install $ServiceName $nodePath "index.cjs" | Out-Null
        & $nssmPath set $ServiceName AppDirectory $backendPath | Out-Null
    }
    
    # Set environment variables
    & $nssmPath set $ServiceName AppEnvironmentExtra NODE_ENV=production | Out-Null
    & $nssmPath set $ServiceName AppEnvironmentExtra PORT=$BackendPort | Out-Null
    
    if ($DatabaseUrl) {
        & $nssmPath set $ServiceName AppEnvironmentExtra "DATABASE_URL=$DatabaseUrl" | Out-Null
    }
    
    & $nssmPath set $ServiceName AppPriority ABOVE_NORMAL_PRIORITY_CLASS | Out-Null
    & $nssmPath set $ServiceName Start SERVICE_AUTO_START | Out-Null
    
    # Start the service
    Write-Host "Starting service: $ServiceName" -ForegroundColor Yellow
    & $nssmPath start $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    
    $serviceStatus = (Get-Service -Name $ServiceName).Status
    Write-Host "Service status: $serviceStatus" -ForegroundColor Green
}

# Step 7: Create IIS Website (if not exists)
Write-Host "`n[Step 7] Configuring IIS Website..." -ForegroundColor Yellow

Import-Module WebAdministration -ErrorAction SilentlyContinue

$siteName = "MiyaTravelsAdmin"
$site = Get-Website -Name $siteName -ErrorAction SilentlyContinue

if (-not $site) {
    Write-Host "Creating new IIS website: $siteName" -ForegroundColor Yellow
    New-Website -Name $siteName -PhysicalPath $IISPath -Port 80 | Out-Null
    Write-Host "Website created: $siteName" -ForegroundColor Green
} else {
    Write-Host "Website already exists: $siteName" -ForegroundColor Green
    # Update physical path
    Set-ItemProperty "IIS:\Sites\$siteName" -name physicalPath -value $IISPath
}

# Step 8: Configure Application Pool
Write-Host "`n[Step 8] Configuring Application Pool..." -ForegroundColor Yellow
$appPoolName = "MiyaTravelsAppPool"
$appPool = Get-IisAppPool -Name $appPoolName -ErrorAction SilentlyContinue

if (-not $appPool) {
    New-IisAppPool -Name $appPoolName | Out-Null
    Write-Host "Application Pool created: $appPoolName" -ForegroundColor Green
}

# Configure for static content
if ($site) {
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -name "managedRuntimeVersion" -value ""
    Set-ItemProperty "IIS:\Sites\$siteName" -name "applicationPool" -value $appPoolName
}

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend deployed to: $IISPath" -ForegroundColor Cyan
Write-Host "Backend service: $ServiceName" -ForegroundColor Cyan
Write-Host "Backend port: $BackendPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open IIS Manager" -ForegroundColor White
Write-Host "2. Verify website binding and SSL certificate" -ForegroundColor White
Write-Host "3. Test the application" -ForegroundColor White
Write-Host "4. Configure logs and monitoring" -ForegroundColor White
Write-Host ""
Write-Host "Frontend URL: http://localhost" -ForegroundColor Cyan
Write-Host "Backend URL: http://localhost:$BackendPort" -ForegroundColor Cyan
