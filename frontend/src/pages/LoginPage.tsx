import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.login(password)
      navigate('/wines', { replace: true })
    } catch {
      setError('Contraseña incorrecta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#111111',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#ffffff', borderRadius: '12px', padding: '40px 36px', width: '340px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <img src="/logo.png" alt="FUDRE Wine Club" style={{ height: '48px', objectFit: 'contain', alignSelf: 'center', marginBottom: '8px' }} />
        <label style={{ fontSize: '13px', color: '#333' }}>
          Contraseña
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: 'block', width: '100%', marginTop: '6px', padding: '8px 10px',
              border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px',
            }}
          />
        </label>
        {error && <span style={{ color: '#c0392b', fontSize: '13px' }}>{error}</span>}
        <Button type="submit" disabled={loading} style={{ background: '#7F654E' }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </div>
  )
}
