import React from 'react';
import { Home, Users, UserCog, Sprout, Calendar, FileText, Droplets, Settings, Shield, ChevronRight } from 'lucide-react';

const Item = ({ active, onClick, icon: Icon, label, description }) => (
  <button
    onClick={onClick}
    className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
        : 'text-gray-700 hover:bg-emerald-50 hover:scale-[1.01]'
    }`}
  >
    <div className={`p-2 rounded-lg transition-all ${
      active 
        ? 'bg-white/20' 
        : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'
    }`}>
      <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-sm truncate">{label}</div>
      <div className={`text-xs truncate ${active ? 'text-emerald-100' : 'text-gray-500'}`}>
        {description}
      </div>
    </div>
    {active && (
      <ChevronRight className="w-4 h-4 text-white/80" />
    )}
  </button>
);

const AdminSidebar = ({ active = 'overview', onSelect }) => {
  return (
    <aside className="hidden lg:block w-72 bg-white/95 backdrop-blur-xl border-r border-emerald-200/50 shadow-2xl shadow-emerald-500/5 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
      <div className="p-4">
        {/* Admin Badge Header */}
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Shield className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-900">Admin Control Panel</h2>
              <p className="text-xs text-emerald-600">System Management</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <Item
            active={active === 'overview'}
            onClick={() => onSelect('overview')}
            label="Overview"
            description="Dashboard & Analytics"
            icon={Home}
          />
          <Item
            active={active === 'users'}
            onClick={() => onSelect('users')}
            label="Users"
            description="Manage all users"
            icon={Users}
          />
          <Item
            active={active === 'experts'}
            onClick={() => onSelect('experts')}
            label="Experts"
            description="Expert management"
            icon={UserCog}
          />
          <Item
            active={active === 'crops'}
            onClick={() => onSelect('crops')}
            label="Crops"
            description="Crop database"
            icon={Sprout}
          />
          <Item
            active={active === 'sowing-calendar'}
            onClick={() => onSelect('sowing-calendar')}
            label="Sowing Calendar"
            description="Seasonal planning"
            icon={Calendar}
          />
          <Item
            active={active === 'schemes'}
            onClick={() => onSelect('schemes')}
            label="Schemes"
            description="Government programs"
            icon={FileText}
          />
          <Item
            active={active === 'irrigation'}
            onClick={() => onSelect('irrigation')}
            label="Irrigation"
            description="Water management"
            icon={Droplets}
          />
          <Item
            active={active === 'settings'}
            onClick={() => onSelect('settings')}
            label="Settings"
            description="Profile & security"
            icon={Settings}
          />
        </nav>

        {/* System Status Footer */}
        <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-emerald-900">System Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-emerald-700">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;


