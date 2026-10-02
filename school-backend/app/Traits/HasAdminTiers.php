<?php

namespace App\Traits;

use App\Models\Section;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Builder;

/**
 * Two admin tiers share the legacy `role = 'admin'` value so that every
 * existing route, query and UI keeps working:
 *
 *   is_super_admin = true  -> Super Admin (full platform control)
 *   is_sub_admin   = true  -> Sub-Admin  (one section only, granular grants)
 *
 * A plain admin with neither flag is treated as a Super Admin for backwards
 * compatibility, so nothing that worked before stops working.
 */
trait HasAdminTiers
{
    public function isSuperAdmin(): bool
    {
        return $this->role === 'admin'
            && ((bool) ($this->attributes['is_super_admin'] ?? false) || ! (bool) ($this->attributes['is_sub_admin'] ?? false));
    }

    public function isSubAdmin(): bool
    {
        return $this->role === 'admin' && (bool) ($this->attributes['is_sub_admin'] ?? false);
    }

    public function isAnyAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /** The section key this account is confined to, or null for Super Admin. */
    public function scopeKey(): ?string
    {
        $key = $this->attributes['section_scope'] ?? null;

        return is_string($key) && $key !== '' ? $key : null;
    }

    public function hasSectionScope(): bool
    {
        return $this->scopeKey() !== null;
    }

    /** @return array<int, string> */
    public function permissionList(): array
    {
        $raw = $this->attributes['permissions'] ?? null;

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : [];
        }
        if (! is_array($raw)) {
            return [];
        }

        $keys = [];
        foreach ($raw as $key) {
            if (is_string($key) && array_key_exists($key, Rbac::catalogue())) {
                $keys[$key] = true;
            }
        }

        return array_keys($keys);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (! $this->isSubAdmin()) {
            return false;
        }

        if (in_array($permission, Rbac::SUPER_ONLY, true)) {
            return false;
        }

        return in_array($permission, $this->permissionList(), true);
    }

    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Whether this account may read section-scoped admin data.
     *
     * Only the two admin tiers are governed here. Teachers, students and
     * parents are not section-scoped admins: their access is derived from
     * class membership in the controllers, so this check must never silently
     * grant or deny them section access.
     */
    public function hasAccessSection(?Section $section): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (! $this->isSubAdmin()) {
            return true;
        }

        $scope = $this->scopeKey();
        if ($scope === null || $section === null) {
            // a Sub-Admin with no configured scope may read nothing
            return false;
        }

        return $section->key === $scope
            || ($this->section_id !== null && (int) $section->id === (int) $this->section_id);
    }

    /** Applies the caller's section restriction to any section-scoped query. */
    public function scopeQueryToSection(Builder $query, string $column = 'section_id'): Builder
    {
        if ($this->isSuperAdmin()) {
            return $query;
        }

        if ($this->section_id !== null) {
            return $query->where($column, $this->section_id);
        }

        $scope = $this->scopeKey();
        if ($scope !== null) {
            return $query->whereHas(
                'section',
                fn ($q) => $q->where('key', $scope)
            );
        }

        return $query->whereRaw('1 = 0');
    }

    /** Classes this account may act on (Super Admin: all). */
    public function allowedClassQuery(Builder $query)
    {
        if ($this->isSuperAdmin()) {
            return $query;
        }

        $scope = $this->scopeKey();
        $sectionId = $this->section_id;

        return $query->where(function ($q) use ($scope, $sectionId) {
            if ($sectionId !== null) {
                $q->where('section_id', $sectionId);
            } elseif ($scope !== null) {
                $q->where('level_key', $scope);
            } else {
                $q->whereRaw('1 = 0');
            }
        });
    }
}