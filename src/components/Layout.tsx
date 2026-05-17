import { NavLink, Outlet } from "react-router-dom";

const SIDEBAR_ITEMS = [
  { to: "/", label: "Dashboard", icon: "◉" },
  { to: "/study-path", label: "Study Path", icon: "🗺" },
  { to: "/placement", label: "Placement", icon: "🎯" },
  { to: "/lessons", label: "Lessons", icon: "📖" },
  { to: "/kanji", label: "Kanji", icon: "字" },
  { to: "/vocab", label: "Vocabulary", icon: "語" },
  { to: "/grammar", label: "Grammar", icon: "文" },
  { to: "/reviews", label: "Reviews", icon: "↻" },
  { to: "/quiz", label: "Quiz", icon: "⚡" },
  { to: "/reading", label: "Reading", icon: "📄" },
  { to: "/weak-points", label: "Weak Points", icon: "△" },
  { to: "/content-tools", label: "Content Tools", icon: "🔧" },
  { to: "/sources", label: "About / Sources", icon: "ℹ" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

// Mobile bottom nav: only the most-used pages (5 max for thumb reach)
const MOBILE_ITEMS = [
  { to: "/", label: "Home", icon: "◉" },
  { to: "/lessons", label: "Learn", icon: "📖" },
  { to: "/kanji", label: "Kanji", icon: "字" },
  { to: "/grammar", label: "Grammar", icon: "文" },
  { to: "/settings", label: "More", icon: "⚙" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-ink-800/50 bg-ink-950/80 px-4 py-6 gap-0.5 shrink-0 fixed h-full z-40">
        <div className="flex items-center gap-2.5 px-3 mb-6">
          <span className="text-2xl">勉</span>
          <span className="font-display font-bold text-base text-ink-100 tracking-tight">
            Bengo
          </span>
        </div>

        {SIDEBAR_ITEMS.map((item, i) => (
          <div key={item.to}>
            {/* Divider before Reviews group */}
            {i === 7 && <div className="border-t border-ink-800/40 my-2" />}
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "text-ink-50 bg-ink-800/70"
                    : "text-ink-400 hover:text-ink-200 hover:bg-ink-800/40"
                }`
              }
            >
              <span className="text-sm w-5 text-center opacity-70">{item.icon}</span>
              {item.label}
            </NavLink>
          </div>
        ))}

        <div className="mt-auto px-3 py-2">
          <p className="label">v1.2.08</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:ml-56 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-ink-800/50 bg-ink-950/95 backdrop-blur-md flex justify-around py-2 z-50">
        {MOBILE_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-vermillion-400" : "text-ink-500 hover:text-ink-300"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
