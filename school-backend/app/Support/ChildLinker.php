<?php

namespace App\Support;

use App\Models\User;

/**
 * Wires the parent<->student relationship in the database.
 *
 * - For a parent user: links every student user whose name appears in
 *   `children_names` to the parent row and mirrors the list into
 *   `parents.children` (kept as `[['name' => ...], ...]`).
 * - For a student user: looks up a parent user by `parent_email` (then
 *   `parent_name`) and links the student row to that parent, also adding the
 *   child's name to the parent's `children_names`.
 */
class ChildLinker
{
    public static function link(User $user): void
    {
        if ($user->role === 'parent' && $user->parent_id) {
            static::linkParentToStudentUsers($user);

            return;
        }

        if ($user->role === 'student' && $user->student_id) {
            static::linkStudentToParentUser($user);
        }
    }

    protected static function linkParentToStudentUsers(User $parentUser): void
    {
        $names = is_array($parentUser->children_names)
            ? array_values(array_filter($parentUser->children_names, 'is_string'))
            : [];

        if (! empty($names)) {
            User::with('student')
                ->where('role', 'student')
                ->whereIn('name', $names)
                ->get()
                ->each(function (User $studentUser) use ($parentUser): void {
                    $student = $studentUser->student;
                    if ($student && $student->parent_id !== $parentUser->parent_id) {
                        $student->parent_id = $parentUser->parent_id;
                        $student->save();
                    }
                });
        }

        static::syncParentChildren($parentUser);
    }

    protected static function linkStudentToParentUser(User $studentUser): void
    {
        $parentUser = static::resolveParentUser($studentUser);

        if (! $parentUser || ! $parentUser->parent_id) {
            return;
        }

        $student = $studentUser->student;
        if ($student && $student->parent_id !== $parentUser->parent_id) {
            $student->parent_id = $parentUser->parent_id;
            $student->save();
        }

        $names = is_array($parentUser->children_names)
            ? array_values($parentUser->children_names)
            : [];

        if (! in_array($studentUser->name, $names, true) && $studentUser->name) {
            $names[] = $studentUser->name;
            $parentUser->children_names = $names;
            $parentUser->save();
        }

        static::syncParentChildren($parentUser);
    }

    protected static function resolveParentUser(User $studentUser): ?User
    {
        if ($studentUser->parent_email) {
            $parent = User::where('role', 'parent')
                ->where('email', $studentUser->parent_email)
                ->first();

            if ($parent) {
                return $parent;
            }
        }

        if ($studentUser->parent_name) {
            return User::where('role', 'parent')
                ->where('name', $studentUser->parent_name)
                ->first();
        }

        return null;
    }

    protected static function syncParentChildren(User $parentUser): void
    {
        $parent = $parentUser->parent;
        if (! $parent) {
            return;
        }

        $names = is_array($parentUser->children_names)
            ? array_values(array_filter($parentUser->children_names, 'is_string'))
            : [];

        $parent->children = array_map(fn (string $name) => ['name' => $name], $names);
        $parent->save();
    }
}