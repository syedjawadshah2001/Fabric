# KAHLID FABRIC

An original React storefront with a Django commerce service. The brand spelling follows the request: **KAHLID FABRIC**.

## What is implemented
- Responsive editorial storefront, collection search/filter/sort, product details and size guide.
- Device-local shopping bag and wishlist.
- Django catalog, per-size stock, transactional order creation, server-calculated prices and shipping.
- CSRF-protected forms, idempotent checkout, private tracking by reference plus email.
- Django administration for catalog, variants, stock, order status, contact messages and subscribers.
- Guest checkout with cash-on-delivery semantics. No card information is collected.
- SQLite local development; PostgreSQL configuration for deployment.

## Local preview
Requires Node 22.13+ and Python 3.11+.

1. Run `npm.cmd ci`.
2. Run `python -m pip install -r backend/requirements.txt`.
3. Run `python backend/manage.py migrate`.
4. Run `python backend/manage.py seed_catalog`.
5. In one terminal run `python backend/manage.py runserver 127.0.0.1:8000`.
6. In another run `npm.cmd run dev`.
7. Open http://localhost:3000.

On Windows, `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1` starts both after installation.

## Management
Run `python backend/manage.py createsuperuser` interactively to choose your own administrator credentials.
Open http://127.0.0.1:8000/admin/. This workspace has a local-only demo administrator; its random credentials are in .local/admin-access.txt (excluded from Git). On a fresh clone, run python scripts/create_demo_admin.py for a local demo account, or createsuperuser for your own account.
Add products, edit prices, add size variants and stock, review orders, update status, and read contact messages.
Cancelling an order does not automatically return stock: review fulfillment and adjust stock explicitly.
The administration records changes using Django's admin log.

## Validation
- `python backend/manage.py test shop`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- `python scripts/smoke_test.py` with both services running.

## Preview status
This is an operational development preview, not a launched retail business.
The eight catalog entries, prices, stock, size guide, shipping thresholds, brand copy and AI-generated photographs are sample material.
Local sample orders are persisted and decrement sample stock; no fulfillment or payment is triggered.
All sample products are blocked from ordering when DJANGO_DEBUG=0.
Newsletter and contact records are stored; outbound email/SMS is not configured.
No fabricated reviews, payment logos, store addresses or customer counts are included.

## Deployment
The React frontend preserves the Sites/vinext Cloudflare Worker starter. Django must run on a separate Python-capable host; Sites cannot execute Django.
Set COMMERCE_API_URL on the frontend to that service's HTTPS origin. It must be reachable by the frontend worker.
Deploy backend/Dockerfile from the repository root, or use a Python host with Gunicorn.
Run migrations as a release step. Serve /static/ collected assets through the reverse proxy/static service.
Use PostgreSQL and persistent backups for real orders; do not use an ephemeral SQLite filesystem.
Set DJANGO_DEBUG=0, a strong DJANGO_SECRET_KEY, explicit DJANGO_ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS.
Set CHECKOUT_ENABLED=1 only after launch review; it defaults off in production.
Terminate TLS at a trusted reverse proxy, overwrite X-Forwarded-Proto there, and do not expose an untrusted proxy directly.
Configure a shared rate-limit cache and proxy-aware client identity before multiple workers/public traffic.
The current local limiter is per process and sees the frontend proxy's IP; it is a development safeguard, not a distributed production limiter.

The .env.example documents settings. Django reads process environment variables; load these through your host or shell rather than assuming Django automatically reads .env.
Use the exact frontend origin in CSRF_TRUSTED_ORIGINS.

## Required before real launch
1. Replace concept photos and sample catalog with your actual items; set is_sample=False only for real products.
2. Confirm official brand spelling, store contact details, price/tax treatment, size measurements and care instructions.
3. Approve delivery regions, charges, lead times, cancellation and returns terms; update preview copy.
4. Set up the Python host, database, HTTPS, backups, monitoring, shared rate limiting and staff permissions.
5. Configure email/SMS and a merchant payment gateway if required. Never mark an online order paid without verifying a gateway webhook.
6. Complete browser/mobile checkout QA and security review.
7. Remove preview messaging only when the corresponding real operations are active.

Generated asset details are recorded in ASSETS.md.
