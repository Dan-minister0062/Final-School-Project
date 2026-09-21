<?php

namespace App\Support;

use App\Models\Student;
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

    /**
     * Re-run the parent->student linker for every parent profile. Idempotent:
     * student rows whose parent_id already points at the right parent are left
     * untouched, so repeated calls are cheap. Use after any user write to heal
     * links that a create-order gap may have missed.
     */
    public static function linkAll(): void
    {
        User::where('role', 'parent')
            ->whereNotNull('parent_id')
            ->get()
            ->each(function (User $parentUser): void {
                static::linkParentToStudentUsers($parentUser);
            });
    }

    protected static function linkParentToStudentUsers(User $parentUser): void
    {
        $names = is_array($parentUser->children_names)
            ? array_values(array_filter($parentUser->children_names, 'is_string'))
            : [];

        $students = User::with('student')->where('role', 'student')->get();

        $linked = false;

        foreach ($students as $studentUser) {
            $student = $studentUser->student;
            if (! $student) {
                continue;
            }
            $matched = static::nameMatchesAny($studentUser->name, $names)
                || static::parentFieldsMatch($studentUser, $parentUser);
            if (! $matched) {
                continue;
            }
            static::linkStudentRow($student, $parentUser->parent_id);
            $linked = true;
        }

        // Last-resort fallback: a child typed as a short/partial name (e.g.
        // "Yusuf" for "Yusuf Adam"). Each child name is judged separately and
        // only linked when it points to exactly one unclaimed student, so a
        // generic child name never discards a valid sibling or steals a child
        // that another parent already owns.
        if (! $linked && ! empty($names)) {
            foreach ($names as $childName) {
                $matches = $students->filter(function (User $studentUser) use ($parentUser, $childName): bool {
                    $student = $studentUser->student;
                    if (! $student) {
                        return false;
                    }
                    if ($student->parent_id !== null && $student->parent_id !== $parentUser->parent_id) {
                        return false;
                    }

                    return static::nameContainsMatch($studentUser->name, [$childName]);
                });

                if ($matches->count() === 1) {
                    $studentUser = $matches->first();
                    static::linkStudentRow($studentUser->student, $parentUser->parent_id);
                }
            }
        }

        static::syncParentChildren($parentUser);
    }

    protected static function linkStudentRow(Student $student, ?int $parentId): void
    {
        if (! $parentId) {
            return;
        }
        if ($student->parent_id !== $parentId) {
            $student->parent_id = $parentId;
            $student->save();
        }
    }

    protected static function linkStudentToParentUser(User $studentUser): void
    {
        $student = $studentUser->student;
        if (! $student) {
            return;
        }

        $parentUser = static::resolveParentUser($studentUser);

        if ($parentUser && $parentUser->parent_id) {
            if ($student->parent_id !== $parentUser->parent_id) {
                $student->parent_id = $parentUser->parent_id;
                $student->save();
            }

            static::addChildName($parentUser, $studentUser->name);
            static::syncParentChildren($parentUser);

            return;
        }

        // No parent resolves by email/name: the student row may still have a
        // parent_id already (admin linked them explicitly). In that case keep
        // the parent user's children_names list in sync.
        if ($student->parent_id) {
            $parentUser = User::where('role', 'parent')
                ->where('parent_id', $student->parent_id)
                ->first();
            if ($parentUser) {
                static::addChildName($parentUser, $studentUser->name);
                static::syncParentChildren($parentUser);
            }
        }
    }

    protected static function nameMatchesAny(?string $name, array $names): bool
    {
        if (! $name) {
            return false;
        }

        $normalised = trim(mb_strtolower($name));

        foreach ($names as $candidate) {
            if (trim(mb_strtolower((string) $candidate)) === $normalised) {
                return true;
            }
        }

        return false;
    }

    /**
     * True when the student's full name starts with the child's shorter name
     * (same first token), or the child's longer name starts with the student's
     * name — e.g. "Yusuf" over "Yusuf Adam".
     */
    protected static function nameContainsMatch(?string $studentName, array $names): bool
    {
        if (! $studentName) {
            return false;
        }

        $studentName = trim(mb_strtolower($studentName));
        if ($studentName === '') {
            return false;
        }
        $studentFirst = (string) strtok($studentName, " \t");

        foreach ($names as $child) {
            $child = trim(mb_strtolower((string) $child));
            if ($child === '' || mb_strlen($child) < 2) {
                continue;
            }
            $childFirst = (string) strtok($child, " \t");

            if ($studentFirst === '' || $childFirst === '' || $studentFirst !== $childFirst) {
                continue;
            }

            if (mb_strlen($child) <= mb_strlen($studentName)
                && mb_substr($studentName, 0, mb_strlen($child)) === $child) {
                return true;
            }
            if (mb_strlen($studentName) <= mb_strlen($child)
                && mb_substr($child, 0, mb_strlen($studentName)) === $studentName) {
                return true;
            }
        }

        return false;
    }

    /**
     * A child typed on the student form (parent_name / parent_email) counts as
     * belonging to this parent row, even when the name spelled on the parent
     * form differs slightly.
     */
    protected static function parentFieldsMatch(User $studentUser, User $parentUser): bool
    {
        $email = trim((string) $studentUser->parent_email);
        if ($email !== '') {
            if (mb_strtolower($email) === mb_strtolower(trim((string) $parentUser->email))) {
                return true;
            }
        }

        $name = trim((string) $studentUser->parent_name);
        if ($name === '') {
            return false;
        }
        if (mb_strtolower($name) === mb_strtolower(trim((string) $parentUser->name))) {
            return true;
        }

        return false;
    }

    protected static function resolveParentUser(User $studentUser): ?User
    {
        $email = trim((string) $studentUser->parent_email);
        if ($email !== '') {
            $parent = User::where('role', 'parent')
                ->where('email', $email)
                ->first();

            if ($parent) {
                return $parent;
            }
        }

        $name = trim((string) $studentUser->parent_name);
        if ($name !== '') {
            return User::where('role', 'parent')
                ->where('name', $name)
                ->first();
        }

        return null;
    }

    protected static function addChildName(User $parentUser, ?string $name): void
    {
        if (! $name) {
            return;
        }

        $names = is_array($parentUser->children_names)
            ? array_values(array_filter($parentUser->children_names, 'is_string'))
            : [];

        if (! in_array($name, $names, true)) {
            $names[] = $name;
            $parentUser->children_names = $names;
            $parentUser->save();
        }
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