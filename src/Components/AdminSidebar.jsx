import React from 'react';

const Item = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
      active
        ? 'bg-[var(--ag-primary-50)] text-[var(--ag-primary-700)]'
        : 'text-gray-700 hover:bg-[var(--ag-muted)]'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const AdminSidebar = ({ active = 'overview', onSelect }) => {
  return (
    <aside className="hidden lg:block w-64 p-4">
      <div className="ag-card p-3 space-y-1 sticky top-4">
        <Item
          active={active === 'overview'}
          onClick={() => onSelect('overview')}
          label="Overview"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6"/></svg>}
        />
        <Item
          active={active === 'users'}
          onClick={() => onSelect('users')}
          label="Users"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
        />
        <Item
          active={active === 'crops'}
          onClick={() => onSelect('crops')}
          label="Crops"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"/></svg>}
        />
        <Item
          active={active === 'pests'}
          onClick={() => onSelect('pests')}
          label="Pests & Diseases"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7"/></svg>}
        />
        <Item
          active={active === 'irrigation'}
          onClick={() => onSelect('irrigation')}
          label="Irrigation"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M9 3v18"/></svg>}
        />
        <Item
          active={active === 'reports'}
          onClick={() => onSelect('reports')}
          label="Reports"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10"/></svg>}
        />
        <Item
          active={active === 'settings'}
          onClick={() => onSelect('settings')}
          label="Settings"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3"/></svg>}
        />
      </div>
    </aside>
  );
};

export default AdminSidebar;


