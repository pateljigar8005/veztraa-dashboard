const LOWER = 'abcdefghjkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%^&*-_='

const ALL = LOWER + UPPER + DIGITS + SYMBOLS

const randomChar = pool => pool[Math.floor(Math.random() * pool.length)]

export const generatePassword = (length = 12) => {
  const required = [randomChar(LOWER), randomChar(UPPER), randomChar(DIGITS), randomChar(SYMBOLS)]
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => randomChar(ALL))
  const chars = [...required, ...rest]

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}
