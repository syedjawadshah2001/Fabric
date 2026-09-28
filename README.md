# KAHLID FABRIC — Unstitched Velvet

43 owner-supplied catalog designs, all priced at Rs. 7,500. React storefront with free WhatsApp ordering to Khalid: **03299956666** (international **923299956666**).

## Run locally
From PowerShell:
```powershell
cd "G:\Khalid Fabric"
npm.cmd run dev
```
Open http://localhost:3000. Browsing and wishlists work immediately. Start Django as well for signup/login and adding products to the bag. WhatsApp ordering needs no paid API subscription.

To run the complete store with customer accounts and Django administration:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```
Management: http://127.0.0.1:8000/admin/
Existing local credentials: .local/admin-access.txt (not committed).
On a fresh clone, install backend/requirements.txt, migrate, seed_catalog, and run createsuperuser.

## What changed
- All 43 catalog_01.jpg through catalog_43.jpg photographs copied from New folder to public/catalog without altering the originals.
- Each photo is a separate design: KF-V001 through KF-V043.
- Price: Rs. 7,500 per design; unstitched velvet only.
- Three-slide campaign carousel with previous/next, slide indicators, pause, swipe, keyboard-focus pause and reduced-motion support.
- Scrollable product carousels, colour filtering, search by code/name, load more, enlarged photographs.
- Device-local cart and wishlist. Products can be added directly from collection cards.
- Checkout prepares a reviewed WhatsApp message containing codes, colours, quantities, subtotal and customer-provided delivery details.
- Owner contact, order enquiries and policy pages updated.
- Old sample products deactivated in Django; old orders preserved.

## WhatsApp behavior
No paid WhatsApp API is used. The customer clicks Open WhatsApp and then taps Send.
The site cannot automatically send, prove delivery, or confirm acceptance.
Opening a WhatsApp link shares its pre-filled text with WhatsApp; the owner receives it only after the customer sends it.
The bag is intentionally retained after opening the message.
The website never marks an order sent or paid and does not deduct inventory for a message draft.
Delivery charges, payment options, contents/measurements, returns and availability must be agreed directly with Khalid.
Styled outfit photos are explicitly labelled as references for unstitched fabric.

## Catalog management
The shipped data/catalog.json is the standalone/hosted catalog.
When Django is connected at COMMERCE_API_URL, the storefront can load existing catalog edits through the API.
Without a hosted Django service, publish updated data/catalog.json to update the online collection.
seed_catalog imports missing real designs and deactivates old samples; it preserves subsequent owner edits and stock.
Imported real designs use inquiry_only=True and stock=0 to avoid inventing inventory. Standard server checkout rejects these products and directs the buyer to WhatsApp.
No WhatsApp order is saved to the legacy Django Order table automatically.

## Verification
```
node --test tests/whatsapp.test.mjs
python backend/manage.py test shop
npx.cmd tsc --noEmit
npm.cmd run build
python scripts/smoke_test.py
```
The smoke test needs a local React server; Django is required for customer login and adding products to the bag.
Automated tests do not send WhatsApp messages.

## Deployment
The existing Sites private deployment is retained. The React frontend is built for Cloudflare Workers through vinext.
Public catalog browsing works without a Python host. Customer accounts and Add to bag require Django through COMMERCE_API_URL.
Django administration remains local unless separately deployed to a Python-capable HTTPS host with persistent database storage.
The site remains private until its owner chooses a public launch.
Business information not supplied by the owner has not been invented.


## Customer accounts
Browsing is public. Add to bag checks the Django session and opens login/signup when needed.
Successful login/signup adds the selected design and quantity without leaving the page.
Email verification is intentionally omitted. Passwords use Django hashing and validation;
sessions use HTTP-only cookies and mutations require CSRF tokens. Customer accounts have no admin permissions.
Account pages: /account, /login and /signup. Django admin can manage customers under Users.
The bag and wishlist are local to the browser, not synchronized across devices.
Password reset and email delivery are not implemented.
Run both frontend and Django for login/signup; scripts/start-local.ps1 starts both.
For production, configure HTTPS, secure Django settings, a persistent database, and a shared
cache/reverse-proxy rate limiter. The development rate limit is process-local and the frontend
proxy shares one backend IP; configure production limits for real customer traffic before launch.
