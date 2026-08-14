import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import './Home.css';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
  };

  return (
    <div className={`home-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="home-main">
        <Topbar 
          searchQuery={searchQuery} 
          onSearchChange={handleSearchChange} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <div className="home-content">
          <Outlet context={{ searchQuery }} />
        </div>
      </div>
    </div>
  );
}