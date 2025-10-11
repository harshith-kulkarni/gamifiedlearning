# MongoDB Atlas Setup Guide

This guide walks you through setting up MongoDB Atlas for StudyMaster AI.

## Prerequisites

- Email address for Atlas account
- No credit card required for M0 free tier

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Sign up with your email address
4. Verify your email address
5. Complete the welcome questionnaire (optional)

### 2. Create M0 Free Tier Cluster

1. Click "Create a New Cluster" or "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. **Cloud Provider & Region**: Choose the region closest to your users for best performance
   - AWS: us-east-1 (N. Virginia) or eu-west-1 (Ireland)
   - Google Cloud: us-central1 (Iowa) or europe-west1 (Belgium)
   - Azure: East US or West Europe
4. **Cluster Name**: `studymaster-cluster` (or your preference)
5. Click "Create Cluster"
6. Wait 1-3 minutes for cluster creation

### 3. Configure Network Access

1. In the Atlas dashboard, click "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (this adds 0.0.0.0/0)
   - **Note**: This is for hackathon flexibility. In production, restrict to specific IPs
4. Click "Confirm"

### 4. Create Database User

1. Click "Database Access" in the left sidebar
2. Click "Add New Database User"
3. **Authentication Method**: Password
4. **Username**: `studymaster-user` (or your preference)
5. **Password**: Click "Autogenerate Secure Password" and save it securely
6. **Database User Privileges**: Select "Read and write to any database"
7. Click "Add User"

### 5. Get Connection String

1. Go back to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. **Driver**: Node.js
4. **Version**: 4.1 or later
5. Copy the connection string (it will look like this):
   ```
   mongodb+srv://studymaster-user:<password>@studymaster-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 6. Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://studymaster-user:YOUR_PASSWORD@studymaster-cluster.xxxxx.mongodb.net/studymaster?retryWrites=true&w=majority
   NEXTAUTH_SECRET=your-super-secret-key-change-this
   NEXTAUTH_URL=http://localhost:3000
   GEMINI_API_KEY=your-gemini-api-key
   ```
3. Replace `YOUR_PASSWORD` with the password you generated
4. Replace `xxxxx` with your actual cluster identifier
5. Add `/studymaster` before the `?` to specify the database name

## Verification

Test your connection by running:

```bash
npm run dev
```

Look for the console message: "✅ Connected to MongoDB Atlas"

## Atlas Free Tier Specifications

- **Storage**: 512MB
- **RAM**: Shared
- **Connections**: 100 concurrent
- **Backup**: Automatic (7-day retention)
- **Regions**: Multiple options available
- **Cost**: $0 forever

## Security Best Practices

1. **Network Access**: In production, restrict IP access to your server IPs only
2. **Database Users**: Create separate users for different environments
3. **Connection String**: Never commit connection strings to version control
4. **Password Rotation**: Regularly update database user passwords

## Troubleshooting

### Connection Issues

1. **Check IP Whitelist**: Ensure 0.0.0.0/0 is added to Network Access
2. **Verify Credentials**: Double-check username and password in connection string
3. **Database Name**: Ensure `/studymaster` is added to the connection string
4. **Firewall**: Check if your network blocks MongoDB ports (27017)

### Common Errors

- **Authentication failed**: Check username/password in connection string
- **Connection timeout**: Verify network access settings
- **Database not found**: Ensure database name is specified in connection string

## Next Steps

After successful setup:

1. Run the application to verify connection
2. Test user registration and data storage
3. Monitor Atlas dashboard for connection and storage usage
4. Set up alerts for approaching free tier limits

## Scaling Considerations

When you outgrow the free tier:

- **M2 Cluster**: $9/month, 2GB storage, dedicated resources
- **M5 Cluster**: $25/month, 5GB storage, better performance
- **Automatic Scaling**: Atlas can auto-scale based on usage patterns

## Support Resources

- [Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [Community Forums](https://community.mongodb.com/)
- [Atlas Status Page](https://status.cloud.mongodb.com/)