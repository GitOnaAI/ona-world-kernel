# Deploying Eastbrook Vale on AWS

> **Levy Street production** is deployed via Ansible, not this document:
> the `eastbrook_game` role in the internal `ansible-scripts` repo runs
> the stack on `idyllic-games-prod` behind nginx + certbot at
> https://worldofclaudecraft.com. Re-running
> `ansible-playbook playbooks/setup_server.yml -e target_host=idyllic-games-prod`
> pulls and redeploys. The guide below is the generic, standalone path.

One EC2 instance runs everything: the game server, Postgres, and Caddy
(TLS reverse proxy). Sized for a small population — a `t4g.small`
(~$14/month all-in) is comfortable for a handful of concurrent players.

## 1. Create a GitHub token (the repo is private)

The instance clones the repo on first boot, so it needs a read-only token:

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token
2. Resource owner: **levy-street** · Repository access: **Only select repositories** → `world-of-claudecraft`
3. Permissions: **Contents → Read-only** (nothing else)
4. Expiration: your call — it's only needed at boot and for `git pull` on updates

## 2. Launch the instance

In the EC2 console:

| Setting | Value |
|---|---|
| AMI | Ubuntu Server 24.04 LTS (**arm64**) |
| Instance type | `t4g.small` (2 vCPU Graviton, 2 GB) |
| Storage | 20 GB gp3 |
| Security group | Inbound: **22** (your IP only), **80**, **443** — nothing else |
| User data | Paste `deploy/user-data.sh` with `DOMAIN` and `GITHUB_TOKEN` filled in |

Leave `DOMAIN=""` if you want to test by IP first over plain HTTP —
you can set the domain later (step 4).

Allocate an **Elastic IP** and associate it with the instance so the
address survives restarts.

The game server and Postgres bind to loopback only (`127.0.0.1:8787` /
`127.0.0.1:5433`); Caddy is the sole public entrance, so the security
group above is the whole exposure story.

First boot takes a few minutes (Docker image build). Watch it with:

```bash
ssh ubuntu@<elastic-ip> sudo tail -f /var/log/eastbrook-setup.log
```

## 3. Point DNS at it

Create an **A record** for your domain (e.g. `play.example.com`) pointing
at the Elastic IP. In Route 53: Hosted zone → Create record → A →
the Elastic IP.

## 4. Turn on TLS (if you started without a domain)

```bash
ssh ubuntu@<elastic-ip>
echo 'play.example.com {
	reverse_proxy localhost:8787
	encode gzip
}' | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy fetches and renews the Let's Encrypt certificate automatically;
WebSockets are proxied with no extra config, and the client auto-selects
`wss://` on https pages. Open `https://play.example.com` and you're live.

## Updating the game

```bash
ssh ubuntu@<elastic-ip>
cd /opt/eastbrook
sudo git pull
sudo docker compose up -d --build
```

Players online during the restart are disconnected for a few seconds and
can log straight back in; the server saves all characters on shutdown.

## Backups

A nightly `pg_dump` runs at 03:15 UTC via `/etc/cron.d/eastbrook-backup`,
writing gzipped dumps to `/var/backups/eastbrook/` and keeping 14 days.

Restore (stack must be up):

```bash
gunzip -c /var/backups/eastbrook/eastbrook-2026-06-10.sql.gz \
  | sudo docker exec -i eastbrook-db psql -U eastbrook eastbrook
```

For off-box safety, sync the directory to S3 occasionally:
`aws s3 sync /var/backups/eastbrook s3://your-bucket/eastbrook/`.

## Operational notes

- **Secrets**: the Postgres password is generated at first boot into
  `/opt/eastbrook/.env` (mode 600, gitignored). Nothing else to manage.
- **Never** set `ALLOW_DEV_COMMANDS=1` in production — it enables the
  level/teleport cheats used by the test bots.
- Health check: `curl -s localhost:8787/api/status` on the box returns
  `{"ok":true,"players_online":N,...}`.
- Logs: `sudo docker compose -f /opt/eastbrook/docker-compose.yml logs -f game`.
- If the instance ever feels tight, stop → change instance type →
  start. Everything lives in Docker plus one EBS volume, so nothing
  else changes.
