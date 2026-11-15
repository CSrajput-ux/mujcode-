# MujCode API Load Balancer

This Render service round-robins HTTP requests between the two backend URLs in
`API_BACKENDS`. Socket.IO requests are pinned to a backend by client IP so
polling handshakes remain on the same instance.

## Deploy on Render

1. In Render, create a Blueprint from this repository and set its Blueprint file
   path to `load-balancer/render.yaml`.
2. Deploy `mujcode-api-lb`. Use the public URL shown in Render; the expected URL
   for this service name is `https://mujcode-api-lb.onrender.com`.
3. Confirm the Render health check at `/healthz` passes. This endpoint confirms
   that the proxy process is running; it does not check the backend services.
4. In Vercel, set `VITE_API_URL` to the load balancer's public URL and redeploy.
   Remove `VITE_BACKEND_URL`; the frontend uses only `VITE_API_URL`.
5. If GitHub Actions has a `VITE_API_URL` secret, set it to the same load
   balancer URL.

## Required shared backend settings

Both backend services must use the same:

- `POSTGRES_URI`
- `REDIS_URI`
- `TOKEN_SECRET`
- `CORS_ORIGIN` values, including the production frontend origin
- Cloudinary credentials for shared uploads

Do not use local `uploads/` storage with multiple backend instances.
Environment files such as `frontend/.env.production` are intentionally ignored
by Git; set production values in Render and Vercel dashboards.

The backend currently allows `https://mujcode.in` and
`https://www.mujcode.in`. If the Vercel `*.vercel.app` URL is also used, add
that exact origin to `CORS_ORIGIN` on both backends.

## Production verification

After deployment, run these checks in PowerShell, replacing the load balancer
URL with the actual URL shown in Render:

```powershell
Invoke-RestMethod https://mujcode-api-lb.onrender.com/healthz
Invoke-RestMethod https://mujcode-1.onrender.com/health/ready
Invoke-RestMethod https://mujcode-2.onrender.com/health/ready
```

Then verify that:

- Both backend readiness requests return HTTP 200.
- The production frontend can log in, sign up, and upload a file.
- Live classroom Socket.IO connects with an authenticated user and uses the
  WebSocket transport.
- The Vercel production build uses the load balancer URL, not either backend
  URL directly.

The Blueprint uses Render's free plan, which can spin down while idle. For
production traffic, select an always-on plan for the load balancer and both
backend services.
