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
          active={active === 'experts'}
          onClick={() => onSelect('experts')}
          label="Experts"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7z"/></svg>}
        />
        <Item
          active={active === 'crops'}
          onClick={() => onSelect('crops')}
          label="Crops"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"/></svg>}
        />
        <Item
          active={active === 'sowing-calendar'}
          onClick={() => onSelect('sowing-calendar')}
          label="Sowing Calendar"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
        />
        <Item
          active={active === 'schemes'}
          onClick={() => onSelect('schemes')}
          label="Schemes"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18"/></svg>}
        />
        <Item
          active={active === 'irrigation'}
          onClick={() => onSelect('irrigation')}
          label="Irrigation"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M9 3v18"/></svg>}
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


