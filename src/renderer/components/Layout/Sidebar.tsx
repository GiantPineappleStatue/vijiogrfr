import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">Blender/AE Assistant</h1>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
              end
            >
              <span className="nav-icon">📷</span>
              <span className="nav-text">Screen Capture</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <span className="nav-icon">🤖</span>
              <span className="nav-text">AI Assistant</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/documentation"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <span className="nav-icon">📚</span>
              <span className="nav-text">Documentation</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p className="version">v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
