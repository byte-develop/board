# TaskFlow Pro - Инструкция по развертыванию на Ubuntu сервере

## Требования

- Ubuntu Server 20.04+ 
- Node.js 18+ 
- PostgreSQL 14+
- Nginx (для проксирования)
- Домен с SSL сертификатом

## Подготовка сервера

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Установка PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Создание базы данных
```bash
sudo -u postgres psql

CREATE DATABASE taskflow_pro;
CREATE USER taskflow_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE taskflow_pro TO taskflow_user;
ALTER DATABASE taskflow_pro OWNER TO taskflow_user;
\q
```

### 5. Установка Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Развертывание приложения

### 1. Клонирование и подготовка проекта
```bash
# Создаем пользователя для приложения
sudo adduser taskflow
sudo usermod -aG sudo taskflow

# Переключаемся на пользователя taskflow
su taskflow
cd /home/taskflow

# Загружаем проект (замените на ваш репозиторий)
git clone YOUR_REPOSITORY_URL taskflow-pro
cd taskflow-pro

# Устанавливаем зависимости
npm install

# Собираем проект
npm run build
```

### 2. Настройка конфигурации

Создайте файл `config.json` с настройками для продакшена:

```json
{
  "server": {
    "port": 3000,
    "cors": {
      "origin": ["https://yourdomain.com"],
      "credentials": true
    }
  },
  "database": {
    "type": "postgresql",
    "ssl": true,
    "maxConnections": 20,
    "idleTimeout": 30000
  },
  "session": {
    "secret": "your-super-secure-session-secret-change-this",
    "name": "taskflow.sid",
    "maxAge": 86400000,
    "secure": true,
    "httpOnly": true,
    "sameSite": "strict"
  },
  "auth": {
    "bcryptRounds": 12,
    "tokenExpiration": "24h"
  },
  "app": {
    "name": "TaskFlow Pro",
    "description": "Smart Project Management",
    "version": "1.0.0"
  },
  "features": {
    "aiAssistant": true,
    "notifications": false,
    "analytics": true
  }
}
```

### 3. Настройка переменных окружения
```bash
# Создаем файл .env
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://taskflow_user:your_secure_password@localhost:5432/taskflow_pro
SESSION_SECRET=your-super-secure-session-secret-change-this
OPENAI_API_KEY=your-openai-api-key-if-needed
PORT=3000
EOF

chmod 600 .env
```

### 4. Миграция базы данных
```bash
# Запуск миграций Drizzle
npm run db:push
```

### 5. Настройка systemd сервиса

Создайте файл сервиса:
```bash
sudo tee /etc/systemd/system/taskflow-pro.service << EOF
[Unit]
Description=TaskFlow Pro - Smart Project Management
After=network.target

[Service]
Type=simple
User=taskflow
WorkingDirectory=/home/taskflow/taskflow-pro
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=taskflow-pro

[Install]
WantedBy=multi-user.target
EOF
```

Запуск сервиса:
```bash
sudo systemctl daemon-reload
sudo systemctl enable taskflow-pro
sudo systemctl start taskflow-pro
sudo systemctl status taskflow-pro
```

### 6. Настройка Nginx

Создайте конфигурацию Nginx:
```bash
sudo tee /etc/nginx/sites-available/taskflow-pro << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/taskflow-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Настройка SSL с Let's Encrypt

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение SSL сертификата
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Настройка автообновления сертификата
sudo crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Настройка мониторинга и логов

### 1. Логирование
```bash
# Просмотр логов приложения
sudo journalctl -u taskflow-pro -f

# Просмотр логов Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Мониторинг процесса
```bash
# Установка htop для мониторинга
sudo apt install htop -y

# Проверка статуса всех сервисов
sudo systemctl status taskflow-pro nginx postgresql
```

### 3. Настройка логротации
```bash
sudo tee /etc/logrotate.d/taskflow-pro << EOF
/var/log/syslog {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 syslog adm
    postrotate
        systemctl reload taskflow-pro
    endscript
}
EOF
```

## Безопасность

### 1. Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

### 2. PostgreSQL безопасность
```bash
# Редактируем pg_hba.conf для ограничения доступа
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Убеждаемся, что есть строка:
# local   all             taskflow_user                           md5
# local   all             all                                     peer

sudo systemctl restart postgresql
```

### 3. Обновления и резервные копии

```bash
# Создаем скрипт для резервного копирования БД
sudo tee /home/taskflow/backup.sh << EOF
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/taskflow/backups"
mkdir -p \$BACKUP_DIR

# Бэкап базы данных
pg_dump -h localhost -U taskflow_user taskflow_pro > \$BACKUP_DIR/taskflow_\$DATE.sql

# Удаляем старые бэкапы (старше 7 дней)
find \$BACKUP_DIR -name "taskflow_*.sql" -mtime +7 -delete

echo "Backup created: taskflow_\$DATE.sql"
EOF

chmod +x /home/taskflow/backup.sh

# Добавляем в crontab ежедневный бэкап
crontab -e
# Добавьте строку:
# 0 2 * * * /home/taskflow/backup.sh
```

## Обновление приложения

```bash
cd /home/taskflow/taskflow-pro

# Резервное копирование перед обновлением
/home/taskflow/backup.sh

# Получение обновлений
git pull origin main

# Установка новых зависимостей
npm install

# Перезапуск миграций если нужно
npm run db:push

# Сборка проекта
npm run build

# Перезапуск сервиса
sudo systemctl restart taskflow-pro

# Проверка статуса
sudo systemctl status taskflow-pro
```

## Устранение неисправностей

### Частые проблемы:

1. **Приложение не запускается:**
   ```bash
   sudo journalctl -u taskflow-pro -n 50
   ```

2. **Проблемы с базой данных:**
   ```bash
   sudo -u postgres psql -c "SELECT version();"
   ```

3. **Проблемы с SSL:**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

4. **Высокая нагрузка:**
   ```bash
   htop
   df -h
   ```

## Поддержка и мониторинг

- Логи приложения: `sudo journalctl -u taskflow-pro`
- Логи Nginx: `/var/log/nginx/`
- Статус сервисов: `sudo systemctl status taskflow-pro nginx postgresql`
- Мониторинг диска: `df -h`
- Мониторинг памяти: `free -h`

После успешного развертывания ваше приложение TaskFlow Pro будет доступно по адресу `https://yourdomain.com`