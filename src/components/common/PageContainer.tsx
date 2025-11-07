import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      {children}
    </div>
  );
}