// ** React Imports
import { useEffect } from 'react'

// ** Third Party Components
import Sortable from 'sortablejs'

// react-data-table-component has no prop for supplying a custom row
// wrapper, so there's no way to hand it a React DnD list component (the
// pattern used elsewhere in this app - see Todo's ReactSortable usage).
// Instead this attaches SortableJS imperatively to the table's already
// -rendered `.rdt_TableBody` element via a ref - the standard workaround for
// adding drag-and-drop row reordering to this library.
const useDragReorder = ({ containerRef, enabled, rows, onReorder }) => {
  useEffect(() => {
    if (!enabled || !containerRef.current || !rows || rows.length === 0) return

    const tableBody = containerRef.current.querySelector('.rdt_TableBody')
    if (!tableBody) return

    const sortable = Sortable.create(tableBody, {
      handle: '.drag-handle',
      animation: 150,
      // Use SortableJS's own mouse/touch-simulated dragging instead of
      // native HTML5 DnD - avoids native drag's inconsistent ghost-image
      // rendering and sidesteps it fighting React's DOM reconciliation.
      forceFallback: true,
      // The fallback mode drags via plain mousemove rather than the native
      // dragstart/drop events, which don't suppress text selection on their
      // own - without this, dragging a row also selects its text.
      onStart: () => document.body.classList.add('user-select-none'),
      onEnd: evt => {
        document.body.classList.remove('user-select-none')
        if (evt.oldIndex !== evt.newIndex) {
          onReorder(evt.oldIndex, evt.newIndex)
        }
      }
    })

    return () => {
      document.body.classList.remove('user-select-none')
      sortable.destroy()
    }
  }, [enabled, rows, containerRef])
}

export default useDragReorder
