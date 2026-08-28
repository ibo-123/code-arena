import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      gap: '12px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '8px'
      }}>
        ⚠️
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#FF6B6B',
        margin: 0
      }}>
        Something went wrong
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        maxWidth: '400px',
        margin: 0
      }}>
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '12px',
            padding: '8px 24px',
            borderRadius: '8px',
            background: '#2979FF',
            border: 'none',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background 0.3s ease'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
