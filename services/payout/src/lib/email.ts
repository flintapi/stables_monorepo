import { betterFetch } from "@better-fetch/fetch";

import env from "@/env";

interface IEmailProps {
  to: string;
  subject: string;
  body: string;
  name?: string;
}
export async function sendEmail({ to, subject, body, name = "Passry" }: IEmailProps) {
  const { data, error } = await betterFetch<{
    success: boolean;
    emails: Array<Record<string, any>>;
    timestamp: string;
  }>(`${env.PLUNK_API_URL}/send`, {
    body: JSON.stringify({
      to,
      subject,
      body,
      name,
    }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.PLUNK_API_KEY}`,
    },
    retry: {
      type: "linear",
      delay: 1000,
      attempts: 3,
    },
  });

  if (error) {
    console.error("Error sending email", error);
    throw error;
  }
  return data;
}
