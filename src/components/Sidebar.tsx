import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Pill, 
  Bed, 
  BookOpenCheck, 
  CalendarDays, 
  HeartHandshake, 
  Receipt, 
  Sparkles,
  Pin,
  MessageCircle,
  RotateCcw,
  LogOut,
  UserCheck,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Settings,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
  PanelLeftClose,
  PanelLeft,
  Star,
  Check
} from "lucide-react";
import { TabType } from "./NavigationTabs";

interface SidebarProps {
  userRole: "admin" | "staff";
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingMedsCount: number;
  unreadLogsCount: number;
  unpaidFeesCount: number;
  unreadBachecaCount?: number;
  activeOperator: string;
  onResetData: () => void;
  onLogout: () => void;
}

interface MenuItemConfig {
  id: TabType;
  label: string;
  visible: boolean;
  highlighted?: boolean;
}

const DEFAULT_MENU_CONFIG: MenuItemConfig[] = [
  { id: "dashboard", label: "Panoramica", visible: true },
  { id: "shifts", label: "Turni Personale", visible: true, highlighted: true },
  { id: "medications", label: "Somministrazione Farmaci", visible: true },
  { id: "logs", label: "Diario & Consegne", visible: true },
  { id: "residents", label: "Ospiti & Cartelle", visible: true },
  { id: "rooms", label: "Camere & Letti", visible: true },
  { id: "bacheca", label: "Bacheca Avvisi", visible: true },
  { id: "chat", label: "Chat Libera WhatsApp", visible: true },
  { id: "visits", label: "Visite Parenti", visible: true },
  { id: "financials", label: "Rette & Contabilità", visible: true },
  { id: "ai", label: "Assistente PAI (AI)", visible: true }
];

