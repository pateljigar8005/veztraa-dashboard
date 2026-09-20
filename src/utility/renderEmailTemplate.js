// Substitutes {token} placeholders in an email_templates row's subject/content
// with real values - the templates are authored as plain text (see Company
// Settings > Email Templates), so the rendered body also converts \n to <br>
// for display in Compose's rich-text editor.
export const renderEmailTemplate = (template, values) => {
  if (!template) return { subject: '', body: '' }

  const replaceTokens = text =>
    Object.entries(values).reduce((acc, [key, value]) => acc.split(`{${key}}`).join(value ?? ''), text || '')

  return {
    subject: replaceTokens(template.subject),
    body: replaceTokens(template.content).replace(/\n/g, '<br>')
  }
}
