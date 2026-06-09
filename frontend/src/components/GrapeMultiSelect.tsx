import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function GrapeMultiSelect({ grapes, selected, onChange }: {
  grapes: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(grape: string) {
    onChange(selected.includes(grape) ? selected.filter(g => g !== grape) : [...selected, grape])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`h-10 rounded-md border px-3 text-sm flex items-center gap-1 min-w-36 cursor-pointer transition-colors ${selected.length > 0 ? 'border-primary text-primary' : 'border-input bg-background'}`}
      >
        {selected.length === 0 ? 'Todas las uvas' : `${selected.length} uva${selected.length > 1 ? 's' : ''}`}
        <ChevronDown size={14} className="ml-auto" />
      </button>
      {open && (
        <div className="absolute top-11 left-0 z-20 bg-white border border-input rounded-md shadow-lg p-1 max-h-60 overflow-y-auto min-w-48">
          {grapes.map(g => (
            <label key={g} className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-accent cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.includes(g)}
                onChange={() => toggle(g)}
                className="accent-primary"
              />
              {g}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
