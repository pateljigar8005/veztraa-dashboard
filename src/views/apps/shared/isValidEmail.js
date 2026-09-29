// Shared email format check, used by any form validating an email field.
const isValidEmail = str => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim())

export default isValidEmail
