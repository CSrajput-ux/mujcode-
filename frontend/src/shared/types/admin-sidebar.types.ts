// ==================================================
// TYPESCRIPT INTERFACES FOR ADMIN SIDEBAR
// Type-safe navigation system
// ==================================================

export type PermissionKey =
    // Dashboard
    | 'admin.dashboard.view'
    // User Management
    | 'user.view'
    | 'user.create.bulk'
    | 'user.student.manage'
    | 'user.faculty.manage'
    | 'faculty.assign'
    | 'company.manage'
    // Content Management
    | 'content.view'
    | 'question.approve'
    | 'course.manage'
    | 'syllabus.configure'
    | 'problem.manage'
    // Placement
    | 'placement.view'
    | 'placement.drive.view'
    | 'placement.criteria.manage'
    | 'placement.offer.manage'
    | 'placement.analytics.view'
    // Assessments
    | 'assessment.view'
    | 'assessment.manage'
    | 'assignment.manage'
    | 'proctoring.view'
    // Analytics
    | 'analytics.view'
    | 'analytics.student.view'
    | 'analytics.faculty.view'
    | 'analytics.platform.view'
    // System
    | 'system.view'
    | 'role.manage'
    | 'logs.view'
    | 'system.configure'
    | 'system.database.manage'
    // Quick Actions
    | 'announcement.create'
    | 'alert.emergency';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BadgeType = 'count' | 'pending' | 'live' | 'violations';
export type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ApiConfig {
    method: HttpMethod;
    endpoint: string;
    contentType?: string;
}

export interface BadgeConfig {
    type: BadgeType;
    source: string; // API endpoint for badge data
    color?: BadgeColor;
}

export interface SidebarItem {
    id: string;
    label: string;
    icon: string; // Lucide icon name
    route?: string;
    permissions: PermissionKey[];
    api?: ApiConfig;
    badge?: BadgeConfig | null;
    features?: string[];
    collapsible?: boolean;
    children?: SidebarItem[];
    color?: string;
}

export interface SidebarSection {
    id: string;
    label: string;
    icon: string;
    route?: string;
    permissions: PermissionKey[];
    badge?: BadgeConfig | null;
    collapsible: boolean;
    children?: SidebarItem[];
}

export interface AdminSidebarConfig {
    version: string;
    lastUpdated: string;
    sections: SidebarSection[];
    quickActions: SidebarItem[];
}

// ==================================================
// PERMISSION CHECK UTILITIES
// ==================================================

export interface UserPermissions {
    permissions: PermissionKey[];
    role: 'admin' | 'faculty' | 'student' | 'company';
}

/**
 * Check if user has required permission
 */
export function hasPermission(
    userPermissions: PermissionKey[],
    requiredPermissions: PermissionKey[]
): boolean {
    return requiredPermissions.some(permission =>
        userPermissions.includes(permission)
    );
}

/**
 * Filter sidebar based on user permissions
 */
export function filterSidebarByPermissions(
    config: AdminSidebarConfig,
    userPermissions: PermissionKey[]
): AdminSidebarConfig {
    const filteredSections = config.sections
        .filter(section => hasPermission(userPermissions, section.permissions))
        .map(section => ({
            ...section,
            children: section.children?.filter(child =>
                hasPermission(userPermissions, child.permissions)
            )
        }))
        .filter(section => !section.children || section.children.length > 0);

    const filteredQuickActions = config.quickActions.filter(action =>
        hasPermission(userPermissions, action.permissions)
    );

    return {
        ...config,
        sections: filteredSections,
        quickActions: filteredQuickActions
    };
}

// ==================================================
// ROUTE HELPERS
// ==================================================

export interface RouteMetadata {
    path: string;
    permissions: PermissionKey[];
    title: string;
    icon: string;
}

/**
 * Extract all routes from sidebar config
 */
export function extractRoutes(config: AdminSidebarConfig): RouteMetadata[] {
    const routes: RouteMetadata[] = [];

    function processItem(item: SidebarItem | SidebarSection) {
        if (item.route) {
            routes.push({
                path: item.route,
                permissions: item.permissions,
                title: item.label,
                icon: item.icon
            });
        }

        if ('children' in item && item.children) {
            item.children.forEach(processItem);
        }
    }

    config.sections.forEach(processItem);
    config.quickActions.forEach(processItem);

    return routes;
}

// ==================================================
// BADGE DATA FETCHING
// ==================================================

export interface BadgeData {
    itemId: string;
    count: number;
    color?: BadgeColor;
}

/**
 * Fetch badge counts for sidebar items
 */
export async function fetchBadgeData(
    items: (SidebarItem | SidebarSection)[]
): Promise<Map<string, BadgeData>> {
    const badgeMap = new Map<string, BadgeData>();

    const fetchPromises = items.flatMap(item => {
        const promises: Promise<void>[] = [];

        if (item.badge?.source) {
            promises.push(
                fetch(item.badge.source)
                    .then(res => res.json())
                    .then(data => {
                        badgeMap.set(item.id, {
                            itemId: item.id,
                            count: data.count || 0,
                            color: item.badge?.color
                        });
                    })
                    .catch(err => console.error(`Failed to fetch badge for ${item.id}:`, err))
            );
        }

        if ('children' in item && item.children) {
            item.children.forEach(child => {
                if (child.badge?.source) {
                    promises.push(
                        fetch(child.badge.source)
                            .then(res => res.json())
                            .then(data => {
                                badgeMap.set(child.id, {
                                    itemId: child.id,
                                    count: data.count || 0,
                                    color: child.badge?.color
                                });
                            })
                            .catch(err => console.error(`Failed to fetch badge for ${child.id}:`, err))
                    );
                }
            });
        }

        return promises;
    });

    await Promise.allSettled(fetchPromises);
    return badgeMap;
}

// ==================================================
// ACTIVE ROUTE DETECTION
// ==================================================

/**
 * Check if route is active (exact or parent match)
 */
export function isRouteActive(currentPath: string, itemRoute: string): boolean {
    return currentPath === itemRoute || currentPath.startsWith(itemRoute + '/');
}

/**
 * Find active section and item
 */
export function findActiveItem(
    config: AdminSidebarConfig,
    currentPath: string
): { section: SidebarSection | null; item: SidebarItem | null } {
    for (const section of config.sections) {
        if (section.route && isRouteActive(currentPath, section.route)) {
            return { section, item: null };
        }

        if (section.children) {
            for (const child of section.children) {
                if (child.route && isRouteActive(currentPath, child.route)) {
                    return { section, item: child };
                }
            }
        }
    }

    return { section: null, item: null };
}
