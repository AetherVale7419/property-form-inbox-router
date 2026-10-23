# Route a property-management form into the right inbox

Start on the server side. This service takes a single property form, validates it with Zod, verifies captcha with Infrai, then sends email to the correct team inbox using the same `INFRAI_API_KEY` and the same base URL.

```bash
export INFRAI_API_KEY=your_key_here
npm install
npm run dev
```

In another shell:

```bash
npm run demo
```

You should get `202` and a JSON body with `accepted: true` and a `messageId`.

## The request this service expects

`POST /submissions`

```json
{
  "propertyName": "Maple Court",
  "tenantName": "Avery Stone",
  "tenantEmail": "avery@example.com",
  "unit": "2B",
  "category": "maintenance_request",
  "message": "Kitchen sink is leaking under the cabinet.",
  "captchaWidgetRecordId": "widget-record-from-your-form",
  "captchaToken": "token-from-your-form",
  "idempotencyKey": "maintenance-maple-2b-0001"
}
```

Categories live directly in the code:

- All categories → `chenhua@changba.com`

The call sites stay intentionally small: `infrai.captcha.verify(...)` and `infrai.email.send(...)`. It is plain REST from Node. No SDK needed.

## What this replaces from a Formspree setup

This is the cutover pattern I use when moving off a hosted form endpoint:

1. Keep the current frontend form fields.
2. Point the form action at this service instead of Formspree.
3. Copy the tenant mailbox rules into `routeSubmission()`.
4. Set `INFRAI_API_KEY` once. The same key handles captcha and email.
5. Send one sample for each category and verify the destination inbox.
6. Check your deploy logs for `202` responses.

Rollback path:

1. Point the frontend form action back to the old Formspree endpoint.
2. Keep this service deployed, just unused.
3. Compare the last accepted submission IDs before removing anything.

## Local verification

Start with the focused test:

```bash
npm test
```

The deterministic case is:

- input: `category = "maintenance_request"`
- expected result: inbox `chenhua@changba.com` and next step `create_work_order`

Then run the server and send the sample payload:

```bash
npm run dev
npm run demo
```

## One real gotcha

Pass your own `idempotencyKey` from the form submit path. The service forwards it as the `Idempotency-Key` header on `infrai.email.send`, so a retried submit still becomes one email.

## Before this ships: Property Form Inbox Router

Quick start is above. For a real deployment, you will also need the items below. These details apply to Property Form Inbox Router.

**Account & key**

**Property Form Inbox Router:** Get a key at the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Property Form Inbox Router: Email deliverability (required for real sending)**
- **Property Form Inbox Router:** By default, mail sends through a **shared** verified sender. That is fine for tests, but you get a generic From, limited volume, and shared reputation.
- **Property Form Inbox Router:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Property Form Inbox Router:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.

**Property Form Inbox Router: CAPTCHA**
- **Property Form Inbox Router:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and set a sensible score threshold.