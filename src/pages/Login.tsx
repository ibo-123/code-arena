import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export const Login = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/dashboard')
    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="brand">
        <span className="brand-mark">&lt;/&gt;</span>
        CODE ARENA <em>2026</em>
      </Link>

      <Card className="auth-card">
        <Badge>WELCOME BACK</Badge>
        <h1>Sign in to Code Arena</h1>
        <p>Continue your championship campaign.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              required
              type="email"
              name="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              name="password"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <Button type="submit" loading={loading}>
            Log In
          </Button>
        </form>

        <p className="auth-switch">
          New to the arena? <Link to="/register">Register now</Link>
        </p>
      </Card>
    </div>
  )
}
