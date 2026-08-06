'use client'
import { useState, useRef, useEffect } from 'react'
import { NIGERIAN_BANKS } from '@/lib/nigerian-banks'
import styles from './BankSelect.module.scss'

interface Props {
  bankCode: string
  bankName: string
  onChange: (code: string, name: string) => void
  className?: string
}

export function BankSelect ({ bankCode, bankName, onChange, className }: Props) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? NIGERIAN_BANKS.filter(b => b.name.toLowerCase().includes(query.toLowerCase()))
    : NIGERIAN_BANKS

  useEffect(() => {
    function onOutside (e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function select (code: string, name: string) {
    onChange(code, name)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`${styles.wrap} ${className ?? ''}`} ref={ref}>
      <button
        type='button'
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={bankCode ? styles.selected : styles.placeholder}>
          {bankCode ? bankName : 'Select a bank…'}
        </span>
        <svg className={`${styles.arrow} ${open ? styles.arrowUp : ''}`} viewBox='0 0 10 6' fill='none'>
          <path d='M1 1l4 4 4-4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrap}>
            <input
              autoFocus
              className={styles.search}
              placeholder='Search bank…'
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.list}>
            {filtered.length === 0 ? (
              <p className={styles.empty}>No banks found</p>
            ) : filtered.map(b => (
              <button
                key={b.code}
                type='button'
                className={`${styles.option} ${b.code === bankCode ? styles.optionActive : ''}`}
                onClick={() => select(b.code, b.name)}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
