# Checklist Fase 6 — Staging, Deploy & Launch

## Infrastruktur (Docker)
- [x] `web.Dockerfile` (Multi-stage, standalone mode)
- [x] `api.Dockerfile` (Multi-stage, dist mode)
- [x] `docker-compose.prod.yml` (Web, API, DB, Redis, Nginx)
- [ ] Berhasil running `docker compose up --build` lokal (simulasi prod)

## Network & Security (NGINX)
- [x] `nginx.prod.conf` (SSL, Wildcard subdomains, Rate limiting)
- [x] `nginx.staging.conf` (HTTP testing)
- [ ] Subdomain wildcard `*.domain.com` sudah diarahkan ke IP Server
- [ ] SSL Certificate valid untuk domain utama dan wildcard

## CI/CD
- [x] `.github/workflows/deploy.yml` tersedia
- [ ] GitHub Secrets sudah diisi:
  - `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`
  - `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`
  - `GITHUB_TOKEN` (otomatis)

## Environment
- [x] `.env.production.example` tersedia
- [x] `.env.staging.example` tersedia
- [ ] File `.env.production` di server sudah terisi nilai aslinya

## Scripting
- [x] `setup-server.sh` (Auto install docker, ufw, swap)
- [x] `setup-ssl.sh` (Certbot wildcard)

---
🚀 **Semua file deployment sudah siap.** 
Langkah terakhir adalah menjalankan `setup-server.sh` di VPS baru Anda dan melakukan push pertama ke branch `main`.
