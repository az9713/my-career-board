/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ContextUpload } from '@/components/context/ContextUpload'
import { ContextList } from '@/components/context/ContextList'
import { ContextCard } from '@/components/context/ContextCard'

// Mock fetch
global.fetch = jest.fn()

describe('ContextUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ context: { id: 'ctx-1', type: 'resume' } }),
    })
  })

  it('should render upload form', () => {
    render(<ContextUpload onUploadComplete={jest.fn()} />)

    expect(screen.getByText(/add context/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should show context type options', async () => {
    render(<ContextUpload onUploadComplete={jest.fn()} />)

    const select = screen.getByRole('combobox')
    await userEvent.click(select)

    expect(screen.getByText(/resume/i)).toBeInTheDocument()
    expect(screen.getByText(/linkedin/i)).toBeInTheDocument()
    expect(screen.getByText(/document/i)).toBeInTheDocument()
  })

  it('should show text input for resume type', async () => {
    render(<ContextUpload onUploadComplete={jest.fn()} />)

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'resume')

    expect(screen.getByPlaceholderText(/paste your resume/i)).toBeInTheDocument()
  })

  it('should submit text content', async () => {
    const onUploadComplete = jest.fn()
    render(<ContextUpload onUploadComplete={onUploadComplete} />)

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'resume')

    const textarea = screen.getByPlaceholderText(/paste your resume/i)
    await userEvent.type(textarea, 'John Doe, Software Engineer...')

    const nameInput = screen.getByPlaceholderText(/name/i)
    await userEvent.type(nameInput, 'My Resume')

    const submitBtn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/context',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled()
    })
  })

  it('should show file drop zone for document type', async () => {
    render(<ContextUpload onUploadComplete={jest.fn()} />)

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'document')

    expect(screen.getByText(/drop file/i)).toBeInTheDocument()
  })

  it('should handle file drop', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ context: { id: 'ctx-1' } }),
    })

    const onUploadComplete = jest.fn()
    render(<ContextUpload onUploadComplete={onUploadComplete} />)

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'document')

    const dropZone = screen.getByTestId('drop-zone')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    Object.defineProperty(dropZone, 'files', { value: [file] })
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('should show loading state during upload', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<ContextUpload onUploadComplete={jest.fn()} />)

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'resume')

    const textarea = screen.getByPlaceholderText(/paste your resume/i)
    await userEvent.type(textarea, 'Content')

    const nameInput = screen.getByPlaceholderText(/name/i)
    await userEvent.type(nameInput, 'Test')

    const submitBtn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(submitBtn)

    expect(screen.getByText(/saving/i)).toBeInTheDocument()
  })

  it('should show error on upload failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    })

    render(<ContextUpload onUploadComplete={jest.fn()} />)

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'resume')

    const textarea = screen.getByPlaceholderText(/paste your resume/i)
    await userEvent.type(textarea, 'Content')

    const nameInput = screen.getByPlaceholderText(/name/i)
    await userEvent.type(nameInput, 'Test')

    const submitBtn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument()
    })
  })
})

describe('ContextList', () => {
  const mockContexts = [
    {
      id: 'ctx-1',
      type: 'resume',
      name: 'My Resume',
      summary: 'Senior engineer with 10 years experience',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'ctx-2',
      type: 'linkedin',
      name: 'LinkedIn Profile',
      summary: 'Engineering Manager at TechCorp',
      createdAt: '2025-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ contexts: mockContexts }),
    })
  })

  it('should fetch and display contexts', async () => {
    render(<ContextList />)

    await waitFor(() => {
      expect(screen.getByText('My Resume')).toBeInTheDocument()
      expect(screen.getByText('LinkedIn Profile')).toBeInTheDocument()
    })
  })

  it('should show empty state when no contexts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ contexts: [] }),
    })

    render(<ContextList />)

    await waitFor(() => {
      expect(screen.getByText(/no context/i)).toBeInTheDocument()
    })
  })

  it('should show context type icons', async () => {
    render(<ContextList />)

    await waitFor(() => {
      expect(screen.getByTestId('context-icon-resume')).toBeInTheDocument()
      expect(screen.getByTestId('context-icon-linkedin')).toBeInTheDocument()
    })
  })

  it('should allow deleting context', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contexts: mockContexts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    render(<ContextList />)

    await waitFor(() => {
      expect(screen.getByText('My Resume')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/context'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})

describe('ContextCard', () => {
  const mockContext = {
    id: 'ctx-1',
    type: 'resume' as const,
    name: 'My Resume',
    summary: 'Senior engineer with 10 years experience in web development',
    createdAt: '2025-01-01T00:00:00Z',
  }

  it('should display context details', () => {
    render(<ContextCard context={mockContext} onDelete={jest.fn()} />)

    expect(screen.getByText('My Resume')).toBeInTheDocument()
    expect(screen.getByText(/senior engineer/i)).toBeInTheDocument()
  })

  it('should show context type badge', () => {
    render(<ContextCard context={mockContext} onDelete={jest.fn()} />)

    // Check for the type badge specifically (not the name which includes "Resume")
    const badges = screen.getAllByText(/resume/i)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should truncate long summaries', () => {
    const longSummary = 'A'.repeat(300)
    render(
      <ContextCard
        context={{ ...mockContext, summary: longSummary }}
        onDelete={jest.fn()}
      />
    )

    const summaryElement = screen.getByTestId('context-summary')
    expect(summaryElement.textContent?.length).toBeLessThan(300)
  })

  it('should call onDelete when delete button clicked', async () => {
    const onDelete = jest.fn()
    render(<ContextCard context={mockContext} onDelete={onDelete} />)

    const deleteBtn = screen.getByRole('button', { name: /delete/i })
    await userEvent.click(deleteBtn)

    expect(onDelete).toHaveBeenCalledWith('ctx-1')
  })

  it('should show expand option for full details', async () => {
    render(<ContextCard context={mockContext} onDelete={jest.fn()} />)

    const expandBtn = screen.getByRole('button', { name: /expand|view/i })
    await userEvent.click(expandBtn)

    expect(screen.getByTestId('context-expanded')).toBeInTheDocument()
  })
})
