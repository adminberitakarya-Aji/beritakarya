#!/bin/bash

# 🧪 Staging Environment Verification Script
# Purpose: Verify .env.production, backup script, and nginx config before deployment
# Usage: ./verify-staging-env.sh

set -e  # Exit on any error

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"
COLOR_BLUE="\033[34m"

echo -e "${COLOR_BLUE}======================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}Staging Environment Verification${COLOR_RESET}"
echo -e "${COLOR_BLUE}======================================${COLOR_RESET}\n"

# Variables
ENV_FILE="/opt/beritakarya/.env.production"
PROJECT_DIR="/opt/beritakarya"
BACKUP_SCRIPT="$PROJECT_DIR/infra/scripts/backup-database.sh"
NGINX_CONF="/etc/nginx/nginx.conf"
VERIFY_PASSED=true

# Function to print status
print_status() {
  local status=$1
  local message=$2
  if [ "$status" = "PASS" ]; then
    echo -e "${COLOR_GREEN}✓ PASS${COLOR_RESET} - $message"
  else
    echo -e "${COLOR_RED}✗ FAIL${COLOR_RESET} - $message"
    VERIFY_PASSED=false
  fi
}

print_info() {
  echo -e "${COLOR_BLUE}ℹ INFO${COLOR_RESET} - $1"
}

print_warn() {
  echo -e "${COLOR_YELLOW}⚠ WARN${COLOR_RESET} - $1"
}

# ============================================
# 1. Check .env.production
# ============================================
echo -e "\n${COLOR_BLUE}[1/3] Verifying .env.production${COLOR_RESET}"
echo "File: $ENV_FILE\n"

if [ ! -f "$ENV_FILE" ]; then
  print_status FAIL ".env.production file not found!"
  exit 1
fi

print_status PASS ".env.production file exists"

# Check required variables
REQUIRED_VARS=(
  "POSTGRES_USER"
  "POSTGRES_PASSWORD"
  "POSTGRES_DB"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "API_URL"
  "NODE_ENV"
  "PORT"
  "REDIS_URL"
)

# Optional variables (warn if missing)
OPTIONAL_VARS=(
  "MEILISEARCH_URL"
  "OPENAI_API_KEY"
  "SMTP_HOST"
  "SMTP_PORT"
  "SMTP_USER"
  "SMTP_PASS"
)

for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^${var}=" "$ENV_FILE"; then
    value=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ')
    if [ -z "$value" ]; then
      print_status FAIL "$var is empty"
    else
      # Check if value is placeholder
      if [[ "$value" == *"ganti"* ]] || [[ "$value" == *"your_password"* ]] || [[ "$value" == *"example"* ]]; then
        print_status FAIL "$var contains placeholder value"
      else
        print_status PASS "$var is set"
      fi
    fi
  else
    print_status FAIL "$var not found"
  fi
done

