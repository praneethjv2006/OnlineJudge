# Production deployment

This folder runs only the API and compiler. Keep the React frontend on Cloudflare Pages.
Cloudflare Tunnel publishes the API through an outbound-only connection, so the VM has no
public web port and its origin IP is not exposed.

`compiler` has no host port and is reachable only by `backend`. The configuration adds
CPU, memory, PID, capability, filesystem, and network limits. It is still not a complete
security sandbox for hostile source code: see the main deployment guide before allowing
untrusted public submissions.

## Start

1. In Cloudflare Dashboard, open **Networking > Tunnels**, create a named tunnel, and copy
   its connector token. Add a **Published application** route with hostname `API_DOMAIN` and
   service URL `http://backend:5000`.
2. Copy `.env.example` to `.env` and enter real values, including the tunnel token.
3. From this folder run:

   ```bash
   docker compose -f compose.production.yaml up -d --build
   docker compose -f compose.production.yaml ps
   curl https://$API_DOMAIN/api/health
   ```

4. Verify the API through its public hostname. Do not publish ports 5000 or 5001 in OCI.

## Update

```bash
git pull --ff-only
docker compose -f deploy/compose.production.yaml up -d --build
```
