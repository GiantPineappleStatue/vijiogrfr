import React from 'react';
import Sidebar from './Sidebar';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="content-area">{children}</main>
    </div>
  );
};

export default MainLayout;
