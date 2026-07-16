'use client';

import * as React from 'react';

interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextType>({
  collapsed: false,
  toggleSidebar: () => {},
  setCollapsed: () => {},
});

export function useSidebar() {
  return React.useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setCollapsed(true);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}
