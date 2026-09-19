import { useEffect } from 'react'
import Sortable from 'sortablejs'

const useDragReorder = ({ containerRef, enabled, rows, onReorder }) => {
  useEffect(() => {
    if (!enabled || !containerRef.current || !rows || rows.length === 0) return

    const tableBody = containerRef.current.querySelector('.rdt_TableBody')
    if (!tableBody) return

    const sortable = Sortable.create(tableBody, {
      handle: '.drag-handle',
      animation: 150,
      forceFallback: true,
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