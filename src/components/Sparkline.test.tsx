import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('renders a polyline for a price series', () => {
    const { container } = render(<Sparkline prices={[1, 2, 3, 2, 4]} />)
    expect(container.querySelector('polyline')).toBeTruthy()
  })
  it('renders no polyline for empty data', () => {
    const { container } = render(<Sparkline prices={[]} />)
    expect(container.querySelector('polyline')).toBeNull()
  })
})
