import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "◉" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-ink-800/50 bg-ink-950/80 px-4 py-6 gap-1 shrink-0 fixed h-full z-40">
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <span className="text-2xl">勉</span>
          <span className="font-display font-bold text-base text-ink-100 tracking-tight">
            Bengo
          </span>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "text-ink-50 bg-ink-800/70"
                  : "text-ink-400 hover:text-ink-200 hover:bg-ink-800/40"
              }`
            }
          >
            <span className="text-base opacity-70">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="mt-auto px-3 py-2">
          <p className="label">v0.1.0</p>
        </div>
      </aside>

      {/* Main content (offset for fixed sidebar) */}
      <main className="flex-1 min-w-0 md:ml-56 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-ink-800/50 bg-ink-950/95 backdrop-blur-md flex justify-around py-2 z-50">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
                isActive ? "text-vermillion-400" : "text-ink-500 hover:text-ink-300"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
