# TDF BotOps

TDF BotOps is a self-hostable control panel for deploying and operating multiple WhatsApp bot instances across multiple VPS servers. The included UI is intentionally provider-agnostic: it models servers, bot placement, lifecycle actions, QR/session state, resource health and activity events. The production integration point is a small backend adapter/API layer that talks to your chosen WhatsApp runtime (for example Baileys, WAHA, or a custom service).

## What is included

The panel currently ships as a responsive TDF-branded frontend with a working demo data model:

- Multi-server inventory with online, warning and offline states.
- Multiple bot deployments per server, filterable by host and searchable by name/number.
- Start, stop, restart, deploy and health-check interactions with feedback to the operator.
- QR/session connection surface for connected, reconnecting and stopped states.
- CPU, memory, SSD, uptime, bot count and process-health presentation.
- Activity event feed for deploy, connect, warning, server and security events.
- Register-server and deploy-bot dialogs that can be wired to the backend API.
- Docker image for a static production build and a Compose example.
- This runbook and an adapter contract to connect real bot runtimes securely.

> The demo UI does not connect to WhatsApp by itself. It is the operator surface. Production actions should be routed through an authenticated backend, never directly from browser code to a bot runtime.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

Create a production build locally with:

```bash
npm run build
npm run preview
```

## Deploy on a VPS with Docker

The simplest setup is a small Ubuntu 22.04/24.04 VPS with a public IPv4 address, a DNS record such as `botops.example.com`, and Docker Engine plus the Compose plugin.

### 1. Prepare the VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

Only expose 80/443 publicly. Do not expose the database or bot-adapter ports to the internet; keep them on the internal Compose network.

### 2. Copy the project and configure it

```bash
git clone https://your-git-host/tdf/tdf-botops.git
cd tdf-botops
cp .env.example .env
nano .env
```

At minimum, replace `ADAPTER_API_TOKEN` and `SESSION_ENCRYPTION_KEY` with long random values. Generate values with:

```bash
openssl rand -hex 32
```

For a real deployment, terminate HTTPS in front of the panel (Caddy or Nginx Proxy Manager) and add authentication to the backend/API. The static panel itself does not store secrets.

### 3. Start the panel

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:3000/healthz
```

The expected response is `ok`. Point your reverse proxy at `127.0.0.1:3000`.

### 4. Caddy example

Install Caddy separately or use your preferred managed reverse proxy. A minimal Caddyfile is:

```caddyfile
botops.example.com {
  reverse_proxy 127.0.0.1:3000
  encode gzip
}
```

Once DNS resolves, Caddy obtains and renews the TLS certificate automatically. Put an SSO/auth gateway or an authenticated backend in front of the panel before inviting operators.

## Updating

Use a controlled update flow so the previous container can be restored quickly:

```bash
cd /opt/tdf-botops
git fetch --all --tags
git checkout <approved-tag-or-commit>
docker compose build --pull
docker compose up -d
curl -fsS http://127.0.0.1:3000/healthz
docker image prune -f
```

Keep the last known-good tag documented. Never run `docker compose down -v` during a normal upgrade because the `-v` flag deletes named volumes.

## Backup and recovery

The static panel has no durable state. In production, the adapter/backend owns server records, encrypted credential references, session metadata, audit events and deployment definitions. Back up that service's database and its encrypted session directory.

Example PostgreSQL backup command:

```bash
mkdir -p /var/backups/tdf-botops
pg_dump "$DATABASE_URL" | gzip > "/var/backups/tdf-botops/$(date +%F).sql.gz"
```

Keep backups off the VPS, encrypt them, test a restore monthly, and retain at least 7 daily plus 4 weekly copies. Store the encryption key separately from the backup archive.

## Troubleshooting

| Symptom | Check |
|---|---|
| Page shows 502 | `docker compose ps`, `docker compose logs panel`, and `curl -i 127.0.0.1:3000/healthz` |
| Container restarts | `docker compose logs --tail=200 panel`; check disk with `df -h` and memory with `free -m` |
| HTTPS does not work | Confirm DNS A/AAAA records, firewall 80/443, and reverse-proxy logs |
| Bot is reconnecting | Check the runtime adapter health endpoint, session directory permissions, and the runtime's QR/session logs |
| Server is offline in panel | Validate the server agent's outbound connection to the adapter and rotate the agent token if needed |
| Deployment fails | Inspect the adapter's job ID and return the failed step plus a safe operator message to the panel |

## Adapter/API contract

The UI should call a backend you control. Keep `ADAPTER_API_TOKEN`, WhatsApp session material, provider keys and server SSH credentials server-side. A suggested API shape is:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/servers` | List registered VPS hosts and health/resource snapshots |
| `POST` | `/api/servers` | Register a host; return a one-time agent enrollment token |
| `GET` | `/api/servers/:serverId/bots` | List bot deployments placed on one host |
| `POST` | `/api/bots` | Create a bot deployment with `serverId`, `runtime`, and environment profile |
| `POST` | `/api/bots/:botId/actions/start` | Start the bot process |
| `POST` | `/api/bots/:botId/actions/stop` | Stop the bot process |
| `POST` | `/api/bots/:botId/actions/restart` | Restart the bot process |
| `DELETE` | `/api/bots/:botId` | Remove a bot deployment after confirmation |
| `GET` | `/api/bots/:botId/session` | Return status, health, QR state, and last-seen time; never return session secrets |
| `POST` | `/api/bots/:botId/session/qr` | Request a new QR code or pairing attempt |
| `GET` | `/api/deployments/:jobId` | Read deployment job progress and failed step details |
| `GET` | `/api/activity?query=&serverId=&botId=` | Search audit/control-plane events |

Recommended deployment response:

```json
{
  "jobId": "job_01J...",
  "status": "running",
  "steps": [
    {"id":"validate","label":"Validate server","status":"complete"},
    {"id":"pull","label":"Pull runtime image","status":"running"},
    {"id":"start","label":"Start and pair session","status":"pending"}
  ]
}
```

Recommended session response:

```json
{
  "botId": "tdf-support",
  "state": "connected",
  "health": "healthy",
  "qr": null,
  "lastSeenAt": "2026-10-16T15:00:00Z",
  "uptimeSeconds": 306000
}
```

Use short-lived operator sessions, role-based permissions, audit every state-changing action, rate-limit QR generation and deployment actions, and return safe error details. Never send SSH private keys, WhatsApp auth files, raw provider tokens or database credentials to the browser.

## Production integration checklist

1. Add a backend service for authentication, authorization, persistence and adapter calls.
2. Replace demo arrays in `src/main.jsx` with API queries and event updates (SSE/WebSocket is useful for deployment progress).
3. Map backend session/deployment states to the existing UI states: `Connected`, `Reconnecting`, and `Stopped`.
4. Encrypt credential references at rest and use per-server/per-bot scopes.
5. Add an operator confirmation step for destructive bot/server removal.
6. Add database migrations, health checks, structured logs, metrics and alerting.
7. Deploy the backend and panel behind HTTPS, then run a staging pairing test before production.
