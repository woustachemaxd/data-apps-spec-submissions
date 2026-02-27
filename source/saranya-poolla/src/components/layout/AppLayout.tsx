import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Star, Zap, Rocket } from "lucide-react";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground overflow-hidden">

      {/* ================= ANIMATED SIDEBAR ================= */}
      <aside className="
        w-72 border-r border-slate-200 dark:border-slate-700
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur-xl
        shadow-xl
        flex flex-col justify-between
        relative
        overflow-hidden
        animate-in slide-in-from-left-0 duration-700
      ">
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-300 to-purple-300 dark:from-pink-900 dark:to-purple-900 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-20 right-0 w-24 h-24 bg-gradient-to-br from-blue-300 to-cyan-300 dark:from-blue-900 dark:to-cyan-900 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-gradient-to-br from-orange-300 to-pink-300 dark:from-orange-900 dark:to-pink-900 rounded-full opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          <div className="p-6 text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            🎪 SnowCone Intelligence
          </div>

          <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-400 font-medium tracking-wide">
            🚀 AI-Powered Analytics Platform
          </div>

          <nav className="px-3 space-y-1">
            <SidebarItem to="/" label="Dashboard" icon="📊" color="from-blue-500 to-cyan-500" />
            <SidebarItem to="/locations" label="Locations" icon="📍" color="from-green-500 to-emerald-500" />
            <SidebarItem to="/advanced-locations" label="Advanced Analytics" icon="🏢" color="from-purple-500 to-pink-500" />
            <SidebarItem to="/analytics" label="Deep Insights" icon="📈" color="from-orange-500 to-red-500" />
            <SidebarItem to="/predictive-analytics" label="AI Predictions" icon="🤖" color="from-indigo-500 to-purple-500" />
            <SidebarItem to="/real-time" label="Live Operations" icon="⚡" color="from-yellow-500 to-orange-500" />
            <SidebarItem to="/inventory" label="Smart Inventory" icon="📦" color="from-teal-500 to-blue-500" />
            <SidebarItem to="/settings" label="Settings" icon="⚙️" color="from-gray-500 to-slate-500" />
          </nav>
        </div>

        <div className="relative z-10 p-4 border-t border-slate-200 dark:border-slate-700">
          <ThemeToggle />
          <div className="mt-3 flex justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-500 animate-spin" />
            <Star className="h-4 w-4 text-pink-500 animate-pulse" />
            <Zap className="h-4 w-4 text-blue-500 animate-bounce" />
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        <header className="
          h-20 border-b border-slate-200 dark:border-slate-700
          flex items-center justify-between
          px-8
          bg-white/60 dark:bg-slate-900/60
          backdrop-blur-xl
          shadow-sm
          sticky top-0 z-20
        ">
          <div className="flex items-center gap-4">
            <Rocket className="h-8 w-8 text-blue-500 animate-bounce" />
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                🎪 SnowCone Intelligence
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                🚀 Next-Gen Analytics Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Live Analytics
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Real-time insights
              </div>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </header>

        {/* ✅ THIS FIXES EVERYTHING */}
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-white/50 via-transparent to-white/50 dark:from-slate-900/50 dark:via-transparent dark:to-slate-900/50">
          <div className="animate-in fade-in-5 slide-in-from-top-2 duration-700">
            <Outlet />
          </div>
        </main>

        {/* Floating decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full opacity-30 blur-3xl -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200 to-cyan-200 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full opacity-30 blur-3xl translate-y-32 -translate-x-32"></div>
      </div>
    </div>
  );
}

/* ================= SIDEBAR ================= */

function SidebarItem({
  to,
  label,
  icon,
  color,
}: {
  to: string;
  label: string;
  icon: string;
  color: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105
        ${
          isActive
            ? `bg-gradient-to-r ${color} text-white shadow-lg shadow-blue-500/25`
            : "hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-800 dark:hover:to-slate-700 text-slate-700 dark:text-slate-200"
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span className="font-semibold">{label}</span>
      <NavLink
        to={to}
        className={({ isActive }) =>
          isActive ? "ml-auto w-2 h-2 bg-white rounded-full animate-pulse" : ""
        }
      >
        {({ isActive }) => isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
      </NavLink>
    </NavLink>
  );
}
