// ** Derives a 2-character initials string from a name/title for avatar
// fallbacks - first letter of the first two words, or the first two letters
// of a single word. Kept separate from @core's Avatar `initials` mode (used
// elsewhere in the app), which joins one letter per word with no cap and
// produces 3-4 character strings for longer titles.
const getInitials = str => {
  if (!str) return '?'
  const words = str.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export default getInitials
