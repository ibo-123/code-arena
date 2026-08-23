import React from "react";

interface EmptyStateProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  label,
  description,
  icon,
}) => {
  return (
    <div className="text-center py-8">
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};
