import React from "react";
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
  UserCheck
} from "lucide-react";

export type TabType = 
  | "dashboard" 
  | "residents" 
  | "medications" 
  | "rooms" 
  | "logs" 
  | "shifts" 
  | "staff_directory"
  | "bacheca"
  | "chat"
  | "visits" 
  | "financials" 
  | "ai";

interface NavigationTabsProps {
  userRole: "admin" | "staff";
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingMedsCount: number;
  unreadLogsCount: number;
  unpaidFeesCount: number;
  unreadBachecaCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  userRole,
  activeTab,
  onTabChange,
  pendingMedsCount,
  unreadLogsCount,
  unpaidFeesCount,
  unreadBachecaCount = 0
}) => {
  const tabs = [
    { id: "dashboard" as TabType, label: "Panoramica", icon: LayoutDashboard },
    { id: "residents" as TabType, label: "Ospiti & Cartelle", icon: Users },
    { 
      id: "medications" as TabType, 
      label: "Somministrazione Farmaci", 
      icon: Pill, 
      badge: pendingMedsCount > 0 ? pendingMedsCount : undefined,
      badgeColor: "bg-rose-500"
    },
    { id: "rooms" as TabType, label: "Camere & Letti", icon: Bed },
    { 
      id: "logs" as TabType, 
      label: "Diario & Consegne", 
      icon: BookOpenCheck,
      badge: unreadLogsCount > 0 ? unreadLogsCount : undefined,
      badgeColor: "bg-amber-500"
    },
    { id: "shifts" as TabType, label: "Turni Personale", icon: CalendarDays },
    { id: "staff_directory" as TabType, label: "Personale", icon: UserCheck },
    { 
      id: "bacheca" as TabType, 
      label: "Bacheca Avvisi", 
      icon: Pin,
      badge: unreadBachecaCount > 0 ? unreadBachecaCount : undefined,
      badgeColor: "bg-rose-500"
    },
    { id: "chat" as TabType, label: "Chat Libera WhatsApp", icon: MessageCircle },
    { id: "visits" as TabType, label: "Visite Parenti", icon: HeartHandshake },
    { 
      id: "financials" as TabType, 
      label: "Rette & Contabilità", 
      icon: Receipt,
      badge: unpaidFeesCount > 0 ? unpaidFeesCount : undefined,
      badgeColor: "bg-indigo-500"
    },
    { id: "ai" as TabType, label: "Assistente PAI (AI)", icon: Sparkles, isAi: true }
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-300 overflow-x-auto no-scrollbar sticky top-16 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 py-2">
          {tabs.filter(t => userRole === "admin" || t.id === "shifts" || t.id === "staff_directory" || t.id === "logs" || t.id === "bacheca" || t.id === "chat").map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? tab.isAi 
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40" 
                      : "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                    : tab.isAi
                      ? "text-indigo-300 hover:text-white hover:bg-slate-800/80 border border-indigo-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tab.isAi && !isActive ? "text-indigo-400" : ""}`} />
                <span>{tab.label}</span>

                {tab.badge !== undefined && (
                  <span className={`ml-1 text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
