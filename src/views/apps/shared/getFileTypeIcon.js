// ** Third Party Components
import { FileText, Image, Film, Music, Archive, Table, Code, Paperclip } from 'react-feather'

// Extension -> icon mapping shared by anywhere a file list needs a quick
// visual cue for what kind of file it is (react-feather has no dedicated
// per-format icons like a literal PDF logo, so this groups extensions into
// the closest generic shape instead).
const ICON_BY_EXTENSION = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  rtf: FileText,
  xls: Table,
  xlsx: Table,
  csv: Table,
  ppt: FileText,
  pptx: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  webp: Image,
  svg: Image,
  bmp: Image,
  mp4: Film,
  mov: Film,
  avi: Film,
  webm: Film,
  mkv: Film,
  mp3: Music,
  wav: Music,
  ogg: Music,
  m4a: Music,
  zip: Archive,
  rar: Archive,
  '7z': Archive,
  tar: Archive,
  gz: Archive,
  js: Code,
  ts: Code,
  jsx: Code,
  tsx: Code,
  json: Code,
  html: Code,
  css: Code,
  py: Code,
  php: Code
}

export const getFileTypeIcon = fileName => {
  const ext = (fileName || '').split('.').pop()?.toLowerCase()
  return ICON_BY_EXTENSION[ext] || Paperclip
}
