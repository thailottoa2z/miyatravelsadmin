# IIS Deployment Guide - Frontend & Backend

## Prerequisites
- IIS installed on Windows Server
- Node.js installed on the server
- Administrator access to IIS Manager
- URL Rewrite Module for IIS (for reverse proxy)
- Application Request Routing (ARR) for IIS

## Step 1: Build the Application

### Build Frontend (React)
```powershell
npm run build
```
This creates a `dist` folder with static files.

### Build Backend
```powershell
npm run build
```
This creates the backend bundle in `dist/index.cjs`.

## Step 2: Backend Deployment (Node.js Service)

### Option A: Run as Windows Service (Recommended)

1. Install NSSM (Non-Sucking Service Manager):
```powershell
# Download from https://nssm.cc/download
# Extract and add to PATH or use full path
nssm install MiyaTravelsAdminBackend "C:\Program Files\nodejs\node.exe" "C:\path\to\app\dist\index.cjs"
```

2. Set environment variables:
```powershell
nssm set MiyaTravelsAdminBackend AppDirectory "C:\path\to\app"
nssm set MiyaTravelsAdminBackend AppEnvironmentExtra NODE_ENV=production
nssm set MiyaTravelsAdminBackend AppEnvironmentExtra DATABASE_URL=postgresql://...
nssm set MiyaTravelsAdminBackend AppEnvironmentExtra PORT=3000
```

3. Start the service:
```powershell
nssm start MiyaTravelsAdminBackend
```

### Option B: Run Standalone (Development)
Simply run Node.js with the built bundle:
```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="postgresql://..."
$env:PORT=3000
node C:\path\to\app\dist\index.cjs
```

## Step 3: Frontend Deployment (IIS Static Content)

1. **Create IIS Website**:
   - Open IIS Manager
   - Right-click "Sites" → Add Website
   - Set Physical path to: `C:\path\to\app\dist` (the build output)
   - Configure binding (e.g., `miyatravels.local` on port 80)

2. **Configure SPA Routing**:
   - Install "URL Rewrite" module in IIS
   - Create `web.config` in the `dist` folder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeType fileExtension=".js" mimeType="application/javascript" />
      <mimeType fileExtension=".mjs" mimeType="application/javascript" />
    </staticContent>
  </system.webServer>
</configuration>
```

## Step 4: Configure Reverse Proxy (Optional - If accessing backend through same domain)

If you want the frontend and backend on the same domain:

1. **Enable IIS Modules**:
   - Install "URL Rewrite" extension
   - Install "Application Request Routing" (ARR) extension

2. **Create Backend Proxy Rule**:
   - In IIS Manager, select your frontend website
   - Double-click "URL Rewrite"
   - Add Reverse Proxy Rule:
     - Pattern: `^api/(.*)$`
     - Rewrite URL: `http://localhost:3000/api/{R:1}`

3. **Alternative: Modify API calls in frontend**:
   - In `client/src/lib/api.ts`, set API base URL:
   ```typescript
   const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';
   ```

## Step 5: Environment Variables

### Backend (.env in root)
```
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_K0lzv2pTxrWZ@ep-winter-thunder-akgqsw6o.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require
PORT=3000
```

### Frontend (.env in client/)
```
VITE_API_URL=http://localhost:3000
```

## Step 6: SSL/HTTPS Configuration

1. **Obtain SSL Certificate**:
   - Get from certificate authority (Let's Encrypt, DigiCert, etc.)
   - Or use self-signed for testing

2. **Install in IIS**:
   - Import certificate to Windows Certificate Store
   - Bind to IIS website (edit binding, set HTTPS protocol)

## Step 7: Database Backup & Migrations

```powershell
# Push schema to database
npm run db:push
```

## Troubleshooting

### Backend not starting
```powershell
# Check service logs
nssm dump MiyaTravelsAdminBackend
# Check Node.js process
Get-Process node
```

### Frontend not loading
- Check IIS Application Pool settings (Allow 32-bit: False, .NET version: No Managed Code)
- Verify file permissions (IIS user needs read access)
- Check Error Logs: Event Viewer → Windows Logs → Application

### CORS Issues
If frontend and backend are on different domains, update backend CORS in `server/index.ts`:
```typescript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

## Deployment Checklist

- [ ] Build frontend: `npm run build`
- [ ] Build backend: `npm run build`
- [ ] Create IIS website for frontend
- [ ] Deploy `dist` folder to IIS
- [ ] Add `web.config` for SPA routing
- [ ] Set up Node.js as Windows Service
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Test backend API
- [ ] Test frontend and API communication
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring/logging

## Accessing the Application

- **Frontend**: `https://yourdomain.com`
- **Backend**: `https://yourdomain.com:3000` (default) or through reverse proxy
- **API**: `https://yourdomain.com/api/*` (if reverse proxy configured)
