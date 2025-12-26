# CafeApp (MVP)

## Run on your Windows laptop

1. Open PowerShell
2. Run:
   - `cd C:\Users\Acer\Desktop\WEB_DEV\CafeApp`
   - `npm start`
3. Open in Chrome on the laptop:
   - `http://localhost:3000/`

## Open on iPhone (same Wi‑Fi)

1. Make sure the iPhone and the laptop are on the **same Wi‑Fi**.
2. Find the laptop's Wi‑Fi IPv4 (example from this PC): `192.168.1.163`
3. On the iPhone Safari/Chrome open:
   - `http://192.168.1.163:3000/`

## If iPhone cannot connect

- When Windows asks about **allowing Node.js through Firewall**, click **Allow** (Private networks).
- Or create a firewall rule (PowerShell as Admin):
  - `New-NetFirewallRule -DisplayName "CafeApp Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private`

## Login passcodes (MVP)

- Waiter/Customer: `1111`
- Kitchen: `2222`

> Note: Orders are stored in memory; restarting the server clears them.
