// ** The classic 6-dot drag-handle glyph (Notion/Trello/Linear-style) -
// react-feather has no "grip" icon (only Menu, Move, etc.), none of which
// read as "drag this row" the way this one does, so it's a small inline SVG
// instead of a feather import.
// flexShrink: 0 matters here - react-data-table-component's cell wrapper is
// a flex container, and without it the icon's width (but not its height,
// since flexbox only constrains the main axis) gets silently compressed.
const GripVerticalIcon = ({ size = 20, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='currentColor'
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <circle cx='9' cy='5' r='1.6' />
    <circle cx='9' cy='12' r='1.6' />
    <circle cx='9' cy='19' r='1.6' />
    <circle cx='15' cy='5' r='1.6' />
    <circle cx='15' cy='12' r='1.6' />
    <circle cx='15' cy='19' r='1.6' />
  </svg>
)

export default GripVerticalIcon
