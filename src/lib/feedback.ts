export function validateFeedback(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid message.");
  const input = body as Record<string, unknown>;
  if (typeof input.name !== "string" || typeof input.email !== "string" || typeof input.message !== "string" || typeof input.website !== "string") {
    throw new Error("Invalid message.");
  }
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  if (name.length > 80 || email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || message.length < 10 || message.length > 2000) {
    throw new Error("Enter a message of 10–2000 characters and a valid email address, if provided.");
  }
  return {name,email,message,isBot:input.website.trim().length>0};
}
