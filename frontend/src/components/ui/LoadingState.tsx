import React from 'react';

interface LoadingStateProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  label = 'Loading...', 
  size = 'md' 
}) => {
  const getContainerSize = () => {
    switch (size) {
      case 'sm': return '40px';
      case 'md': return '60px';
      case 'lg': return '80px';
      default: return '60px';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      gap: '16px'
    }}>
      <div style={{
        width: getContainerSize(),
        height: getContainerSize(),
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `2px solid rgba(41,121,255,0.1)`,
          borderTop: `2px solid #2979FF`,
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          inset: '12px',
          borderRadius: '50%',
          border: `2px solid rgba(156,39,176,0.1)`,
          borderBottom: `2px solid #9C27B0`,
          animation: 'spin 1.2s linear infinite reverse'
        }} />
      </div>
      {label && (
        <div style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '500'
        }}>
          {label}
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
