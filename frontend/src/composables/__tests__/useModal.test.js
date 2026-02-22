import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useModal } from '../useModal'

describe('useModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with no active modal', () => {
    const { activeModal, modalData } = useModal()
    expect(activeModal.value).toBeNull()
    expect(modalData.value).toBeNull()
  })

  it('open sets modal name and data', () => {
    const { activeModal, modalData, open } = useModal()
    open('help', { section: 'keys' })
    expect(activeModal.value).toBe('help')
    expect(modalData.value).toEqual({ section: 'keys' })
  })

  it('close clears modal', () => {
    const { activeModal, modalData, open, close } = useModal()
    open('sling', { bead: '123' })
    close()
    expect(activeModal.value).toBeNull()
    expect(modalData.value).toBeNull()
  })

  it('isOpen checks specific modal', () => {
    const { open, isOpen } = useModal()
    expect(isOpen('help')).toBe(false)
    open('help')
    expect(isOpen('help')).toBe(true)
    expect(isOpen('sling')).toBe(false)
  })

  it('open without data defaults to null', () => {
    const { modalData, open } = useModal()
    open('escalation')
    expect(modalData.value).toBeNull()
  })
})
