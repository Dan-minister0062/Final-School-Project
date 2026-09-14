<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class AttendanceController extends Controller
{
    protected const STATUSES = ['present', 'absent', 'late', 'excused'];

    public function index(Request $request): JsonResponse
    {
        $query = Attendance::orderBy('date', 'desc')->orderBy('id', 'asc');

        $user = $request->user();
        if ($user) {
            if ($user->role === 'student') {
                $query->where('student_id', $user->id);
            } elseif ($user->role === 'parent') {
                $query->whereIn('student_id', $this->linkedChildrenIds($user));
            } elseif ($user->role === 'teacher') {
                $assigned = $this->assignedClasses($user);
                $query->where(function ($q) use ($user, $assigned) {
                    $q->where('teacher_id', $user->id);
                    if (! empty($assigned)) {
                        $q->orWhereIn('class_code', $assigned);
                    }
                });
            }
        }

        if ($request->has('date') && $date = $request->input('date')) {
            $query->where('date', $date);
        }
        if ($request->has('class_code') && $code = $request->input('class_code')) {
            $query->where('class_code', $code);
        }
        if ($request->has('student_id') && $sid = $request->input('student_id')) {
            $query->where('student_id', $sid);
        }
        if ($request->has('student_code') && $sc = $request->input('student_code')) {
            $query->where('student_code', $sc);
        }
        if ($request->has('status') && in_array($request->input('status'), static::STATUSES, true)) {
            $query->where('status', $request->input('status'));
        }

        return response()->json([
            'data' => $query->get()->map(fn (Attendance $a) => $this->map($a)),
        ]);
    }

    /**
     * Upsert a full day's attendance: clears existing rows for (class_code, date)
     * then stores one row per student (matches "save the whole day" UI semantics).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'class_code' => 'required|string|max:60',
            'date' => 'required|date',
            'students' => 'required|array',
            'students.*.status' => 'sometimes|in:' . implode(',', static::STATUSES),
        ]);

        $classCode = $request->input('class_code');
        $date = $request->input('date');

        $user = $request->user();
        if ($user && $user->role === 'teacher') {
            $assigned = $this->assignedClasses($user);
            if (! empty($assigned) && ! in_array($classCode, $assigned, true)) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        Attendance::where('class_code', $classCode)->where('date', $date)->delete();

        $teacherId = $request->user()?->id;
        $rows = [];
        foreach ($request->input('students', []) as $student) {
            $attrs = $this->studentIdentity($student);
            if ($attrs === null) {
                continue;
            }

            $rows[] = Attendance::create([
                'class_code' => $classCode,
                'student_id' => Arr::get($student, 'student_id'),
                'student_code' => Arr::get($student, 'student_code') ?: $attrs['student_code'],
                'student_name' => Arr::get($student, 'student_name') ?: $attrs['student_name'],
                'date' => $date,
                'status' => Arr::get($student, 'status', 'present'),
                'teacher_id' => $teacherId,
                'remarks' => Arr::get($student, 'remarks') ?: ($request->input('remarks') ?? null),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => array_map(fn (Attendance $a) => $this->map($a), $rows),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'sometimes|in:' . implode(',', static::STATUSES),
        ]);

        $attendance = Attendance::findOrFail($id);
        $attendance->update($request->only(['status', 'remarks', 'student_name']));

        return response()->json([
            'success' => true,
            'data' => $this->map($attendance),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        Attendance::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Build a stable identity fallback for students keyed only by id.
     */
    protected function studentIdentity(array $student): ?array
    {
        $studentId = Arr::get($student, 'student_id');
        $name = Arr::get($student, 'student_name');

        if ($name) {
            return [
                'student_code' => (string) Arr::get($student, 'student_code', $studentId),
                'student_name' => $name,
            ];
        }

        if ($studentId && (string) $studentId !== 'undefined' && (string) $studentId !== '0') {
            return [
                'student_code' => (string) $studentId,
                'student_name' => 'Student #' . $studentId,
            ];
        }

        return null;
    }

    protected function assignedClasses(\App\Models\User $user): array
    {
        $assigned = is_array($user->assigned_classes) ? $user->assigned_classes : [];

        if (empty($assigned)) {
            $assigned = \Illuminate\Support\Facades\DB::table('class_teacher')
                ->where('user_id', $user->id)
                ->pluck('class_code')
                ->all();
        }

        return array_values($assigned);
    }

    protected function linkedChildrenIds(\App\Models\User $user): array
    {
        return \App\Models\User::query()
            ->where('role', 'student')
            ->whereHas('student', function ($q) use ($user) {
                $q->where('parent_id', $user->parent_id);
            })
            ->pluck('id')
            ->all();
    }

    protected function map(Attendance $a): array
    {
        return [
            'id' => $a->id,
            'class_code' => $a->class_code,
            'classCode' => $a->class_code,
            'class_id' => $a->class_code,
            'classId' => $a->class_code,
            'student_id' => $a->student_id,
            'studentId' => $a->student_id,
            'student_code' => $a->student_code,
            'studentCode' => $a->student_code,
            'student_name' => $a->student_name,
            'studentName' => $a->student_name,
            'date' => $a->date?->format('Y-m-d'),
            'status' => $a->status,
            'teacher_id' => $a->teacher_id,
            'teacherId' => $a->teacher_id,
            'remarks' => $a->remarks,
            'createdAt' => $a->created_at?->toIso8601String(),
            'created_at' => $a->created_at?->toIso8601String(),
            'updatedAt' => $a->updated_at?->toIso8601String(),
            'updated_at' => $a->updated_at?->toIso8601String(),
            '_serverId' => $a->id,
            'source' => 'server',
        ];
    }
}