interface EmptyStateProps {
  label: string
}

export const EmptyState = ({ label }: EmptyStateProps) => {
  return (
    <div className="state">
      <span>📭</span>
      {label}
    </div>
  )
}
