// ==================================================
// ADMIN SIDEBAR COMPONENT - Enterprise Grade
// Permission-based rendering with real-time badges
// ==================================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ChevronDown, ChevronRight,
    LayoutDashboard, Users, BookOpen, Briefcase,
    ClipboardCheck, BarChart3, Settings,
    UserPlus, GraduationCap, UserCog, Users2, Building2,
    FileCheck, Layers, BookMarked, Code2,
    Activity, Shield, FileText, TrendingUp,
    FileQuestion, FileEdit, Eye,
    Award, ShieldCheck, ScrollText, Wrench, Database,
    Megaphone, AlertTriangle
} from 'lucide-react';
import ADMIN_SIDEBAR_CONFIG from '../../../config/admin-sidebar.config';
import {
    filterSidebarByPermissions,
    isRouteActive,
    fetchBadgeData,
    type SidebarSection,
    type SidebarItem,
    type BadgeData,
    type PermissionKey
} from '../../../shared/types/admin-sidebar.types';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<any>> = {
    LayoutDashboard, Users, BookOpen, Briefcase, ClipboardCheck, BarChart3, Settings,
    UserPlus, GraduationCap, UserCog, Users2, Building2,
    FileCheck, Layers, BookMarked, Code2,
    Activity, Shield, FileText, TrendingUp,
    FileQuestion, FileEdit, Eye, Award,
    ShieldCheck, ScrollText, Wrench, Database,
    Megaphone, AlertTriangle
};

interface AdminSidebarProps {
    userPermissions: string[];
    collapsed?: boolean;
}

export function AdminSidebar({ userPermissions, collapsed = false }: AdminSidebarProps) {
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [badges, setBadges] = useState<Map<string, BadgeData>>(new Map());
    const [isCollapsed, setIsCollapsed] = useState(collapsed);

    // Filter sidebar based on permissions
    const filteredConfig = filterSidebarByPermissions(ADMIN_SIDEBAR_CONFIG, userPermissions as PermissionKey[]);

    // Load badge data
    useEffect(() => {
        const loadBadges = async () => {
            const badgeData = await fetchBadgeData(filteredConfig.sections);
            setBadges(badgeData);
        };

        loadBadges();

        // Poll for updates every 30 seconds
        const interval = setInterval(loadBadges, 30000);
        return () => clearInterval(interval);
    }, [userPermissions]);

    // Auto-expand active section
    useEffect(() => {
        filteredConfig.sections.forEach((section: SidebarSection) => {
            if (section.children) {
                const hasActiveChild = section.children.some((child: SidebarItem) =>
                    child.route && isRouteActive(location.pathname, child.route)
                );
                if (hasActiveChild) {
                    setExpandedSections(prev => new Set(prev).add(section.id));
                }
            }
        });
    }, [location.pathname]);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const renderIcon = (iconName: string, className?: string) => {
        const Icon = ICON_MAP[iconName];
        return Icon ? <Icon className={className} size={20} /> : null;
    };

    const renderBadge = (itemId: string) => {
        const badge = badges.get(itemId);
        if (!badge || badge.count === 0) return null;

        const colorClasses = {
            primary: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            danger: 'bg-red-500',
            info: 'bg-cyan-500'
        };

        return (
            <span className={`
        ml-auto px-2 py-0.5 text-xs font-semibold rounded-full
        ${colorClasses[badge.color || 'primary']} text-white
      `}>
                {badge.count > 99 ? '99+' : badge.count}
            </span>
        );
    };

    const renderSidebarItem = (item: SidebarItem, isChild = false) => {
        const active = item.route && isRouteActive(location.pathname, item.route);

        return (
            <Link
                key={item.id}
                to={item.route || '#'}
                className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all
          ${isChild ? 'ml-6' : ''}
          ${active
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
          ${isCollapsed && !isChild ? 'justify-center' : ''}
        `}
            >
                {renderIcon(item.icon, active ? 'text-white' : 'text-gray-500 dark:text-gray-400')}
                {!isCollapsed && (
                    <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {renderBadge(item.id)}
                    </>
                )}
            </Link>
        );
    };

    const renderSection = (section: SidebarSection) => {
        const isExpanded = expandedSections.has(section.id);
        const hasChildren = section.children && section.children.length > 0;
        const active = section.route && isRouteActive(location.pathname, section.route);

        if (!hasChildren && section.route) {
            // Single item section
            return (
                <div key={section.id} className="mb-2">
                    {renderSidebarItem(section as any)}
                </div>
            );
        }

        return (
            <div key={section.id} className="mb-2">
                {/* Section Header */}
                <button
                    onClick={() => toggleSection(section.id)}
                    className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
            ${active
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
            ${isCollapsed ? 'justify-center' : ''}
          `}
                >
                    {renderIcon(section.icon, active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400')}
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left font-semibold">{section.label}</span>
                            {renderBadge(section.id)}
                            {hasChildren && (
                                isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                            )}
                        </>
                    )}
                </button>

                {/* Children */}
                {!isCollapsed && hasChildren && isExpanded && (
                    <div className="mt-1 space-y-1">
                        {section.children!.map((child: SidebarItem) => renderSidebarItem(child, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`
      flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
      transition-all duration-300
      ${isCollapsed ? 'w-20' : 'w-72'}
    `}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            MujCode Admin
                        </h1>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            {!isCollapsed && filteredConfig.quickActions.length > 0 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Quick Actions
                    </h3>
                    <div className="space-y-2">
                        {filteredConfig.quickActions.map((action: SidebarItem) => (
                            <Link
                                key={action.id}
                                to={action.route || '#'}
                                className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-all
                  ${action.color === 'danger'
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                                    }
                `}
                            >
                                {renderIcon(action.icon, 'text-white')}
                                <span className="font-medium">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                {filteredConfig.sections.map((section: SidebarSection) => renderSection(section))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                {!isCollapsed && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p>Version {ADMIN_SIDEBAR_CONFIG.version}</p>
                        <p className="mt-1">Last updated: {ADMIN_SIDEBAR_CONFIG.lastUpdated}</p>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default AdminSidebar;
