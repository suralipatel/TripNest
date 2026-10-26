import React from 'react';
import { Compass, Plus, User } from 'lucide-react';

export default function Navbar({ activeTab, onSelectTab, onQuickAdd }) {
  return (
    <nav className="bottom-nav-bar" aria-label="Bottom Navigation">
      {/* 1. Trips Tab */}
      <button
        type="button"
        className={`nav-tab-item ${activeTab === 'trips' ? 'active' : ''}`}
        onClick={() => onSelectTab('trips')}
      >
        <div className="nav-icon-container">
          <Compass size={22} strokeWidth={activeTab === 'trips' ? 2.5 : 2} />
        </div>
        <span>Trips</span>
      </button>

      {/* 2. Center Quick Add Button */}
      <button
        type="button"
        className="nav-center-action-btn"
        onClick={onQuickAdd}
        title="Add New Trip or Ticket"
        aria-label="Create Trip or Ticket"
      >
        <Plus size={26} strokeWidth={2.6} />
      </button>

      {/* 3. Profile & Settings Tab */}
      <button
        type="button"
        className={`nav-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => onSelectTab('profile')}
      >
        <div className="nav-icon-container">
          <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
        </div>
        <span>Profile</span>
      </button>
    </nav>
  );
}