# Check JWT_SECRET length
JWT_SECRET_VALUE=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ')
if [ ${#JWT_SECRET_VALUE} -lt 32 ]; then
  print_status FAIL "JWT_SECRET too short (${#JWT_SECRET_VALUE} chars, need min 32)"
else
  print_status PASS "JWT_SECRET length OK (${#JWT_SECRET_VALUE} chars)"
fi

# Warn about optional variables
echo -e "\n${COLOR_YELLOW}Optional variables check:${COLOR_RESET}"
for var in "${OPTIONAL_VARS[@]}"; do
  if grep -q "^${var}=" "$ENV_FILE"; then
    value=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ')
    if [ -n "$value" ] && ! [[ "$value" =~ ^(ganti|your_password|example|CHANGE_ME) ]]; then
      print_status PASS "$var is configured"
    else
      print_warn "$var has placeholder or empty value"
    fi
  else
    print_warn "$var not set (optional)"
  fi
done

# ============================================
# 2. Test Backup Script
# ============================================
echo -e "\n${COLOR_BLUE}[2/3] Testing Backup Script${COLOR_RESET}"
echo "Script: $BACKUP_SCRIPT\n"

if [ ! -f "$BACKUP_SCRIPT" ]; then
  print_status FAIL "Backup script not found!"
else
  print_status PASS "Backup script exists"
fi

# Check executable
if [ -x "$BACKUP_SCRIPT" ]; then
  print_status PASS "Backup script is executable"
else
  print_warn "Backup script not executable, making it executable..."
  chmod +x "$BACKUP_SCRIPT"
  print_status PASS "Backup script is now executable"
fi

# Test run backup (dry-run mode if supported, otherwise just check syntax)
print_info "Checking backup script syntax..."
if bash -n "$BACKUP_SCRIPT"; then
  print_status PASS "Backup script syntax valid"
else
  print_status FAIL "Backup script has syntax errors"
fi

# Check backup directory configuration
print_info "Checking backup directory in script..."
BACKUP_DIR=$(grep -E "^BACKUP_DIR=" "$BACKUP_SCRIPT" | head -1 | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
if [ -n "$BACKUP_DIR" ]; then
  print_status PASS "Backup directory configured: $BACKUP_DIR"
  
  # Check if backup dir exists
  if [ -d "$BACKUP_DIR" ]; then
    print_status PASS "Backup directory exists"
  else
    print_warn "Backup directory does not exist, will be created on first run"
  fi
else
  print_warn "Backup directory not explicitly set in script"
fi

# Check PostgreSQL credentials in backup script
PGUSER=$(grep -E "^PGUSER=" "$BACKUP_SCRIPT" | head -1 | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
PGDATABASE=$(grep -E "^PGDATABASE=" "$BACKUP_SCRIPT" | head -1 | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")

if [ -n "$PGUSER" ] && [ -n "$PGDATABASE" ]; then
  print_status PASS "Database credentials in backup script: $PGUSER/$PGDATABASE"
else
  print_warn "Database credentials not found in backup script (may use environment)"
fi

# Check cron job (optional)
print_info "Checking cron job..."
CRON_EXISTS=$(crontab -l 2>/dev/null | grep -i "$BACKUP_SCRIPT" || true)
if [ -n "$CRON_EXISTS" ]; then
  print_status PASS "Cron job configured"
  echo -e "  ${COLOR_BLUE}Cron entry:${COLOR_RESET} $CRON_EXISTS"
else
  print_warn "No cron job found for backup script"
  echo -e "  ${COLOR_YELLOW}Suggestion: Add cron job for daily backups${COLOR_RESET}"
fi

# ============================================
# 3. Check Nginx Configuration (Staging)
# ============================================
echo -e "\n${COLOR_BLUE}[3/3] Checking Nginx Configuration${COLOR_RESET}"
echo "Config: $NGINX_CONF\n"

if [ ! -f "$NGINX_CONF" ]; then
  print_status FAIL "Nginx config not found at $NGINX_CONF"
else
  print_status PASS "Nginx config exists"
fi

# Test nginx config syntax
if command -v nginx &> /dev/null; then
  print_info "Testing nginx configuration syntax..."
  if nginx -t 2>&1 | grep -q "syntax is okay"; then
    print_status PASS "Nginx syntax OK"
  else
    print_status FAIL "Nginx config has syntax errors"
    nginx -t
  fi
else
  print_warn "Nginx not installed on this system (skipping syntax test)"
fi

# Check for X-Site-ID header in staging config
if grep -q "X-Site-ID" "$NGINX_CONF"; then
  print_status PASS "X-Site-ID header configured in nginx"
  
  # Show the relevant lines
  echo -e "  ${COLOR_BLUE}Configuration:${COLOR_RESET}"
  grep -A 2 -B 2 "X-Site-ID" "$NGINX_CONF" | sed 's/^/    /'
else
  print_status FAIL "X-Site-ID header not found in nginx config!"
fi

# ============================================
# Summary
# ============================================
echo -e "\n${COLOR_BLUE}======================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}Verification Summary${COLOR_RESET}"
echo -e "${COLOR_BLUE}======================================${COLOR_RESET}\n"

if [ "$VERIFY_PASSED" = true ]; then
  echo -e "${COLOR_GREEN}✓ All checks passed!${COLOR_RESET}"
  echo -e "${COLOR_GREEN}Staging environment is ready for deployment.${COLOR_RESET}\n"
  exit 0
else
  echo -e "${COLOR_RED}✗ Some checks failed.${COLOR_RESET}"
  echo -e "${COLOR_RED}Please fix the issues above before deployment.${COLOR_RESET}\n"
  exit 1
fi