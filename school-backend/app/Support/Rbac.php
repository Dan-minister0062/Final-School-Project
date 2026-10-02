<?php

namespace App\Support;

use App\Models\Section;
use App\Models\User;

/**
 * Single source of truth for the RBAC permission catalogue.
 *
 * A Sub-Admin is created by a Super Admin, is pinned to exactly one section,
 * and only ever holds the permissions granted here. Nothing outside this class
 * may invent permission keys.
 */
class Rbac
{
    /** Admin tiers. `admin` + is_super_admin = Super Admin, admin + is_sub_admin = Sub-Admin. */
    public const TIER_SUPER = 'super_admin';

    public const TIER_SUB = 'sub_admin';

    public const SECTION_KEYS = [
        Section::KEY_KINDERGARTEN,
        Section::KEY_PRIMARY,
        Section::KEY_SECONDARY,
        Section::KEY_HIGH_SCHOOL,
    ];

    /**
     * Every grantable permission with its resource group.
     * Sub-Admins can NEVER receive: admin.*, settings.global, audit.view, finance.view.
     */
    public const PERMISSIONS = [
        // ---- users (scoped to own section) ----
        'users.view' => 'Users',
        'users.create' => 'Users',
        'users.update' => 'Users',
        'users.suspend' => 'Users',
        'users.delete' => 'Users',

        // ---- classes (scoped to own section) ----
        'classes.view' => 'Classes',
        'classes.create' => 'Classes',
        'classes.update' => 'Classes',
        'classes.delete' => 'Classes',
        'classes.assign_teacher' => 'Classes',

        // ---- lessons / content ----
        'lessons.view' => 'Lessons',
        'lessons.create' => 'Lessons',
        'lessons.update' => 'Lessons',
        'lessons.publish' => 'Lessons',
        'lessons.archive' => 'Lessons',
        'lessons.delete' => 'Lessons',
        'lessons.duplicate' => 'Lessons',
        'lessons.grade' => 'Lessons',

        // ---- attendance ----
        'attendance.view' => 'Attendance',
        'attendance.take' => 'Attendance',
        'attendance.update' => 'Attendance',

        // ---- grades / assessments ----
        'grades.view' => 'Grades',
        'grades.manage' => 'Grades',
        'grades.approve' => 'Grades',

        // ---- announcements ----
        'announcements.view' => 'Announcements',
        'announcements.create' => 'Announcements',
        'announcements.update' => 'Announcements',
        'announcements.delete' => 'Announcements',

        // ---- registrations / admissions ----
        'registrations.view' => 'Registrations',
        'registrations.review' => 'Registrations',

        // ---- reports / analytics ----
        'reports.view' => 'Reports',
        'reports.view_section' => 'Reports',

        // ---- subjects ----
        'subjects.view' => 'Subjects',
        'subjects.manage' => 'Subjects',

        // ---- messages ----
        'messages.view' => 'Messages',
        'messages.reply' => 'Messages',

        // ---- settings ----
        'settings.view' => 'Settings',
        'settings.update' => 'Settings',
        'settings.section' => 'Settings',
    ];

    /** Permissions that can never be granted to a Sub-Admin. */
    public const SUPER_ONLY = [
        'admins.manage',
        'admins.permissions',
        'sections.manage',
        'settings.global',
        'audit.view',
        'finance.view',
        'reports.view_global',
        'users.global',
    ];

    /**
     * Upper bound on Super Admin accounts. The institution must keep at least
     * one Super Admin, so promotion is refused once this many exist.
     */
    public const MAX_SUPER_ADMINS = 5;

    /** Sensible default grant for a newly created Sub-Admin. */
    public const SUB_ADMIN_DEFAULTS = [
        'users.view', 'users.create', 'users.update',
        'classes.view', 'classes.update', 'classes.assign_teacher',
        'lessons.view', 'lessons.create', 'lessons.update', 'lessons.publish', 'lessons.grade',
        'attendance.view', 'attendance.take',
        'grades.view', 'grades.manage',
        'announcements.view', 'announcements.create',
        'registrations.view',
        'reports.view_section',
        'subjects.view',
        'messages.view',
    ];

    /**
     * @return array<string, string> permission => group label
     */
    public static function catalogue(): array
    {
        return self::PERMISSIONS;
    }

    /**
     * Permission keys a Sub-Admin is allowed to hold.
     *
     * @return array<int, string>
     */
    public static function grantableKeys(): array
    {
        return array_keys(self::PERMISSIONS);
    }

    /**
     * Normalise a requested permission list: drop unknown keys and anything
     * reserved for Super Admins.
     *
     * @param  array<int, string>|null  $requested
     * @return array<int, string>
     */
    public static function sanitizeGrantable(?array $requested): array
    {
        if (! is_array($requested)) {
            return [];
        }

        $out = [];
        foreach ($requested as $key) {
            if (! is_string($key)) {
                continue;
            }
            $key = trim($key);
            if ($key === '') {
                continue;
            }
            if (in_array($key, self::SUPER_ONLY, true)) {
                continue;
            }
            if (! array_key_exists($key, self::PERMISSIONS)) {
                continue;
            }
            $out[$key] = true;
        }

        return array_keys($out);
    }

    /**
     * @return array<int, string>
     */
    public static function defaults(): array
    {
        return array_values(self::sanitizeGrantable(self::SUB_ADMIN_DEFAULTS));
    }

    /**
     * Every account that currently resolves to the Super Admin tier.
     *
     * This counts legacy admins (role = admin with neither flag set) too,
     * because HasAdminTiers treats them as Super Admins. Counting only the
     * `is_super_admin` column would therefore under-report and let the
     * "keep at least one Super Admin" guard be bypassed.
     */
    public static function superAdminCount(?int $exceptUserId = null): int
    {
        return User::query()
            ->where('role', 'admin')
            ->where(static function ($q) {
                $q->where('is_super_admin', true)
                    ->orWhere(static function ($q) {
                        $q->where('is_super_admin', false)
                            ->where('is_sub_admin', false);
                    });
            })
            ->when($exceptUserId !== null, static fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->count();
    }
}