import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyRouteProps {
  children: React.ReactNode;
}

const LazyRoute: React.FC<LazyRouteProps> = ({ children }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

export default LazyRoute;
