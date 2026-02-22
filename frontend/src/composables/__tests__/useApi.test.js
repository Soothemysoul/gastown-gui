import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:7667', protocol: 'http:', host: 'localhost:7667' },
  writable: true,
})

// Must import after mocks are set up
const { api } = await import('../useApi')

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockJsonResponse(data, ok = true, status = 200) {
    mockFetch.mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
    })
  }

  it('getStatus calls correct endpoint', async () => {
    mockJsonResponse({ name: 'Town' })
    const result = await api.getStatus()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7667/api/status',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    )
    expect(result).toEqual({ name: 'Town' })
  })

  it('getStatus with force=true adds refresh param', async () => {
    mockJsonResponse({})
    await api.getStatus(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7667/api/status?refresh=true',
      expect.any(Object),
    )
  })

  it('getHealth calls /api/health', async () => {
    mockJsonResponse({ status: 'ok' })
    await api.getHealth()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7667/api/health', expect.any(Object))
  })

  it('post sends JSON body', async () => {
    mockJsonResponse({ id: 'c1' })
    await api.createConvoy('test', ['i1'])
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7667/api/convoy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test', issues: ['i1'], notify: null }),
      }),
    )
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'Bead not found' }),
    })

    await expect(api.getBead('xyz')).rejects.toThrow('Bead not found')
  })

  it('throws with statusText when error body is not JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('not json')),
    })

    await expect(api.getStatus()).rejects.toThrow('Internal Server Error')
  })

  it('preserves errorType on error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'Invalid', errorType: 'VALIDATION' }),
    })

    try {
      await api.createBead('', {})
      expect.fail('should have thrown')
    } catch (err) {
      expect(err.errorType).toBe('VALIDATION')
    }
  })

  it('getMail calls /api/mail', async () => {
    mockJsonResponse([])
    await api.getMail()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7667/api/mail', expect.any(Object))
  })

  it('sendMail sends correct body', async () => {
    mockJsonResponse({ ok: true })
    await api.sendMail('witness', 'Help', 'Stuck', 'high')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7667/api/mail',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ to: 'witness', subject: 'Help', message: 'Stuck', priority: 'high' }),
      }),
    )
  })

  it('getBeads with status filter', async () => {
    mockJsonResponse([])
    await api.getBeads('open')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7667/api/beads?status=open', expect.any(Object))
  })

  it('getBeads with all filter omits param', async () => {
    mockJsonResponse([])
    await api.getBeads('all')
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7667/api/beads', expect.any(Object))
  })

  it('searchBeads encodes query', async () => {
    mockJsonResponse([])
    await api.searchBeads('hello world')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7667/api/beads/search?q=hello%20world',
      expect.any(Object),
    )
  })

  it('deleteFormula sends DELETE method', async () => {
    mockJsonResponse({})
    await api.deleteFormula('test-formula')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7667/api/formula/test-formula',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('getPeekOutput encodes rig and name', async () => {
    mockJsonResponse({ output: '' })
    await api.getPeekOutput('my rig', 'agent/name')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7667/api/polecat/my%20rig/agent%2Fname/output',
      expect.any(Object),
    )
  })
})
