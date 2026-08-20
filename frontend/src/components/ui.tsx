import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ')
export const Button = ({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => <button className={cx('button', className)} {...props}>{children}</button>
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => <section className={`card ${className}`}>{children}</section>
export const Badge = ({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'red' | 'gold' | 'muted' }) => <span className={`badge ${tone}`}>{children}</span>
export const LoadingState = ({ label = 'Loading tournament data...' }: { label?: string }) => <div className="state"><LoaderCircle className="spin" size={22} />{label}</div>
export const EmptyState = ({ label }: { label: string }) => <div className="state">{label}</div>
export const ErrorState = ({ error }: { error: string }) => <div className="state error">{error}</div>
