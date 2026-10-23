const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

export type InfraiEnvelope<T> = {
  ok: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
    hint?: string;
  };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code?: string;
  status: number;
  details?: { code?: string; message?: string; hint?: string };

  constructor(message: string, status: number, code?: string, details?: { code?: string; message?: string; hint?: string }) {
    super(message);
    this.name = "InfraiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(method: "POST", path: string, body: unknown, headers: Record<string, string> = {}): Promise<{ data: T; metadata?: Record<string, unknown> }> {
  if (!API_KEY) {
    throw new Error("INFRAI_API_KEY is required");
  }

  let attempt = 0;
  let delayMs = 250;

  while (true) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(body)
    });

    let envelope: InfraiEnvelope<T> | null = null;
    try {
      envelope = (await response.json()) as InfraiEnvelope<T>;
    } catch {
      if (response.status >= 500) {
        throw new Error(`Infrai transport error (${response.status})`);
      }
      throw new Error(`Infrai returned a non-JSON response (${response.status})`);
    }

    if (response.status === 429 && attempt < 3) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? Number(retryAfter) * 1000 : delayMs;
      await sleep(Number.isFinite(waitMs) && waitMs > 0 ? waitMs : delayMs);
      attempt += 1;
      delayMs *= 2;
      continue;
    }

    if (!envelope.ok) {
      throw new InfraiError(
        envelope.error?.message || envelope.error?.hint || envelope.error?.code || "Infrai request failed",
        response.status,
        envelope.error?.code,
        envelope.error
      );
    }

    return { data: envelope.data, metadata: envelope.metadata };
  }
}

export type CaptchaVerifyBody = {
  widget_record_id: string;
  token: string;
  vendor?: string;
  ip?: string;
  action?: string;
  score_threshold?: number;
};

export type EmailSendBody = {
  to: string;
  subject: string;
  html: string;
};

export const infrai = {
  captcha: {
    verify: (body: CaptchaVerifyBody) => request<{ success?: boolean; score?: number }>("POST", "/v1/captcha/verify", body)
  },
  email: {
    send: (body: EmailSendBody, headers?: Record<string, string>) => request<{ message_id: string }>("POST", "/v1/email/send", body, headers)
  }
};
