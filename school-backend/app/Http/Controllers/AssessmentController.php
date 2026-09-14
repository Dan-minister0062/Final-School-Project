<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class AssessmentController extends Controller
{
    protected const STATUSES = [
        'draft', 'published', 'pending_marking', 'pending_approval',
        'approved', 'rejected', 'active', 'closed', 'sent_to_students',
    ];
    protected const TYPES = [
        'assignment', 'exam', 'quiz', 'project', 'other',
        'homework', 'test', 'classwork',
    ];
    protected const SUBMISSION_STATUSES = ['submitted', 'graded', 'late', 'approved', 'rejected'];

    // ===== ASSESSMENTS =====

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Assessment::orderBy('id', 'desc');

        if ($user && $user->role === 'teacher') {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)->orWhere('teacher_id', $user->id);
            });
        } elseif ($user && $user->role === 'student') {
            // Students only see assessments sent to (or approved/published for)
            // their own class — never the full catalog.
            $classCode = $user->student?->class_code;
            if ($classCode) {
                // students.class_code may hold the class name (e.g. "Primaire 3A")
                // while assessments.class_code stores the code (e.g. "primary_3a").
                // Resolve both directions so students see every matching assessment.
                $candidates = collect([$classCode])->flatMap(function ($value) {
                    $rows = \App\Models\SchoolClass::where('code', $value)
                        ->orWhere('name', $value)
                        ->get();

                    return array_merge(
                        [$value],
                        $rows->pluck('code')->all(),
                        $rows->pluck('name')->all(),
                    );
                })->unique()->all();

                $query->whereIn('class_code', $candidates)
                    ->whereIn('status', ['sent_to_students', 'published', 'approved']);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($user && $user->role === 'parent') {
            $classValues = $user->parent_id
                ? \App\Models\Student::where('parent_id', $user->parent_id)
                    ->pluck('class_code')
                    ->filter()
                    ->unique()
                    ->values()
                : collect();

            if ($classValues->isNotEmpty()) {
                // students.class_code may hold the class name (e.g. "Primaire 3A")
                // while assessments.class_code stores the code (e.g. "primary_3a").
                // Resolve both directions so parents see every matching assessment.
                $candidates = $classValues->flatMap(function ($value) {
                    $rows = \App\Models\SchoolClass::where('code', $value)
                        ->orWhere('name', $value)
                        ->get();

                    return array_merge(
                        [$value],
                        $rows->pluck('code')->all(),
                        $rows->pluck('name')->all(),
                    );
                })->unique()->all();

                $query->whereIn('class_code', $candidates)
                    ->whereIn('status', ['sent_to_students', 'published', 'approved']);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if ($request->has('class_code') && $req = $request->input('class_code')) {
            $query->where('class_code', $req);
        }
        if ($request->has('subject_code') && $req = $request->input('subject_code')) {
            $query->where('subject_code', $req);
        }
        if ($request->has('status') && in_array($request->input('status'), static::STATUSES, true)) {
            $query->where('status', $request->input('status'));
        }
        if ($request->has('q') && $q = trim($request->input('q'))) {
            $query->where(fn ($qry) => $qry
                ->where('title', 'like', "%{$q}%")
                ->orWhere('teacher_name', 'like', "%{$q}%")
                ->orWhere('class_name', 'like', "%{$q}%"));
        }

        return response()->json([
            'data' => $query->get()->map(fn (Assessment $a) => $this->mapAssessment($a)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:190',
            'type' => 'sometimes|in:' . implode(',', static::TYPES),
            'status' => 'sometimes|in:' . implode(',', static::STATUSES),
            'max_score' => 'sometimes|numeric|min:0',
            'class_code' => 'sometimes|string|max:60',
        ]);

        $data = $request->only([
            'title', 'class_code', 'class_name', 'subject_code', 'subject',
            'type', 'description', 'due_date', 'deadline', 'max_score',
            'status', 'teacher_name', 'attachment_data', 'attachment_name',
            'attachment_type',
        ]);
        $data['type'] = $request->input('type', 'assignment');
        $data['status'] = $request->input('status', 'active');
        $data['due_date'] = $request->input('due_date') ?? $request->input('dueDate') ?? null;
        $data['class_code'] = $request->input('class_code') ?? $request->input('classId') ?? null;
        $data['class_name'] = $request->input('class_name') ?? $request->input('className') ?? null;
        $data['max_score'] = $request->has('max_score') ? $request->input('max_score')
            : ($request->has('totalMarks') ? $request->input('totalMarks') : 20);
        $data['teacher_name'] = $request->input('teacher_name') ?? $request->input('teacherName') ?? null;
        $data['attachment_data'] = $request->input('attachment_data') ?? $request->input('attachmentData') ?? null;
        $data['attachment_name'] = $request->input('attachment_name') ?? $request->input('attachmentName') ?? null;
        $data['attachment_type'] = $request->input('attachment_type') ?? $request->input('attachmentType') ?? null;
        $data['created_by'] = $request->user()?->id;
        $data['teacher_id'] = $request->user()?->id;

        $assessment = Assessment::create($data);

        return response()->json([
            'success' => true,
            'data' => $this->mapAssessment($assessment),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $assessment = Assessment::findOrFail($id);
        $this->authorizeManage($assessment, $request->user());
        $request->validate([
            'title' => 'sometimes|string|max:190',
            'type' => 'sometimes|in:' . implode(',', static::TYPES),
            'status' => 'sometimes|in:' . implode(',', static::STATUSES),
            'max_score' => 'sometimes|numeric|min:0',
            'class_code' => 'sometimes|string|max:60',
        ]);

        $data = $request->only([
            'title', 'class_code', 'class_name', 'subject_code', 'subject',
            'type', 'description', 'due_date', 'deadline', 'max_score',
            'status', 'teacher_name', 'attachment_data', 'attachment_name',
            'attachment_type',
        ]);
        if ($request->has('classId')) {
            $data['class_code'] = $request->input('classId');
        }
        if ($request->has('className')) {
            $data['class_name'] = $request->input('className');
        }
        if ($request->has('totalMarks')) {
            $data['max_score'] = $request->input('totalMarks');
        }

        $assessment->update($data);

        return response()->json([
            'success' => true,
            'data' => $this->mapAssessment($assessment),
        ]);
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:' . implode(',', static::STATUSES)]);
        $assessment = Assessment::findOrFail($id);
        $this->authorizeManage($assessment, $request->user());
        $assessment->update(['status' => $request->input('status')]);

        return response()->json([
            'success' => true,
            'data' => $this->mapAssessment($assessment),
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $assessment = Assessment::findOrFail($id);
        $assessment->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'rejected_by' => null,
            'rejected_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->mapAssessment($assessment),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $assessment = Assessment::findOrFail($id);
        $assessment->update([
            'status' => 'rejected',
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->mapAssessment($assessment),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $assessment = Assessment::findOrFail($id);
        $this->authorizeManage($assessment, $request->user());
        Submission::where('assessment_id', $id)->delete();
        $assessment->delete();

        return response()->json(['success' => true]);
    }

    public function allSubmissions(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Submission::orderBy('id', 'desc');

        if ($user) {
            if ($user->role === 'teacher') {
                $query->whereHas('assessment', function ($q) use ($user) {
                    $q->where('created_by', $user->id)->orWhere('teacher_id', $user->id);
                });
            } elseif ($user->role === 'student') {
                $query->where('student_id', $user->id);
            } elseif ($user->role === 'parent') {
                $query->whereIn('student_id', $this->linkedChildrenIds($user));
            }
        }

        if ($request->has('assessment_id') && $aid = $request->input('assessment_id')) {
            $query->where('assessment_id', $aid);
        }
        if ($request->has('student_id') && $sid = $request->input('student_id')) {
            $query->where('student_id', $sid);
        }

        return response()->json([
            'data' => $query->get()->map(fn (Submission $s) => $this->mapSubmission($s)),
        ]);
    }

    public function assessmentSubmissions(Request $request, int $id): JsonResponse
    {
        $assessment = Assessment::findOrFail($id);
        $this->authorizeManage($assessment, $request->user());
        $submissions = $assessment->submissions()->orderBy('id', 'asc')->get();

        return response()->json([
            'data' => $submissions->map(fn (Submission $s) => $this->mapSubmission($s)),
        ]);
    }

    /**
     * Student single submission: creates or updates the authenticated
     * student's own row for an assessment (never touches other students).
     */
    public function storeOne(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'student') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'assessment_id' => 'required|integer|exists:assessments,id',
            'assessmentId' => 'sometimes|integer|exists:assessments,id',
            'content' => 'nullable|string',
            'file_url' => 'nullable|string|max:2048',
            'file_data' => 'nullable|string',
            'file_name' => 'nullable|string|max:255',
            'file_type' => 'nullable|string|max:120',
        ]);

        $assessmentId = (int) ($request->input('assessment_id') ?? $request->input('assessmentId'));
        $assessment = Assessment::findOrFail($assessmentId);

        if (in_array($assessment->status, ['closed', 'graded'], true)) {
            return response()->json(['message' => 'Assessment is closed.'], 422);
        }

        $submission = Submission::where('assessment_id', $assessmentId)
            ->where('student_id', $user->id)
            ->first();

        $attrs = [
            'content' => $request->input('content'),
            'file_url' => $request->input('file_url'),
            'file_data' => $request->input('file_data'),
            'file_name' => $request->input('file_name'),
            'file_type' => $request->input('file_type'),
            'status' => 'submitted',
            'submitted_at' => $submission?->submitted_at ?? now(),
        ];

        if ($submission) {
            $submission->update($attrs);
        } else {
            $submission = Submission::create(array_merge($attrs, [
                'assessment_id' => $assessmentId,
                'student_id' => $user->id,
                'student_code' => (string) $user->student_id,
                'student_name' => $user->name,
            ]));
        }

        return response()->json([
            'success' => true,
            'data' => $this->mapSubmission($submission),
        ], 201);
    }

    /**
     * Batch upsert submissions/grades for an assessment:
     * replaces existing rows for the assessment with the provided list
     * (matches the teacher "save all grades" UI semantics).
     */
    public function storeSubmissions(Request $request, int $id): JsonResponse
    {
        $assessment = Assessment::findOrFail($id);
        $this->authorizeManage($assessment, $request->user());
        $request->validate([
            'students' => 'required|array',
            'students.*.score' => 'sometimes|numeric|min:0',
            'students.*.status' => 'sometimes|in:' . implode(',', static::SUBMISSION_STATUSES),
            'students.*.student_id' => 'required',
        ]);

        $rows = [];
        foreach ($request->input('students', []) as $student) {
            $studentId = Arr::get($student, 'student_id');
            if ($studentId === null || (string) $studentId === 'undefined') {
                continue;
            }

            $existing = Submission::where('assessment_id', $id)
                ->where('student_id', $studentId)
                ->first();

            $submission = Submission::updateOrCreate(
                ['assessment_id' => $id, 'student_id' => $studentId],
                [
                    'student_code' => Arr::get($student, 'student_code') ?? $existing?->student_code,
                    'student_name' => Arr::get($student, 'student_name') ?? $existing?->student_name ?? 'Student #' . $studentId,
                    'content' => Arr::get($student, 'content') ?? $existing?->content,
                    'file_url' => Arr::get($student, 'file_url') ?? $existing?->file_url,
                    'file_data' => Arr::get($student, 'file_data') ?? $existing?->file_data,
                    'file_name' => Arr::get($student, 'file_name') ?? $existing?->file_name,
                    'file_type' => Arr::get($student, 'file_type') ?? $existing?->file_type,
                    'score' => Arr::get($student, 'score'),
                    'status' => Arr::get($student, 'status', Arr::get($student, 'score') !== null && Arr::get($student, 'score') !== '' ? 'graded' : ($existing?->status ?? 'submitted')),
                    'submitted_at' => $existing?->submitted_at ?? Arr::get($student, 'submitted_at'),
                    'comment' => Arr::get($student, 'comment') ?? Arr::get($student, 'feedback') ?? $existing?->comment,
                ]
            );

            $rows[] = $submission;
        }

        return response()->json([
            'success' => true,
            'data' => array_map(fn (Submission $s) => $this->mapSubmission($s), $rows),
        ], 201);
    }

    public function updateSubmission(Request $request, int $id): JsonResponse
    {
        $submission = Submission::findOrFail($id);
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($user->role === 'teacher') {
            $assessment = Assessment::find($submission->assessment_id);
            if ($assessment) {
                $this->authorizeManage($assessment, $user);
            }
        } elseif ($user->role === 'student') {
            if ($submission->student_id !== $user->id
                || in_array($submission->status, ['graded', 'approved', 'rejected'], true)) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        } elseif ($user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'score' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:' . implode(',', static::SUBMISSION_STATUSES),
        ]);

        $data = $request->only(['score', 'status', 'comment', 'content']);

        // Students may only edit the content of their own ungraded submission.
        if ($user->role === 'student') {
            $data = array_intersect_key($data, array_flip(['content', 'comment']));
        }

        if (array_key_exists('score', $data)) {
            $data['status'] = $request->input('status', $data['score'] !== null ? 'graded' : $submission->status);
        }

        $submission->update($data);

        return response()->json([
            'success' => true,
            'data' => $this->mapSubmission($submission),
        ]);
    }

    public function destroySubmission(Request $request, int $id): JsonResponse
    {
        $submission = Submission::findOrFail($id);
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($user->role === 'teacher') {
            $assessment = Assessment::find($submission->assessment_id);
            if ($assessment) {
                $this->authorizeManage($assessment, $user);
            }
        } elseif ($user->role === 'student') {
            if ($submission->student_id !== $user->id
                || in_array($submission->status, ['graded', 'approved', 'rejected'], true)) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        } elseif ($user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $submission->delete();

        return response()->json(['success' => true]);
    }

    protected function authorizeManage(Assessment $assessment, ?\App\Models\User $user): void
    {
        $allowed = $user && (
            $user->role === 'admin'
            || ($user->role === 'teacher'
                && ($assessment->created_by === $user->id || $assessment->teacher_id === $user->id))
        );

        if (! $allowed) {
            abort(403, 'Forbidden.');
        }
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

    // ===== MAPS =====

    protected function mapAssessment(Assessment $a): array
    {
        return [
            'id' => $a->id,
            'title' => $a->title,
            'class_code' => $a->class_code,
            'classCode' => $a->class_code,
            'class_id' => $a->class_code,
            'classId' => $a->class_code,
            'class_name' => $a->class_name,
            'className' => $a->class_name ?? $a->class_code,
            'subject_code' => $a->subject_code,
            'subjectCode' => $a->subject_code,
            'subject' => $a->subject,
            'type' => $a->type ?? 'assignment',
            'description' => $a->description,
            'attachment' => $a->attachment_data,
            'attachmentData' => $a->attachment_data,
            'attachment_data' => $a->attachment_data,
            'attachmentName' => $a->attachment_name,
            'attachment_name' => $a->attachment_name,
            'attachmentType' => $a->attachment_type,
            'attachment_type' => $a->attachment_type,
            'due_date' => $a->due_date?->format('Y-m-d'),
            'dueDate' => $a->due_date?->format('Y-m-d'),
            'deadline' => $a->deadline?->toIso8601String(),
            'max_score' => (float) ($a->max_score ?? 20),
            'maxScore' => (float) ($a->max_score ?? 20),
            'totalMarks' => (float) ($a->max_score ?? 20),
            'status' => $a->status ?? 'active',
            'approvedByAdmin' => $a->approved_at !== null
                || in_array($a->status, ['approved', 'sent_to_students'], true),
            'approvedAt' => $a->approved_at?->toIso8601String(),
            'approved_at' => $a->approved_at?->toIso8601String(),
            'approvedBy' => $a->approved_by,
            'approved_by' => $a->approved_by,
            'rejectedAt' => $a->rejected_at?->toIso8601String(),
            'rejected_at' => $a->rejected_at?->toIso8601String(),
            'rejectedBy' => $a->rejected_by,
            'rejected_by' => $a->rejected_by,
            'sentToStudentsAt' => $a->sent_to_students_at?->toIso8601String(),
            'sent_to_students_at' => $a->sent_to_students_at?->toIso8601String(),
            'created_by' => $a->created_by,
            'createdBy' => $a->created_by,
            'teacher_id' => $a->teacher_id ?? $a->created_by,
            'teacherId' => $a->teacher_id ?? $a->created_by,
            'teacher_name' => $a->teacher_name,
            'teacherName' => $a->teacher_name,
            'createdAt' => $a->created_at?->toIso8601String(),
            'created_at' => $a->created_at?->toIso8601String(),
            'updatedAt' => $a->updated_at?->toIso8601String(),
            'updated_at' => $a->updated_at?->toIso8601String(),
            '_serverId' => $a->id,
            'source' => 'server',
        ];
    }

    protected function mapSubmission(Submission $s): array
    {
        return [
            'id' => $s->id,
            'assessment_id' => $s->assessment_id,
            'assessmentId' => $s->assessment_id,
            'student_id' => $s->student_id,
            'studentId' => $s->student_id,
            'student_code' => $s->student_code,
            'studentCode' => $s->student_code,
            'student_name' => $s->student_name,
            'studentName' => $s->student_name,
            'content' => $s->content,
            'file_url' => $s->file_url,
            'fileUrl' => $s->file_url,
            'file_data' => $s->file_data,
            'fileData' => $s->file_data,
            'file_name' => $s->file_name,
            'fileName' => $s->file_name,
            'file_type' => $s->file_type,
            'fileType' => $s->file_type,
            'score' => $s->score !== null ? (float) $s->score : null,
            'status' => $s->status,
            'submitted_at' => $s->submitted_at?->toIso8601String(),
            'submittedAt' => $s->submitted_at?->toIso8601String(),
            'submitted_at_raw' => $s->submitted_at,
            'comment' => $s->comment,
            'feedback' => $s->comment,
            'createdAt' => $s->created_at?->toIso8601String(),
            'created_at' => $s->created_at?->toIso8601String(),
            'updatedAt' => $s->updated_at?->toIso8601String(),
            'updated_at' => $s->updated_at?->toIso8601String(),
            '_serverId' => $s->id,
            'source' => 'server',
        ];
    }
}