const TAB_ICONS: Record<TabType, React.FC<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  residents: Users,
  medications: Pill,
  rooms: Bed,
  logs: BookOpenCheck,
  shifts: CalendarDays,
  bacheca: Pin,
  chat: MessageCircle,
  visits: HeartHandshake,
  financials: Receipt,
  ai: Sparkles
};

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  activeTab,
  onTabChange,
  pendingMedsCount,
  unreadLogsCount,
  unpaidFeesCount,
  unreadBachecaCount = 0,
  activeOperator,
  onResetData,
  onLogout
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("vannucci_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Load custom menu order and visibility
  const [menuConfig, setMenuConfig] = useState<MenuItemConfig[]>(() => {
    try {
      const saved = localStorage.getItem("vannucci_menu_config_v2");
      if (saved) {
        const parsed = JSON.parse(saved) as MenuItemConfig[];
        // Ensure all default tabs exist in parsed config
        const existingIds = new Set(parsed.map(item => item.id));
        const missing = DEFAULT_MENU_CONFIG.filter(d => !existingIds.has(d.id));
        return [...parsed, ...missing];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_MENU_CONFIG;
  });

  // Save collapsed preference
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("vannucci_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Save custom menu config
  const handleSaveMenuConfig = (newConfig: MenuItemConfig[]) => {
    setMenuConfig(newConfig);
    try {
      localStorage.setItem("vannucci_menu_config_v2", JSON.stringify(newConfig));
    } catch {}
  };

  const handleResetMenuConfig = () => {
    setMenuConfig(DEFAULT_MENU_CONFIG);
    try {
      localStorage.removeItem("vannucci_menu_config_v2");
    } catch {}
  };

  // Drag and drop state inside customize modal
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= menuConfig.length) return;
    const updated = [...menuConfig];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    handleSaveMenuConfig(updated);
  };

  const toggleItemVisibility = (id: TabType) => {
    const updated = menuConfig.map(item => item.id === id ? { ...item, visible: !item.visible } : item);
    handleSaveMenuConfig(updated);
  };

  const toggleItemHighlight = (id: TabType) => {
    const updated = menuConfig.map(item => item.id === id ? { ...item, highlighted: !item.highlighted } : item);
    handleSaveMenuConfig(updated);
  };

  const todayFormatted = new Date().toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // Filter menu items for current user role and visibility settings
  const activeMenuItems = menuConfig.filter(item => {
    // Role filter
    if (userRole !== "admin" && !["shifts", "logs", "bacheca", "chat"].includes(item.id)) {
      return false;
    }
    // Custom visibility filter
    return item.visible;
  });

  const getBadge = (id: TabType) => {
    if (id === "medications" && pendingMedsCount > 0) return { count: pendingMedsCount, color: "bg-rose-500" };
    if (id === "logs" && unreadLogsCount > 0) return { count: unreadLogsCount, color: "bg-amber-500" };
    if (id === "financials" && unpaidFeesCount > 0) return { count: unpaidFeesCount, color: "bg-indigo-500" };
    if (id === "bacheca" && unreadBachecaCount > 0) return { count: unreadBachecaCount, color: "bg-rose-500" };
    return null;
  };

  const handleSelectTab = (tabId: TabType) => {
    onTabChange(tabId);
    setMobileOpen(false);
  };

  // Main Desktop & Mobile Sidebar Content
  const navContent = (
    <div className="flex flex-col h-full justify-between bg-slate-900 text-slate-200 select-none">
      
      {/* Sidebar Header / Brand */}
      <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-black text-sm sm:text-base tracking-tight text-white leading-tight truncate">RESIDENZA VANNUCCI</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
                  Casa Famiglia
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{todayFormatted}</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Espandi Menu" : "Riduci / Nascondi Menu"}
          className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Principale</p>
            <button
              onClick={() => setShowCustomizeModal(true)}
              title="Personalizza voce e ordine del menu"
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Organizza</span>
            </button>
          </div>
        )}

        {activeMenuItems.map((item) => {
          const Icon = TAB_ICONS[item.id] || LayoutDashboard;
          const isActive = activeTab === item.id;
          const badge = getBadge(item.id);
          const isAi = item.id === "ai";

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-3"} py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group ${
                isActive
                  ? isAi 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40" 
                    : "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                  : item.highlighted
                    ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 font-bold"
                    : isAi
                      ? "text-indigo-300 hover:text-white hover:bg-slate-800/80 border border-indigo-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isAi && !isActive ? "text-indigo-400" : ""}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {badge && (
                    <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.count}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                  )}
                </div>
              )}

              {/* Icon badge if collapsed */}
              {isCollapsed && badge && (
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${badge.color}`} />
              )}
            </button>
          );
        })}

        {/* Action to customize if menu items are empty or collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setShowCustomizeModal(true)}
            title="Organizza e Personalizza Menu"
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 mt-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2.5">
        {!isCollapsed && (
          <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/80 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block leading-none font-medium">Operatore In Turno</span>
                <span className="font-bold text-slate-200 truncate block text-xs mt-0.5">{activeOperator}</span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className={`grid ${isCollapsed ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
          <button
            onClick={onLogout}
            title="Disconnetti"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 hover:border-rose-800/50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!isCollapsed && <span>Esci</span>}
          </button>

          <button
            onClick={onResetData}
            title="Ripristina Dati Demo"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-amber-950/40 hover:text-amber-400 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 hover:border-amber-800/50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {!isCollapsed && <span>Demo</span>}
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Left Column Sidebar (lg and above) */}
      <aside 
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-slate-900 border-r border-slate-800 shrink-0 z-30 shadow-xl transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64 xl:w-72"
        }`}
      >
        {navContent}
      </aside>

      {/* Floating Toggle Button on Desktop when Sidebar is Collapsed */}
      {isCollapsed && (
        <button
          onClick={toggleCollapse}
          title="Mostra Menu Principale"
          className="hidden lg:flex fixed top-4 left-3 z-40 p-2 bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-xl shadow-lg border border-slate-700 cursor-pointer transition-all items-center gap-1.5 text-xs font-semibold"
        >
          <PanelLeft className="w-4 h-4 text-emerald-400" />
          <span>Menu</span>
        </button>
      )}

      {/* Mobile Top Header (below lg) */}
      <div className="lg:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-sm">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none text-white">RESIDENZA VANNUCCI</h1>
            <span className="text-[10px] text-emerald-400 font-semibold">Casa Famiglia</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomizeModal(true)}
            title="Personalizza Menu"
            className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-slate-900 z-10 shadow-2xl">
            {navContent}
          </div>
        </div>
      )}

      {/* MENU CUSTOMIZATION MODAL (Organizza / Attiva / Disattiva & Ordina voci) */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">Organizza & Personalizza Menu</h2>
                  <p className="text-xs text-slate-400">Attiva/disattiva le sezioni e trascina dall'alto verso il basso</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of Menu Items with Drag & Reorder */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              <p className="text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 mb-3">
                💡 <strong className="text-slate-200">Suggerimento:</strong> Usa le frecce <ArrowUp className="w-3 h-3 inline text-emerald-400" /> <ArrowDown className="w-3 h-3 inline text-emerald-400" /> o trascina la maniglia per spostare le voci dall'alto verso il basso. Disattiva <EyeOff className="w-3 h-3 inline text-rose-400" /> le funzioni non ancora utilizzate.
              </p>

              {menuConfig.map((item, index) => {
                const Icon = TAB_ICONS[item.id] || LayoutDashboard;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null && draggedIndex !== index) {
                        moveItem(draggedIndex, index);
                        setDraggedIndex(null);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      item.visible 
                        ? "bg-slate-800/80 border-slate-700/80 text-white" 
                        : "bg-slate-900/50 border-slate-800 text-slate-500"
                    } ${draggedIndex === index ? "opacity-40 border-dashed border-emerald-500" : ""}`}
                  >
                    {/* Drag Handle & Icon & Label */}
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.visible ? "bg-slate-700 text-emerald-400" : "bg-slate-800 text-slate-600"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <span className={`text-xs font-semibold ${!item.visible ? "line-through" : ""}`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Actions: Reorder & Show/Hide */}
                    <div className="flex items-center gap-1">
                      {/* Highlight Star */}
                      <button
                        onClick={() => toggleItemHighlight(item.id)}
                        title={item.highlighted ? "Rimuovi Evidenziatore" : "Evidenzia in Menu"}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          item.highlighted
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                            : "bg-slate-800 border-slate-700 text-slate-500 hover:text-amber-400"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Up/Down buttons */}
                      <button
                        onClick={() => moveItem(index, index - 1)}
                        disabled={index === 0}
                        title="Sposta in alto"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => moveItem(index, index + 1)}
                        disabled={index === menuConfig.length - 1}
                        title="Sposta in basso"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Visible Toggle */}
                      <button
                        onClick={() => toggleItemVisibility(item.id)}
                        title={item.visible ? "Nascondi questa voce" : "Mostra questa voce"}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ml-1 ${
                          item.visible
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        }`}
                      >
                        {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <button
                onClick={handleResetMenuConfig}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Ripristina Predefiniti
              </button>

              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salva & Chiudi</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
