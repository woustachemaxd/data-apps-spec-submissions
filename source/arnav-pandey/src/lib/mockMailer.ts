export function sendMockEmail(to: string, subject: string, body: string, attachments: Array<{ name: string; content: string }> = []) {
  try {
    const out = { to, subject, body, attachments, at: new Date().toISOString() };
    console.log("[mockEmail]", out);
    const stored = JSON.parse(localStorage.getItem("mockEmails" ) || "[]");
    stored.push(out);
    localStorage.setItem("mockEmails", JSON.stringify(stored));
    return Promise.resolve(true);
  } catch (e) {
    return Promise.reject(e);
  }
}
