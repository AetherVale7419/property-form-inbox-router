import { infrai, InfraiError } from "./infrai";
import { buildInboxEmail, propertySubmissionSchema, type PropertySubmission } from "./property_submission";

export type RouterResult =
  | { status: 202; body: { accepted: true; category: PropertySubmission["category"]; messageId: string } }
  | { status: 400; body: { error: string } }
  | { status: 422; body: { error: string } };

export async function handlePropertySubmission(rawBody: unknown, context: { ip?: string }): Promise<RouterResult> {
  const parsed = propertySubmissionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ") }
    };
  }

  const submission = parsed.data;

  try {
    await infrai.captcha.verify({
      widget_record_id: submission.captchaWidgetRecordId,
      token: submission.captchaToken,
      ip: context.ip,
      action: "property_contact_form",
      score_threshold: 0.5
    });
  } catch (error) {
    if (error instanceof InfraiError && error.status >= 400 && error.status < 500) {
      return {
        status: 422,
        body: { error: "captcha rejected" }
      };
    }
    throw error;
  }

  const email = buildInboxEmail(submission);
  const sent = await infrai.email.send(email, {
    "Idempotency-Key": submission.idempotencyKey
  });

  return {
    status: 202,
    body: {
      accepted: true,
      category: submission.category,
      messageId: sent.data.message_id
    }
  };
}
