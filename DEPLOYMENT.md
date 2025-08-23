# Deployment Guide

This guide covers various deployment options for the Team Scheduler app.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended)

**Pros:** Easy setup, automatic HTTPS, serverless scaling, great Next.js integration
**Cost:** Free tier available

1. **Prepare Repository:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/team-scheduler.git
git push -u origin main
```

2. **Deploy to Vercel:**
- Visit [vercel.com](https://vercel.com) and sign in
- Click "Import Project" and select your GitHub repository
- Vercel will auto-detect Next.js settings

3. **Set Environment Variables in Vercel:**
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-super-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=your-postgresql-connection-string
COMPANY_DOMAIN=yourcompany.com
```

4. **Update Google OAuth:**
- Go to Google Cloud Console → Credentials
- Add to Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
- Add to Authorized JavaScript origins: `https://your-app.vercel.app`

### Option 2: Railway

**Pros:** Simple deployment, built-in PostgreSQL, automatic HTTPS
**Cost:** $5/month minimum

1. **Connect Repository:**
- Go to [railway.app](https://railway.app)
- Connect your GitHub repository
- Railway will auto-detect and deploy

2. **Add PostgreSQL:**
- In Railway dashboard, click "Add Plugin" → "PostgreSQL"
- Copy the connection string to use as `DATABASE_URL`

3. **Set Environment Variables:**
Add all environment variables in Railway's dashboard

### Option 3: Self-hosted with Docker

**Pros:** Full control, can run anywhere, cost-effective for larger usage
**Setup Required:** More complex

1. **Prepare Environment:**
```bash
# Create production environment file
cp .env.example .env.production
# Edit .env.production with your production values
```

2. **Build and Run:**
```bash
# Build image
docker build -t team-scheduler .

# Run with environment file
docker run -d \
  --name team-scheduler \
  -p 3000:3000 \
  --env-file .env.production \
  team-scheduler
```

3. **Set up Reverse Proxy (Nginx example):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🗄️ Database Setup Options

### Option 1: Supabase PostgreSQL (Recommended)

**Pros:** Managed, free tier, automatic backups
**Cost:** Free up to 500MB

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string and use as `DATABASE_URL`

### Option 2: PlanetScale

**Pros:** Serverless MySQL (with Prisma support), branching
**Cost:** Free tier available

1. Create account at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Update Prisma schema to use MySQL:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

### Option 3: Self-hosted PostgreSQL

For production self-hosting:
```bash
# Docker PostgreSQL
docker run -d \
  --name postgres-team-scheduler \
  -e POSTGRES_DB=team_scheduler \
  -e POSTGRES_USER=scheduler \
  -e POSTGRES_PASSWORD=your-secure-password \
  -p 5432:5432 \
  postgres:15
```

## 🔐 Environment Variables Reference

### Required Variables
```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=minimum-32-character-random-string
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Optional Variables
```env
COMPANY_DOMAIN=yourcompany.com  # Filter users by email domain
NODE_ENV=production
```

### Generating NEXTAUTH_SECRET
```bash
# Generate a secure secret
openssl rand -base64 32
```

## 🌐 Domain Setup

### Custom Domain on Vercel
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed
4. Update `NEXTAUTH_URL` to use your custom domain

### SSL Certificate
Most platforms (Vercel, Railway) handle SSL automatically. For self-hosting:

```bash
# Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com
```

## 📊 Production Optimizations

### 1. Database Connection Pooling
For high traffic, use connection pooling:

```env
# PgBouncer example
DATABASE_URL="postgresql://user:pass@pgbouncer-host:6543/dbname?pgbouncer=true"
```

### 2. Caching
Add Redis for session storage (optional):

```typescript
// In lib/auth.ts
import { RedisAdapter } from "@next-auth/redis-adapter"
import { Redis } from "ioredis"

const redis = new Redis(process.env.REDIS_URL)

export const authOptions = {
  adapter: RedisAdapter(redis),
  // ... other options
}
```

### 3. Monitoring
Add error tracking:

```bash
npm install @sentry/nextjs
```

### 4. Performance
- Enable Next.js image optimization
- Use CDN for static assets
- Enable gzip compression

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🧪 Pre-deployment Checklist

- [ ] Environment variables set correctly
- [ ] Google OAuth configured with production URLs
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] SSL certificate configured
- [ ] Domain DNS configured
- [ ] Error monitoring set up (optional)
- [ ] Backup strategy in place
- [ ] Test authentication flow
- [ ] Test calendar integration
- [ ] Test meeting creation

## 🚨 Security Considerations

### Production Security Checklist
- [ ] Use HTTPS everywhere
- [ ] Set secure `NEXTAUTH_SECRET`
- [ ] Configure proper CORS if needed
- [ ] Limit OAuth redirect URIs to your domain only
- [ ] Use environment variables, never hardcode secrets
- [ ] Enable database SSL if available
- [ ] Regular security updates for dependencies

### Backup Strategy
1. **Database backups** (automatic with managed services)
2. **Environment variable backup** (store securely)
3. **Google OAuth credentials backup** (save in password manager)

## 📈 Scaling Considerations

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add connection pooling

### Horizontal Scaling
- Multiple app instances behind load balancer
- Database read replicas
- Cache layer (Redis)

## 🔧 Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor error rates
- Review database usage
- Check Google API quota
- Rotate secrets annually

### Monitoring
Key metrics to track:
- Response times
- Error rates  
- Database connection usage
- Google API quota usage
- User authentication success rates

---

**Need help with deployment? Check the troubleshooting section in the main README or open an issue on GitHub.**