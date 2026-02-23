# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Verify your email

## Step 2: Create a Cluster

1. Click **Create Deployment**
2. Choose **"M0 Free"** tier (no credit card required)
3. Select a cloud provider (AWS, Google Cloud, Azure) and region
4. Name your cluster (e.g., `miyatravels-cluster`)
5. Click **Create Deployment**

Wait 5-10 minutes for the cluster to be created.

## Step 3: Create Database User

1. In the MongoDB Atlas dashboard, go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Enter credentials:
   - Username: `miyaadmin` (or your preferred username)
   - Password: Generate a strong password
4. Grant permissions: **Read and write to any database**
5. Click **Add User**

## Step 4: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. For development: Click **Allow access from anywhere** (0.0.0.0/0)
4. For production: Add specific IP addresses only
5. Click **Confirm**

## Step 5: Get Connection String

1. Go to **Databases** (left sidebar)
2. Click **Connect** button on your cluster
3. Choose **Drivers** → **Node.js**
4. Copy the connection string

Example format:
```
mongodb+srv://miyaadmin:your_password@miyatravels-cluster.xxxxx.mongodb.net/miyatravels?retryWrites=true&w=majority
```

## Step 6: Update Environment Variables

Replace `username` and `password` in `.env`:

```env
MONGODB_URI=mongodb+srv://miyaadmin:YOUR_PASSWORD@miyatravels-cluster.xxxxx.mongodb.net/miyatravels?retryWrites=true&w=majority
```

Make sure to:
- Replace `YOUR_PASSWORD` with the actual password
- Replace `xxxxx` with your cluster name from the connection string
- Keep `?retryWrites=true&w=majority` at the end

## Step 7: Test Connection

Run the app to verify the MongoDB connection:

```powershell
npm run dev
```

If successful, you should see:
```
✓ MongoDB connected successfully
```

## Troubleshooting

### Connection Error: "Authentication failed"
- Check username and password in connection string
- Verify IP whitelist allows your current IP

### Connection Error: "ENOTFOUND"
- Check if cluster name is correct in connection string
- Verify internet connection

### Slow Connection
- Check MongoDB Atlas cluster status
- Try using a region closer to your application
- Upgrade to a higher tier if needed

## Production Checklist

- [ ] Use strong password (20+ characters, special characters)
- [ ] Restrict IP whitelist to specific servers
- [ ] Enable SSL/TLS encryption
- [ ] Set up automated backups in Atlas
- [ ] Monitor cluster performance in Atlas dashboard
- [ ] Use connection pooling (already configured in code)

## Free Tier Limits

- **Storage**: 512 MB per database
- **Connections**: Up to 100 simultaneous connections
- **Performance**: Shared infrastructure
- **Backups**: 7-day automated backups

When you exceed limits, upgrade to a paid cluster.
