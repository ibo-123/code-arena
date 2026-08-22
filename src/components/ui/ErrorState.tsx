interface ErrorStateProps {
  error: string
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="state error">
      <span>⚠</span>
      {error}
    </div>
  )
}
