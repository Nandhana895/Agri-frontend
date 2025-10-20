import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Sprout, 
  Calendar, 
  Gift, 
  Settings, 
  Shield,
  Leaf
} from 'lucide-react';

const AdminSidebar = ({ active, onSelect }) => {
  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Dashboard & Analytics'
    },
    {
      id: 'users',
      label: 'Farmers',
      icon: Users,
      description: 'Manage Farmers'
    },
    {
      id: 'experts',
      label: 'Experts',
      icon: UserCheck,
      description: 'Expert Management'
    },
    {
      id: 'crops',
      label: 'Crops',
      icon: Sprout,
      description: 'Crop Management'
    },
    {
      id: 'sowing-calendar',
      label: 'Sowing Calendar',
      icon: Calendar,
      description: 'Planting Schedule'
    },
    {
      id: 'schemes',
      label: 'Schemes',
      icon: Gift,
      description: 'Government Schemes'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Profile & Security'
    }
  ];

  return (
    <div className="w-72 bg-white/95 backdrop-blur-xl border-r-2 border-emerald-200/60 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-8 border-b-2 border-emerald-200/60">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Shield className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 bg-clip-text text-transparent">
              AgriSense Pro
            </h2>
            <p className="text-xs text-emerald-600 font-semibold">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="relative z-10 p-5 space-y-2 pb-24 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30'
                  : 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 text-slate-700 hover:text-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className="relative z-10 flex items-center gap-3 p-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 group-hover:text-emerald-700'
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                
                <div className="flex-1 text-left">
                  <div className={`font-semibold text-base transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-slate-900 group-hover:text-emerald-900'
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-xs transition-colors duration-300 ${
                    isActive ? 'text-white/80' : 'text-slate-500 group-hover:text-emerald-600'
                  }`}>
                    {item.description}
                  </div>
                </div>
                
                {/* Arrow indicator */}
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                }`}>
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {/* Hover effect overlay */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-green-600/0 group-hover:from-emerald-500/5 group-hover:to-green-600/5 rounded-2xl transition-all duration-300" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t-2 border-emerald-200/60 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
        <div className="flex items-center gap-3 p-4 bg-white/80 rounded-2xl shadow-lg shadow-emerald-500/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center">
            <Leaf className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-emerald-900">Agricultural Intelligence</div>
            <div className="text-[11px] text-emerald-600">Powered by AI & ML</div>
          </div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
