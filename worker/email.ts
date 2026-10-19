type InviteEmailInput = {
  to: string;
  inviteUrl: string;
  role: string;
};

export async function sendInviteEmail(env: Env, input: InviteEmailInput) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: "Invitacion a CXC G&M",
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.5">
          <h2>Invitacion a CXC G&M</h2>
          <p>Fuiste invitado como <strong>${input.role}</strong>.</p>
          <p>Este enlace es de un solo uso y vence en 7 dias.</p>
          <p><a href="${input.inviteUrl}">Aceptar invitacion</a></p>
          <p style="color: #71717a; font-size: 13px">${input.inviteUrl}</p>
        </div>
      `,
    }),
  });

  return response.ok;
}
