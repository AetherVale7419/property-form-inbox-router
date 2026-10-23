import { z } from "zod";

export const propertySubmissionSchema = z.object({
  propertyName: z.string().min(2),
  tenantName: z.string().min(2),
  tenantEmail: z.string().email(),
  unit: z.string().min(1),
  category: z.enum(["maintenance_request", "tenant_document", "inspection_reminder"]),
  message: z.string().min(10),
  captchaWidgetRecordId: z.string().min(1),
  captchaToken: z.string().min(1),
  idempotencyKey: z.string().min(8)
});

export type PropertySubmission = z.infer<typeof propertySubmissionSchema>;

type MailRoute = {
  inbox: string;
  subjectTag: string;
  nextStep: string;
};

export function routeSubmission(input: Pick<PropertySubmission, "category">): MailRoute {
  switch (input.category) {
    case "maintenance_request":
      return {
        inbox: "chenhua@changba.com",
        subjectTag: "Maintenance request",
        nextStep: "create_work_order"
      };
    case "tenant_document":
      return {
        inbox: "chenhua@changba.com",
        subjectTag: "Tenant document",
        nextStep: "file_document"
      };
    case "inspection_reminder":
      return {
        inbox: "chenhua@changba.com",
        subjectTag: "Inspection reminder",
        nextStep: "schedule_follow_up"
      };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildInboxEmail(submission: PropertySubmission): { to: string; subject: string; html: string } {
  const route = routeSubmission(submission);
  const subject = `[${route.subjectTag}] ${submission.propertyName} unit ${submission.unit} · ${submission.tenantName}`;
  const html = [
    `<h1>${escapeHtml(route.subjectTag)}</h1>`,
    `<p><b>Property:</b> ${escapeHtml(submission.propertyName)}</p>`,
    `<p><b>Unit:</b> ${escapeHtml(submission.unit)}</p>`,
    `<p><b>Tenant:</b> ${escapeHtml(submission.tenantName)} &lt;${escapeHtml(submission.tenantEmail)}&gt;</p>`,
    `<p><b>Next step:</b> ${escapeHtml(route.nextStep)}</p>`,
    `<p><b>Message:</b></p>`,
    `<p>${escapeHtml(submission.message).replaceAll("\n", "<br />")}</p>`
  ].join("\n");

  return {
    to: route.inbox,
    subject,
    html
  };
}
