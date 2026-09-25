export function renderGreetingTemplate(templateText: string, context: Record<string, string>): string {
  let rendered = templateText
  for (const [key, value] of Object.entries(context)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), value)
  }
  return rendered
}
