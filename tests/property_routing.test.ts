import test from "node:test";
import assert from "node:assert/strict";
import { buildInboxEmail, routeSubmission } from "../src/property_submission";

test("maintenance requests route to the maintenance inbox with the expected next step", () => {
  const route = routeSubmission({ category: "maintenance_request" });
  assert.deepEqual(route, {
    inbox: "chenhua@changba.com",
    subjectTag: "Maintenance request",
    nextStep: "create_work_order"
  });
});

test("inspection reminder email includes the inspections inbox and follow-up marker", () => {
  const email = buildInboxEmail({
    propertyName: "Maple Court",
    tenantName: "Avery Stone",
    tenantEmail: "avery@example.com",
    unit: "2B",
    category: "inspection_reminder",
    message: "Annual inspection is due next Tuesday.",
    captchaWidgetRecordId: "widget-record",
    captchaToken: "token",
    idempotencyKey: "inspect-maple-2b-0001"
  });

  assert.equal(email.to, "chenhua@changba.com");
  assert.match(email.subject, /Inspection reminder/);
  assert.match(email.html, /schedule_follow_up/);
});
