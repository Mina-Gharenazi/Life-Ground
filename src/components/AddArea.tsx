import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type Props = { onAdd: (name: string, importance: number) => void; onClose: () => void }

export function AddArea({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [importance, setImportance] = useState(5)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      className="modal"
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onAdd(name.trim(), importance)
        }}
      >
        <div className="modal__head">
          <h2>Claim new land</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <input
          className="text-input"
          autoFocus
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Reading, Cooking, Side project…"
        />
        <div className="importance__row">
          <label htmlFor="new-imp">How much does this matter to you?</label>
          <span className="big-num">
            {importance}
            <small>/10</small>
          </span>
        </div>
        <input
          id="new-imp"
          type="range"
          min={1}
          max={10}
          value={importance}
          style={{ ['--fill' as string]: `${((importance - 1) / 9) * 100}%` }}
          onChange={(e) => setImportance(Number(e.target.value))}
        />
        <p className="muted small">
          Space on the map is limited — this claims ground from every other area, proportional to how
          you weight them.
        </p>
        <button className="btn btn--light btn--block" type="submit" disabled={!name.trim()}>
          Add to the map
        </button>
      </form>
    </dialog>
  )
}
