<?php

namespace App\Services;

use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Central place where "which rows may this caller read?" is decided, so every
 * admin endpoint scopes identically instead of re-implementing the rules.
 */
class SectionScope
{
    /**
     * Restrict a User query to the section the caller governs.
     * Super Admin -> untouched.
     */
    public function users(Request $request, $query)
    {
        $user = $request->user();

        if (! $user || $user->isSuperAdmin()) {
            return $query;
        }

        if ($user->isSubAdmin()) {
            return $this->sectionIdOrFalse($query, $user->section_id);
        }

        return $query;
    }

    public function classes(Request $request, $query)
    {
        $user = $request->user();

        if (! $user || $user->isSuperAdmin()) {
            return $query;
        }

        return $user->allowedClassQuery($query);
    }

    public function assertUserInScope(Request $request, User $target): void
    {
        $user = $request->user();

        if (! $user || $user->isSuperAdmin()) {
            return;
        }

        if ($user->isSubAdmin()) {
            abort_if(
                (int) $target->section_id !== (int) $user->section_id,
                403,
                'That user belongs to another section.'
            );
        }
    }

    public function assertClassInScope(Request $request, ?SchoolClass $class): void
    {
        $user = $request->user();

        if (! $user || $user->isSuperAdmin() || ! $class) {
            return;
        }

        if ($class->section_id !== null) {
            abort_if((int) $class->section_id !== (int) $user->section_id, 403, 'That class belongs to another section.');
        }
    }

    public function assertSection(Request $request, Section $section): void
    {
        $user = $request->user();
        abort_if(! $user->hasAccessSection($section), 403, 'You do not have access to this section.');
    }

    /** @return int|false */
    private function sectionIdOrFalse($query, ?int $sectionId)
    {
        if ($sectionId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('section_id', $sectionId);
    }
}