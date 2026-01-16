/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ExportButton } from '@/components/export/ExportButton'
import { ExportModal } from '@/components/export/ExportModal'
import { ReportPreview } from '@/components/export/ReportPreview'

// Mock fetch
global.fetch = jest.fn()

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test')
global.URL.revokeObjectURL = jest.fn()

describe('ExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render export button', () => {
    render(<ExportButton type="quarterly" quarter="Q1-2025" />)

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('should show format options on click', async () => {
    render(<ExportButton type="quarterly" quarter="Q1-2025" />)

    const button = screen.getByRole('button', { name: /export/i })
    await userEvent.click(button)

    expect(screen.getByText(/markdown/i)).toBeInTheDocument()
    expect(screen.getByText(/json/i)).toBeInTheDocument()
  })

  it('should trigger download on format selection', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['test content']),
    })

    render(<ExportButton type="quarterly" quarter="Q1-2025" />)

    const button = screen.getByRole('button', { name: /export/i })
    await userEvent.click(button)

    const markdownOption = screen.getByText(/markdown/i)
    await userEvent.click(markdownOption)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/export/quarterly')
      )
    })
  })

  it('should show loading state during export', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<ExportButton type="quarterly" quarter="Q1-2025" />)

    const button = screen.getByRole('button', { name: /export/i })
    await userEvent.click(button)

    const markdownOption = screen.getByText(/markdown/i)
    await userEvent.click(markdownOption)

    expect(screen.getByText(/exporting/i)).toBeInTheDocument()
  })

  it('should show error on export failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<ExportButton type="quarterly" quarter="Q1-2025" />)

    const button = screen.getByRole('button', { name: /export/i })
    await userEvent.click(button)

    const markdownOption = screen.getByText(/markdown/i)
    await userEvent.click(markdownOption)

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument()
    })
  })

  it('should support CSV format for bets export', async () => {
    render(<ExportButton type="bets" />)

    const button = screen.getByRole('button', { name: /export/i })
    await userEvent.click(button)

    expect(screen.getByText(/csv/i)).toBeInTheDocument()
  })
})

describe('ExportModal', () => {
  const mockOnClose = jest.fn()
  const mockOnExport = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render modal with options', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        type="quarterly"
      />
    )

    expect(screen.getByText(/export options/i)).toBeInTheDocument()
  })

  it('should show format selection', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        type="quarterly"
      />
    )

    expect(screen.getByLabelText(/format/i)).toBeInTheDocument()
  })

  it('should show quarter selection for quarterly export', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        type="quarterly"
      />
    )

    expect(screen.getByLabelText(/quarter/i)).toBeInTheDocument()
  })

  it('should call onExport with selected options', async () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        type="bets"
      />
    )

    const exportBtn = screen.getByRole('button', { name: /export/i })
    await userEvent.click(exportBtn)

    expect(mockOnExport).toHaveBeenCalledWith(
      expect.objectContaining({
        format: expect.any(String),
      })
    )
  })

  it('should call onClose when cancelled', async () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        type="quarterly"
      />
    )

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelBtn)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    render(
      <ExportModal
        isOpen={false}
        onClose={mockOnClose}
        onExport={mockOnExport}
        type="quarterly"
      />
    )

    expect(screen.queryByText(/export options/i)).not.toBeInTheDocument()
  })
})

describe('ReportPreview', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => '# Quarterly Report\n\nContent here...',
    })
  })

  it('should fetch and display report preview', async () => {
    render(<ReportPreview type="quarterly" quarter="Q1-2025" />)

    await waitFor(() => {
      expect(screen.getByText(/quarterly report/i)).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    render(<ReportPreview type="quarterly" quarter="Q1-2025" />)

    expect(screen.getByTestId('preview-loading')).toBeInTheDocument()
  })

  it('should show error state on fetch failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<ReportPreview type="quarterly" quarter="Q1-2025" />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('should render markdown content', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => '## Bets\n\n- Bet 1\n- Bet 2',
    })

    render(<ReportPreview type="quarterly" quarter="Q1-2025" />)

    await waitFor(() => {
      expect(screen.getByText(/bets/i)).toBeInTheDocument()
    })
  })

  it('should have export button in preview', async () => {
    render(<ReportPreview type="quarterly" quarter="Q1-2025" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })
  })
})
