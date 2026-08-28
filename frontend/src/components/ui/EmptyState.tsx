import React from 'react';

interface EmptyStateProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ label, description, icon }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      gap: '8px',
      textAlign: 'center'
    }}>
      {icon && (
        <div style={{ marginBottom: '8px' }}>
          {icon}
        </div>
      )}
      <p style={{
        fontSize: '16px',
        color: 'rgba(255,255,255,0.5)',
        margin: 0
      }}>
        {label}
      </p>
      {description && (
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.3)',
          margin: 0
        }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
