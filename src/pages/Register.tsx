import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export const Register = () => {
  const { register, isAuthenticated } = useAuth()
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
    const name = String(form.get('name'))
    const username = String(form.get('username'))
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const codeforcesUsername = String(form.get('codeforcesUsername'))

    try {
      await register({ name, username, email, password, codeforcesUsername })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
        <Badge>JOIN THE ARENA</Badge>
        <h1>Create your competitor profile</h1>
        <p>Your road to the championship starts here.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Display Name
            <input required name="name" placeholder="Your name" />
          </label>

          <label>
            Username
            <input required name="username" placeholder="arena_handle" />
          </label>

          <label>
            Email Address
            <input required type="email" name="email" placeholder="you@example.com" />
          </label>

          <label>
            Codeforces Username
            <input required name="codeforcesUsername" placeholder="tourist" />
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

          <label className="check">
            <input required type="checkbox" />
            I agree to the tournament Code of Conduct.
          </label>

          {error && <p className="form-error">{error}</p>}

          <Button type="submit" loading={loading}>
            Register Account
          </Button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </Card>
    </div>
  )
}
