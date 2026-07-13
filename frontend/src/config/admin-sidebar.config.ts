// ==================================================
// ADMIN SIDEBAR NAVIGATION CONFIG
// Enterprise-Grade Permission-Based Navigation System
// ==================================================

import type { AdminSidebarConfig } from '../shared/types/admin-sidebar.types';

const ADMIN_SIDEBAR_CONFIG: AdminSidebarConfig = {
    "version": "1.0.0",
    "lastUpdated": "2026-02-08",
    "sections": [
        {
            "id": "dashboard",
            "label": "Dashboard",
            "icon": "LayoutDashboard",
            "route": "/admin/dashboard",
            "permissions": ["admin.dashboard.view"],
            "badge": null,
            "collapsible": false
        },
        {
            "id": "user-management",
            "label": "User Management",
            "icon": "Users",
            "permissions": ["user.view"],
            "collapsible": true,
            "children": [
                {
                    "id": "bulk-student-upload",
                    "label": "Bulk Student Upload",
                    "icon": "UserPlus",
                    "route": "/admin/students/bulk-upload",
                    "permissions": ["user.create.bulk"],
                    "api": {
                        "method": "POST",
                        "endpoint": "/api/admin/students/bulk-upload",
                        "contentType": "multipart/form-data"
                    },
                    "features": [
                        "Excel/CSV import",
                        "Template download",
                        "Validation preview",
                        "Rollback support"
                    ]
                },
                {
                    "id": "student-management",
                    "label": "Manage Students",
                    "icon": "GraduationCap",
                    "route": "/admin/users/students",
                    "permissions": ["user.student.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/students"
                    },
                    "badge": {
                        "type": "count",
                        "source": "/api/admin/students/pending-count"
                    }
                },
                {
                    "id": "faculty-assignment",
                    "label": "Faculty Assignment",
                    "icon": "UserCog",
                    "route": "/admin/users/faculty/assign",
                    "permissions": ["faculty.assign"],
                    "api": {
                        "method": "POST",
                        "endpoint": "/api/admin/faculty/assign"
                    },
                    "features": [
                        "Course-wise assignment",
                        "Section mapping",
                        "Subject allocation",
                        "Load balancing view"
                    ]
                },
                {
                    "id": "faculty-management",
                    "label": "Manage Faculty",
                    "icon": "Users2",
                    "route": "/admin/users/faculty",
                    "permissions": ["user.faculty.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/faculty"
                    }
                },
                {
                    "id": "company-accounts",
                    "label": "Company Accounts",
                    "icon": "Building2",
                    "route": "/admin/users/companies",
                    "permissions": ["company.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/companies"
                    },
                    "features": [
                        "Company registration approval",
                        "Access control",
                        "Drive creation rights",
                        "Analytics access"
                    ]
                }
            ]
        },
        {
            "id": "content-management",
            "label": "Content Management",
            "icon": "BookOpen",
            "permissions": ["content.view"],
            "collapsible": true,
            "children": [
                {
                    "id": "question-bank-approval",
                    "label": "Question Bank Approval",
                    "icon": "FileCheck",
                    "route": "/admin/content/questions/approval",
                    "permissions": ["question.approve"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/questions/pending"
                    },
                    "badge": {
                        "type": "pending",
                        "source": "/api/admin/questions/pending-count",
                        "color": "warning"
                    },
                    "features": [
                        "Pending / Approved / Rejected tabs",
                        "Subject-wise filtering",
                        "Difficulty tagging",
                        "Bulk approve/reject",
                        "Preview with test cases"
                    ]
                },
                {
                    "id": "course-management",
                    "label": "Course Management",
                    "icon": "Layers",
                    "route": "/admin/content/courses",
                    "permissions": ["course.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/courses"
                    },
                    "features": [
                        "CRUD courses",
                        "Module organization",
                        "Access control (public/private)",
                        "Prerequisites setup",
                        "Certificate configuration"
                    ]
                },
                {
                    "id": "syllabus-configuration",
                    "label": "Syllabus Configuration",
                    "icon": "BookMarked",
                    "route": "/admin/content/syllabus",
                    "permissions": ["syllabus.configure"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/syllabus"
                    },
                    "features": [
                        "Course → Semester mapping",
                        "Subject allocation",
                        "Credit hours",
                        "Weightage distribution",
                        "Academic calendar sync"
                    ]
                },
                {
                    "id": "problem-bank",
                    "label": "Coding Problems",
                    "icon": "Code2",
                    "route": "/admin/content/problems",
                    "permissions": ["problem.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/problems"
                    }
                }
            ]
        },
        {
            "id": "placement-management",
            "label": "Placement Management",
            "icon": "Briefcase",
            "permissions": ["placement.view"],
            "collapsible": true,
            "children": [
                {
                    "id": "drive-monitoring",
                    "label": "Drive Monitoring",
                    "icon": "Activity",
                    "route": "/admin/placements",

                    "permissions": ["placement.drive.view"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/placement/drives"
                    },
                    "badge": {
                        "type": "live",
                        "source": "/api/admin/placement/drives/live-count",
                        "color": "success"
                    },
                    "features": [
                        "Real-time drive status",
                        "Student count (Applied/Shortlisted/Placed)",
                        "Live test monitoring",
                        "Eligibility check dashboard",
                        "Round-wise analytics"
                    ]
                },
                {
                    "id": "eligibility-criteria",
                    "label": "Eligibility Criteria",
                    "icon": "Shield",
                    "route": "/admin/placement/eligibility",
                    "permissions": ["placement.criteria.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/placement/eligibility"
                    },
                    "features": [
                        "CGPA cutoff rules",
                        "Backlog policies",
                        "Branch restrictions",
                        "Year-wise eligibility",
                        "Special category rules",
                        "Auto-filter students"
                    ]
                },
                {
                    "id": "offer-management",
                    "label": "Offer Management",
                    "icon": "FileText",
                    "route": "/admin/placement/offers",
                    "permissions": ["placement.offer.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/placement/offers"
                    },
                    "features": [
                        "Offer letter uploads",
                        "Package details",
                        "Acceptance tracking",
                        "Multiple offer handling",
                        "Joining date management",
                        "Statistics & reports"
                    ]
                },
                {
                    "id": "placement-analytics",
                    "label": "Placement Analytics",
                    "icon": "TrendingUp",
                    "route": "/admin/placement/analytics",
                    "permissions": ["placement.analytics.view"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/placement/analytics"
                    }
                }
            ]
        },
        {
            "id": "assessments",
            "label": "Assessments",
            "icon": "ClipboardCheck",
            "permissions": ["assessment.view"],
            "collapsible": true,
            "children": [
                {
                    "id": "test-management",
                    "label": "Tests & Quizzes",
                    "icon": "FileQuestion",
                    "route": "/admin/assessments/tests",
                    "permissions": ["assessment.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/tests"
                    }
                },
                {
                    "id": "assignment-management",
                    "label": "Assignments",
                    "icon": "FileEdit",
                    "route": "/admin/assessments/assignments",
                    "permissions": ["assignment.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/assignments"
                    }
                },
                {
                    "id": "proctoring-logs",
                    "label": "Proctoring Logs",
                    "icon": "Eye",
                    "route": "/admin/assessments/proctoring",
                    "permissions": ["proctoring.view"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/proctoring/logs"
                    },
                    "badge": {
                        "type": "violations",
                        "source": "/api/admin/proctoring/violations-count",
                        "color": "danger"
                    }
                }
            ]
        },
        {
            "id": "analytics-reports",
            "label": "Analytics & Reports",
            "icon": "BarChart3",
            "permissions": ["analytics.view"],
            "collapsible": true,
            "children": [
                {
                    "id": "student-analytics",
                    "label": "Student Progress",
                    "icon": "TrendingUp",
                    "route": "/admin/analytics/students",
                    "permissions": ["analytics.student.view"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/analytics/students"
                    }
                },
                {
                    "id": "faculty-analytics",
                    "label": "Faculty Performance",
                    "icon": "Award",
                    "route": "/admin/analytics/faculty",
                    "permissions": ["analytics.faculty.view"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/analytics/faculty"
                    }
                },
                {
                    "id": "platform-analytics",
                    "label": "Platform Usage",
                    "icon": "Activity",
                    "route": "/admin/analytics/platform",
                    "permissions": ["analytics.platform.view"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/analytics/platform"
                    }
                }
            ]
        },
        {
            "id": "system-security",
            "label": "System & Security",
            "icon": "Settings",
            "permissions": ["system.view"],
            "collapsible": true,
            "children": [
                {
                    "id": "role-permission-manager",
                    "label": "Roles & Permissions",
                    "icon": "ShieldCheck",
                    "route": "/admin/system/roles",
                    "permissions": ["role.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/roles"
                    },
                    "features": [
                        "Role creation",
                        "Permission assignment",
                        "User role mapping",
                        "Permission inheritance",
                        "Access control matrix"
                    ]
                },
                {
                    "id": "audit-logs",
                    "label": "Audit Logs",
                    "icon": "ScrollText",
                    "route": "/admin/system/audit-logs",
                    "permissions": ["logs.view"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/audit-logs"
                    },
                    "features": [
                        "Admin action tracking",
                        "Faculty activity logs",
                        "Login history",
                        "Data modification logs",
                        "Export capabilities",
                        "Real-time monitoring"
                    ]
                },
                {
                    "id": "system-settings",
                    "label": "System Settings",
                    "icon": "Wrench",
                    "route": "/admin/system/settings",
                    "permissions": ["system.configure"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/settings"
                    },
                    "features": [
                        "Email templates",
                        "Notification settings",
                        "Platform branding",
                        "API rate limits",
                        "Maintenance mode",
                        "Backup & restore"
                    ]
                },
                {
                    "id": "database-management",
                    "label": "Database Management",
                    "icon": "Database",
                    "route": "/admin/system/database",
                    "permissions": ["system.database.manage"],
                    "api": {
                        "method": "GET",
                        "endpoint": "/api/admin/database/status"
                    },
                    "features": [
                        "Backup scheduler",
                        "Data export",
                        "Migration tools",
                        "Health monitoring"
                    ]
                }
            ]
        }
    ],

    // Quick Actions (Top of sidebar, always visible)
    "quickActions": [
        {
            "id": "create-announcement",
            "label": "New Announcement",
            "icon": "Megaphone",
            "route": "/admin/announcements/create",
            "permissions": ["announcement.create"],
            "color": "primary"
        },
        {
            "id": "emergency-alert",
            "label": "Emergency Alert",
            "icon": "AlertTriangle",
            "route": "/admin/alerts/emergency",
            "permissions": ["alert.emergency"],
            "color": "danger"
        }
    ]
};

export { ADMIN_SIDEBAR_CONFIG };
export default ADMIN_SIDEBAR_CONFIG;
