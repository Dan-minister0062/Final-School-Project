<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use App\Models\LessonAssignment;
use App\Models\LessonContentBlock;
use App\Models\LessonProgress;
use App\Models\LessonSubmission;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class LessonController extends Controller
{
    public function __construct(private AuditLogger $audit) {}

    // ---------------------------------------------------------------- helpers

    private function resolveSection(Request $request): Section
    {
        $user = $request->user();
        $sectionId = $request->integer('section_id') ?: null;
        $sectionKey = $request->string('section')->toString();

        $section = $sectionId
            ? Section::find($sectionId)
            : ($sectionKey !== '' ? Section::where('key', $sectionKey)->first() : null);

        if (! $section && $user->isSubAdmin()) {
            $section = Section::where('key', $user->scopeKey())->first();
        }

        abort_if(! $section, 422, 'A valid section is required.');

        // Cross-section access is blocked here, before any data is read.
        if (! $user->hasAccessSection($section)) {
            $this->audit->denied('lesson.section_denied', $user, [
                'requested_section' => $section->key,
            ]);

            abort(403, 'You do not have access to this section.');
        }

        return $section;
    }

    /**
     * Class codes the caller may touch.
     *
     * @return array<int, string>|null null = unrestricted (Super Admin)
     */
    private function allowedClassCodes(Request $request): ?array
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return null;
        }

        $query = SchoolClass::query();
        $user->allowedClassQuery($query);
        $codes = $query->pluck('code')->all();

        // Sub-Admin: every class inside their section
        if ($user->isSubAdmin()) {
            return $codes;
        }

        // Teacher: only their assigned classes, never widening to the section
        $assigned = $user->assigned_classes ?: [];

        return array_values(array_intersect($codes, $assigned));
    }

    private function assertCanManageLesson(Request $request, ?Lesson $lesson = null, ?Section $section = null): void
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isSubAdmin()) {
            if (! $user->hasAnyPermission(['lessons.create', 'lessons.update', 'lessons.publish', 'lessons.archive', 'lessons.delete'])) {
                abort(403, 'You do not have permission to manage lessons.');
            }

            // Ownership of the specific row matters as much as the capability:
            // a Sub-Admin holding lessons.update must never reach across
            // sections by guessing a lesson id.
            if ($lesson !== null && (int) $lesson->section_id !== (int) $user->section_id) {
                $this->audit->denied('lesson.cross_section_denied', $user, [
                    'lesson_id' => $lesson->id,
                    'lesson_section_id' => $lesson->section_id,
                    'caller_section_id' => $user->section_id,
                ]);

                abort(403, 'That lesson is in another section.');
            }

            return;
        }

        if ($user->role !== 'teacher') {
            abort(403, 'Only teachers and authorized admins may manage lessons.');
        }

        if ($lesson && $lesson->created_by !== $user->id) {
            abort(403, 'You may only manage lessons you created.');
        }
    }

    private function assertCanGrade(Request $request, Lesson $lesson): void
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isSubAdmin()) {
            abort_unless($user->hasPermission('lessons.grade'), 403, 'You cannot grade in this section.');
            abort_unless((int) $lesson->section_id === (int) $user->section_id, 403, 'That lesson is in another section.');

            return;
        }

        abort_unless($user->role === 'teacher' && $lesson->created_by === $user->id, 403);
    }

    // ------------------------------------------------------------------ list

    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 401);

        $query = Lesson::with(['section:id,key,name', 'schoolClass:id,code,name', 'author:id,name'])
            ->withCount(['contentBlocks', 'attachments', 'assignments', 'submissions']);

        // ---- students: only published lessons for their own class/section
        if ($user->role === 'student') {
            $classCode = $this->studentClassCode($user);
            $sectionKey = $classCode ? Section::keyForClassLevel($this->classLevel($classCode)) : null;

            $query->where('status', Lesson::STATUS_PUBLISHED)
                ->where(function ($q) use ($classCode, $sectionKey) {
                    if ($classCode) {
                        $q->whereHas('schoolClass', fn ($c) => $c->where('code', $classCode));
                    }
                    if ($sectionKey) {
                        $q->orWhereHas('section', fn ($s) => $s->where('key', $sectionKey));
                    }
                    if (! $classCode && ! $sectionKey) {
                        $q->whereRaw('1 = 0');
                    }
                });

            $lessons = $query->orderBy('due_date')->orderByDesc('published_at')->get();
            $lessons->load(['attachments', 'assignments', 'progressRecords' => fn ($p) => $p->where('student_id', $user->id)]);

            return response()->json($lessons);
        }

        // ---- parents: read-only view of their children's section
        if ($user->role === 'parent') {
            // a parent account owns parents.id through users.parent_id
            $childrenCodes = $user->parent_id
                ? DB::table('students')
                    ->where('parent_id', $user->parent_id)
                    ->whereNotNull('class_code')
                    ->pluck('class_code')
                    ->filter()
                    ->unique()
                    ->values()
                : collect();

            if ($childrenCodes->isEmpty()) {
                return response()->json([]);
            }

            $sectionKeys = SchoolClass::whereIn('code', $childrenCodes)->get()
                ->map(fn ($c) => Section::keyForClassLevel($c->level_key))
                ->filter()
                ->unique();

            $lessons = $query->where('status', Lesson::STATUS_PUBLISHED)
                ->whereHas('schoolClass', fn ($c) => $c->whereIn('code', $childrenCodes))
                ->when($sectionKeys->isNotEmpty(), fn ($q) => $q->orWhereHas('section', fn ($s) => $s->whereIn('key', $sectionKeys)))
                ->orderByDesc('published_at')
                ->get();

            return response()->json($lessons);
        }

        // ---- admins (Super + Sub) and teachers
        if ($user->isSubAdmin()) {
            abort_unless($user->hasPermission('lessons.view'), 403);
            $user->scopeQueryToSection($query);
        }

        if ($user->role === 'teacher') {
            $codes = $this->allowedClassCodes($request);

            $query->where(function ($q) use ($user, $codes) {
                $q->where('created_by', $user->id);

                // Assigned-class lessons, but only while the intersection with
                // the caller's section is non-empty: never widen to the section.
                if (is_array($codes) && $codes !== []) {
                    $q->orWhereHas('schoolClass', fn ($c) => $c->whereIn('code', $codes));
                }
            });
        }

        if ($request->filled('section_id')) {
            abort_unless($user->hasAccessSection(Section::find($request->integer('section_id'))), 403);
            $query->where('section_id', $request->integer('section_id'));
        }
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->integer('class_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->orderByDesc('id')->paginate($request->integer('per_page') ?: 50));
    }

    private function studentClassCode(User $student): ?string
    {
        if ($student->class_name) {
            return $student->class_name;
        }

        if ($student->student_id) {
            return optional(Student::find($student->student_id))->class_code;
        }

        return null;
    }

    private function classLevel(?string $code): ?string
    {
        if (! $code) {
            return null;
        }

        return SchoolClass::where('code', $code)->orWhere('name', $code)->value('level_key');
    }

    // ------------------------------------------------------------------ show

    public function show(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        abort_unless($user, 401);

        $section = $lesson->section;

        if (! $user->isSuperAdmin()) {
            if (! $user->hasAccessSection($section)) {
                $this->audit->denied('lesson.section_denied', $user, [
                    'lesson_id' => $lesson->id,
                    'section' => $section?->key,
                ]);

                abort(403, 'This lesson belongs to another section.');
            }
        }

        // Students may only read published lessons for their own class.
        if ($user->role === 'student') {
            abort_unless($lesson->status === Lesson::STATUS_PUBLISHED, 403);
            $classCode = $this->studentClassCode($user);
            $sectionKey = Section::keyForClassLevel($this->classLevel($classCode));

            $ok = $lesson->class_id && SchoolClass::whereKey($lesson->class_id)->value('code') === $classCode;

            if (! $ok && $sectionKey && $section?->key === $sectionKey) {
                $ok = true;
            }

            abort_unless($ok, 403, 'This lesson is not assigned to your class.');
        }

        $lesson->load([
            'section:id,key,name',
            'schoolClass:id,code,name,level_key',
            'author:id,name,email',
            'contentBlocks',
            'attachments',
            'assignments.submissions' => fn ($q) => $this->scopeSubmissionsFor($user, $q),
        ]);

        if ($user->role === 'student') {
            $lesson->setRelation('progressRecords', LessonProgress::where('lesson_id', $lesson->id)
                ->where('student_id', $user->id)
                ->get());
        }

        return response()->json($lesson);
    }

    private function scopeSubmissionsFor(User $user, $query)
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($user->isSubAdmin()) {
            // A Sub-Admin with no section configured sees nothing rather than
            // everything with a null section_id.
            if ($user->section_id === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query->where('section_id', $user->section_id);
        }

        if ($user->role === 'teacher') {
            // A teacher only ever sees submissions for lessons they own; that
            // lesson-ownership check happens in the calling controller.
            return $query->with(['student:id,name,email', 'assignment:id,title,type,max_score']);
        }

        if ($user->role === 'student') {
            return $query->where('student_id', $user->id);
        }

        // Parents get no raw submission payloads.
        return $query->whereRaw('1 = 0');
    }

    // ----------------------------------------------------------------- store

    public function store(Request $request)
    {
        $user = $request->user();
        $section = $this->resolveSection($request);
        $this->assertCanManageLesson($request, null, $section);

        if ($user->isSubAdmin() && ! $user->hasPermission('lessons.create')) {
            abort(403, 'You cannot create lessons in this section.');
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'class_id' => ['nullable', Rule::exists('classes', 'id')],
            'due_date' => ['nullable', 'date'],
            'scheduled_at' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'status' => ['nullable', Rule::in([Lesson::STATUS_DRAFT, Lesson::STATUS_PUBLISHED, Lesson::STATUS_ARCHIVED])],
            'content_blocks' => ['nullable', 'array'],
            'attachments' => ['nullable', 'array'],
            'assignments' => ['nullable', 'array'],
        ]);

        // A lesson must never be filed under a class outside the caller's section.
        if (! empty($data['class_id'])) {
            $class = SchoolClass::find($data['class_id']);
            if (! $class) {
                abort(422, 'Unknown class.');
            }
            if ($class->section_id !== null && (int) $class->section_id !== (int) $section->id && ! $user->isSuperAdmin()) {
                abort(403, 'That class belongs to another section.');
            }
            if (! $user->isSuperAdmin()) {
                $codes = $this->allowedClassCodes($request);
                if (is_array($codes) && ! in_array($class->code, $codes, true) && $user->isSubAdmin()) {
                    abort(403, 'You may only assign lessons to classes in your section.');
                }
            }
        }

        $status = $data['status'] ?? Lesson::STATUS_DRAFT;
        if ($status === Lesson::STATUS_PUBLISHED && $user->isSubAdmin() && ! $user->hasPermission('lessons.publish')) {
            $status = Lesson::STATUS_DRAFT;
        }

        $lesson = DB::transaction(function () use ($data, $section, $user, $status, $request) {
            $lesson = Lesson::create([
                'title' => $data['title'],
                'slug' => Str::slug($data['title']).'-'.Str::lower(Str::random(6)),
                'description' => $data['description'] ?? null,
                'objectives' => $data['objectives'] ?? null,
                'section_id' => $section->id,
                'class_id' => $data['class_id'] ?? null,
                'created_by' => $user->id,
                'updated_by' => $user->id,
                'status' => $status,
                'due_date' => $data['due_date'] ?? null,
                'scheduled_at' => $data['scheduled_at'] ?? null,
                'estimated_minutes' => $data['estimated_minutes'] ?? null,
                'published_at' => $status === Lesson::STATUS_PUBLISHED ? now() : null,
            ]);

            $this->syncContentBlocks($lesson, $data['content_blocks'] ?? []);
            $this->syncAttachments($request, $lesson, $data['attachments'] ?? []);
            $this->syncAssignments($lesson, $data['assignments'] ?? [], $user);

            return $lesson;
        });

        $this->audit->log('lesson.created', $user, Lesson::class, $lesson->id, $section->id, [
            'title' => $lesson->title,
            'class_id' => $lesson->class_id,
            'status' => $lesson->status,
        ], "Created lesson \"{$lesson->title}\"");

        return response()->json($lesson->load(['contentBlocks', 'attachments', 'assignments', 'section:id,key,name', 'schoolClass:id,code,name']), 201);
    }

    private function syncContentBlocks(Lesson $lesson, array $blocks): void
    {
        $lesson->contentBlocks()->delete();

        foreach (array_values($blocks) as $index => $block) {
            if (! is_array($block)) {
                continue;
            }
            LessonContentBlock::create([
                'lesson_id' => $lesson->id,
                'type' => $block['type'] ?? 'text',
                'order' => $block['order'] ?? $index,
                'title' => $block['title'] ?? null,
                'data' => $block['data'] ?? $block,
            ]);
        }
    }

    private function syncAttachments(Request $request, Lesson $lesson, array $attachments): void
    {
        $keep = [];

        foreach ($attachments as $attachment) {
            if (! is_array($attachment)) {
                continue;
            }
            $url = $attachment['file_url'] ?? $attachment['url'] ?? null;
            if (! $url) {
                continue;
            }
            $keep[] = LessonAttachment::updateOrCreate(
                ['lesson_id' => $lesson->id, 'file_url' => $url],
                [
                    'uploaded_by' => $request->user()->id,
                    'title' => $attachment['title'] ?? null,
                    'file_name' => $attachment['file_name'] ?? null,
                    'file_type' => $attachment['file_type'] ?? null,
                    'file_size' => $attachment['file_size'] ?? null,
                    'external_url' => $attachment['external_url'] ?? null,
                ]
            )->id;
        }

        $lesson->attachments()->when($keep !== [], fn ($q) => $q->whereNotIn('id', $keep))->delete();
    }

    private function syncAssignments(Lesson $lesson, array $assignments, User $actor): void
    {
        $lesson->assignments()->whereNotIn('id', array_values(array_filter(array_map(
            fn ($a) => is_array($a) ? ($a['id'] ?? null) : null,
            $assignments
        ))))->delete();

        foreach ($assignments as $assignment) {
            if (! is_array($assignment)) {
                continue;
            }

            $payload = [
                'lesson_id' => $lesson->id,
                'type' => $assignment['type'] ?? LessonAssignment::TYPE_ASSIGNMENT,
                'title' => $assignment['title'] ?? 'Untitled',
                'instructions' => $assignment['instructions'] ?? null,
                'due_date' => $assignment['due_date'] ?? null,
                'max_score' => $assignment['max_score'] ?? null,
                'time_limit_minutes' => $assignment['time_limit_minutes'] ?? null,
                'allow_late' => $assignment['allow_late'] ?? true,
                'questions' => $assignment['questions'] ?? null,
                'created_by' => $actor->id,
            ];

            if (! empty($assignment['id'])) {
                LessonAssignment::whereKey($assignment['id'])
                    ->where('lesson_id', $lesson->id)
                    ->update($payload);
            } else {
                LessonAssignment::create($payload);
            }
        }
    }

    // ---------------------------------------------------------------- update

    public function update(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $this->assertCanManageLesson($request, $lesson);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'class_id' => ['nullable', Rule::exists('classes', 'id')],
            'due_date' => ['nullable', 'date'],
            'scheduled_at' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'status' => ['nullable', Rule::in([Lesson::STATUS_DRAFT, Lesson::STATUS_PUBLISHED, Lesson::STATUS_ARCHIVED])],
            'content_blocks' => ['nullable', 'array'],
            'attachments' => ['nullable', 'array'],
            'assignments' => ['nullable', 'array'],
        ]);

        if (array_key_exists('status', $data) && $user->isSubAdmin()) {
            $permission = match ($data['status']) {
                Lesson::STATUS_PUBLISHED => 'lessons.publish',
                Lesson::STATUS_ARCHIVED => 'lessons.archive',
                default => 'lessons.update',
            };
            abort_unless($user->hasPermission($permission), 403, "You lack the {$permission} permission.");
        }

        // Re-targeting an existing lesson to another class must respect both
        // the section boundary and the caller's own class allowance.
        if (array_key_exists('class_id', $data) && ! empty($data['class_id'])) {
            $class = SchoolClass::find($data['class_id']);

            if (! $class) {
                abort(422, 'Unknown class.');
            }

            if (! $user->isSuperAdmin() && $class->section_id !== null) {
                abort_unless((int) $class->section_id === (int) $lesson->section_id, 403, 'That class belongs to another section.');
            }

            if ($user->isSubAdmin()) {
                abort_unless((int) $class->section_id === (int) $user->section_id, 403, 'That class is outside your section.');
            }
        }

        DB::transaction(function () use ($data, $lesson, $request, $user) {
            foreach (['title', 'description', 'objectives', 'class_id', 'due_date', 'scheduled_at', 'estimated_minutes'] as $field) {
                if (array_key_exists($field, $data)) {
                    $lesson->{$field} = $data[$field];
                }
            }

            if (array_key_exists('status', $data)) {
                $lesson->status = $data['status'];
                if ($data['status'] === Lesson::STATUS_PUBLISHED && ! $lesson->published_at) {
                    $lesson->published_at = now();
                }
            }

            $lesson->updated_by = $user->id;
            $lesson->save();

            if (array_key_exists('content_blocks', $data)) {
                $this->syncContentBlocks($lesson, $data['content_blocks']);
            }
            if (array_key_exists('attachments', $data)) {
                $this->syncAttachments($request, $lesson, $data['attachments']);
            }
            if (array_key_exists('assignments', $data)) {
                $this->syncAssignments($lesson, $data['assignments'], $user);
            }
        });

        $this->audit->log('lesson.updated', $user, Lesson::class, $lesson->id, $lesson->section_id, [
            'changed' => array_keys($data),
            'title' => $lesson->title,
        ], "Updated lesson \"{$lesson->title}\"");

        return response()->json($lesson->fresh(['contentBlocks', 'attachments', 'assignments', 'section:id,key,name', 'schoolClass:id,code,name']));
    }

    public function publish(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $this->assertCanManageLesson($request, $lesson);

        if ($user->isSubAdmin() && ! $user->hasPermission('lessons.publish')) {
            abort(403, 'You cannot publish lessons in this section.');
        }

        $lesson->status = Lesson::STATUS_PUBLISHED;
        $lesson->published_at = $lesson->published_at ?: now();
        $lesson->updated_by = $user->id;
        $lesson->save();

        $this->audit->log('lesson.published', $user, Lesson::class, $lesson->id, $lesson->section_id, [
            'title' => $lesson->title,
        ], "Published lesson \"{$lesson->title}\"");

        return response()->json($lesson);
    }

    public function archive(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $this->assertCanManageLesson($request, $lesson);

        if ($user->isSubAdmin() && ! $user->hasPermission('lessons.archive')) {
            abort(403, 'You cannot archive lessons in this section.');
        }

        $lesson->status = Lesson::STATUS_ARCHIVED;
        $lesson->updated_by = $user->id;
        $lesson->save();

        $this->audit->log('lesson.archived', $user, Lesson::class, $lesson->id, $lesson->section_id, [
            'title' => $lesson->title,
        ], "Archived lesson \"{$lesson->title}\"");

        return response()->json($lesson);
    }

    public function duplicate(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $this->assertCanManageLesson($request, $lesson);

        if ($user->isSubAdmin() && ! $user->hasPermission('lessons.duplicate')) {
            abort(403, 'You cannot duplicate lessons in this section.');
        }

        $copy = DB::transaction(function () use ($lesson, $user) {
            $clone = $lesson->replicate();
            $clone->title = $lesson->title.' (copy)';
            $clone->slug = Str::slug($clone->title).'-'.Str::lower(Str::random(6));
            $clone->status = Lesson::STATUS_DRAFT;
            $clone->published_at = null;
            $clone->created_by = $user->id;
            $clone->updated_by = $user->id;
            $clone->save();

            foreach ($lesson->contentBlocks as $block) {
                $newBlock = $block->replicate();
                $newBlock->lesson_id = $clone->id;
                $newBlock->save();
            }
            foreach ($lesson->attachments as $attachment) {
                $newAttachment = $attachment->replicate();
                $newAttachment->lesson_id = $clone->id;
                $newAttachment->uploaded_by = $user->id;
                $newAttachment->save();
            }
            foreach ($lesson->assignments as $assignment) {
                $newAssignment = $assignment->replicate();
                $newAssignment->lesson_id = $clone->id;
                $newAssignment->created_by = $user->id;
                $newAssignment->save();
            }

            return $clone;
        });

        $this->audit->log('lesson.duplicated', $user, Lesson::class, $copy->id, $copy->section_id, [
            'source_lesson_id' => $lesson->id,
        ], "Duplicated lesson \"{$lesson->title}\"");

        return response()->json($copy->load(['contentBlocks', 'attachments', 'assignments']), 201);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $this->assertCanManageLesson($request, $lesson);

        if ($user->isSubAdmin() && ! $user->hasPermission('lessons.delete')) {
            abort(403, 'You cannot delete lessons in this section.');
        }

        $title = $lesson->title;
        $id = $lesson->id;
        $sectionId = $lesson->section_id;

        // Soft delete keeps submissions and progress intact for reporting.
        $lesson->delete();

        $this->audit->log('lesson.deleted', $user, Lesson::class, $id, $sectionId, [
            'title' => $title,
        ], "Deleted lesson \"{$title}\"");

        return response()->json(['message' => 'Lesson deleted.']);
    }

    // ------------------------------------------------------------ submissions

    public function submit(Request $request, LessonAssignment $assignment)
    {
        $user = $request->user();
        abort_unless($user && $user->role === 'student', 403, 'Only students can submit work.');

        $lesson = $assignment->lesson;
        abort_if(! $lesson || $lesson->trashed(), 404, 'Unknown assignment.');
        abort_if($lesson->status !== Lesson::STATUS_PUBLISHED, 403, 'This lesson is not open for submissions.');

        $studentCode = $this->studentClassCode($user);
        abort_if(! $studentCode, 403, 'Your account is not enrolled in a class.');

        // A class-targeted lesson must match the student's class exactly. A
        // section-wide lesson is accepted when the student's class resolves to
        // that same section, so guessing an id from another section still fails.
        if ($lesson->class_id) {
            $classCode = SchoolClass::whereKey($lesson->class_id)->value('code');
            abort_unless($classCode && $classCode === $studentCode, 403, 'This assignment is for another class.');
        } elseif ($lesson->section_id) {
            $lessonSectionKey = Section::find($lesson->section_id)?->key;
            $studentSectionKey = Section::keyForClassLevel($this->classLevel($studentCode));

            abort_unless(
                $lessonSectionKey && $studentSectionKey && $lessonSectionKey === $studentSectionKey,
                403,
                'This assignment belongs to another section.'
            );
        }

        if ($assignment->due_date && ! $assignment->allow_late && now()->greaterThan($assignment->due_date)) {
            return response()->json(['message' => 'The due date for this assignment has passed.'], 422);
        }

        $data = $request->validate([
            'content' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
            'answers' => ['nullable', 'array'],
            'submit' => ['nullable', 'boolean'],
        ]);

        $submission = LessonSubmission::updateOrCreate(
            ['lesson_assignment_id' => $assignment->id, 'student_id' => $user->id],
            [
                'lesson_id' => $lesson->id,
                'class_id' => $lesson->class_id,
                'section_id' => $lesson->section_id,
                'content' => $data['content'] ?? null,
                'attachments' => $data['attachments'] ?? null,
                'answers' => $data['answers'] ?? null,
                'status' => ($data['submit'] ?? true)
                    ? LessonSubmission::STATUS_SUBMITTED
                    : LessonSubmission::STATUS_DRAFT,
                'submitted_at' => ($data['submit'] ?? true) ? now() : null,
            ]
        );

        LessonProgress::updateOrCreate(
            ['lesson_id' => $lesson->id, 'student_id' => $user->id],
            [
                'section_id' => $lesson->section_id,
                'class_id' => $lesson->class_id,
                'status' => LessonProgress::STATUS_IN_PROGRESS,
                'progress_percent' => 60,
                'started_at' => now(),
            ]
        );

        $this->audit->log('lesson.submission_saved', $user, LessonSubmission::class, $submission->id, $lesson->section_id, [
            'lesson_id' => $lesson->id,
            'assignment_id' => $assignment->id,
            'status' => $submission->status,
        ], 'Student submitted lesson work');

        return response()->json($submission, 201);
    }

    public function mySubmissions(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->role === 'student', 403);

        // Always scoped to the caller: a student only ever reads their own rows.
        $query = LessonSubmission::with(['assignment:id,lesson_id,title,type,due_date,max_score', 'lesson:id,title,section_id,due_date,status'])
            ->where('student_id', $user->id)
            ->orderByDesc('id');

        return response()->json($query->paginate($request->integer('per_page') ?: 50));
    }

    public function grade(Request $request, LessonSubmission $submission)
    {
        $user = $request->user();
        $lesson = $submission->lesson;
        abort_if(! $lesson || $lesson->trashed(), 404, 'Unknown submission.');
        $this->assertCanGrade($request, $lesson);

        // The submission must actually belong to the lesson it claims to, so a
        // tampered payload cannot move a grade onto an unrelated lesson.
        abort_unless((int) $submission->lesson_id === (int) $lesson->id, 422, 'Submission does not match its lesson.');

        $data = $request->validate([
            'grade' => ['required', 'numeric', 'min:0'],
            'feedback' => ['nullable', 'string'],
            'return_for_revision' => ['nullable', 'boolean'],
        ]);

        $max = optional($submission->assignment)->max_score;
        if ($max !== null && (float) $data['grade'] > (float) $max) {
            return response()->json(['message' => "Grade cannot exceed the maximum score ({$max})."], 422);
        }

        $submission->grade = $data['grade'];
        $submission->feedback = $data['feedback'] ?? null;
        $submission->graded_by = $user->id;
        $submission->graded_at = now();
        $submission->status = ($data['return_for_revision'] ?? false)
            ? LessonSubmission::STATUS_RETURNED
            : LessonSubmission::STATUS_GRADED;
        $submission->save();

        LessonProgress::updateOrCreate(
            ['lesson_id' => $lesson->id, 'student_id' => $submission->student_id],
            [
                'section_id' => $lesson->section_id,
                'class_id' => $lesson->class_id,
                'status' => LessonProgress::STATUS_COMPLETED,
                'progress_percent' => 100,
                'completed_at' => now(),
            ]
        );

        $this->audit->log('lesson.graded', $user, LessonSubmission::class, $submission->id, $lesson->section_id, [
            'lesson_id' => $lesson->id,
            'student_id' => $submission->student_id,
            'grade' => $data['grade'],
        ], 'Graded a lesson submission');

        return response()->json($submission->fresh(['assignment:id,title,type,max_score', 'student:id,name,email']));
    }

    public function submissions(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        abort_unless($user, 401);

        if ($user->role === 'student') {
            $query = LessonSubmission::where('lesson_id', $lesson->id)->where('student_id', $user->id);
        } elseif ($user->role === 'parent') {
            // parents never see another child's raw submission payloads
            return response()->json([]);
        } elseif ($user->isSubAdmin()) {
            abort_unless($user->hasPermission('lessons.view'), 403);
            abort_unless($lesson->section_id === $user->section_id, 403, 'That lesson is in another section.');
            $query = LessonSubmission::where('lesson_id', $lesson->id);
        } else {
            $this->assertCanGrade($request, $lesson);
            $query = LessonSubmission::where('lesson_id', $lesson->id);
        }

        return response()->json($query->with(['student:id,name,email', 'assignment:id,title,type,max_score'])->get());
    }

    // --------------------------------------------------------------- progress

    public function trackProgress(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        abort_unless($user, 401);

        $studentId = $user->role === 'student'
            ? $user->id
            : $request->integer('student_id');

        abort_if(! $studentId, 422, 'A student is required.');

        // A student may only ever write their own progress row.
        if ($user->role === 'student' && $studentId !== $user->id) {
            abort(403);
        }

        // Parents have no write access to progress at all.
        if ($user->role === 'parent') {
            abort(403);
        }

        if ($user->isSubAdmin()) {
            abort_unless((int) $lesson->section_id === (int) $user->section_id, 403, 'That lesson is in another section.');
        } elseif ($user->role === 'teacher') {
            abort_unless((int) $lesson->created_by === (int) $user->id, 403, 'You may only track progress for your own lessons.');
        } elseif (! $user->isSuperAdmin()) {
            abort(403);
        }

        // Writing on behalf of somebody else: the target must be a student
        // enrolled in the class this lesson belongs to, otherwise the endpoint
        // would let a teacher fabricate progress for any student id.
        if ($studentId !== $user->id && $lesson->class_id) {
            $classCode = SchoolClass::whereKey($lesson->class_id)->value('code');
            $targetInClass = $classCode
                ? DB::table('students')->where('user_id', $studentId)->where('class_code', $classCode)->exists()
                : false;

            abort_unless($targetInClass, 403, 'That student is not enrolled in this lesson\'s class.');
        }

        $data = $request->validate([
            'status' => ['nullable', Rule::in([
                LessonProgress::STATUS_NOT_STARTED,
                LessonProgress::STATUS_IN_PROGRESS,
                LessonProgress::STATUS_COMPLETED,
            ])],
            'progress_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'time_spent_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $progress = LessonProgress::firstOrNew([
            'lesson_id' => $lesson->id,
            'student_id' => $studentId,
        ]);

        $progress->section_id = $lesson->section_id;
        $progress->class_id = $lesson->class_id;

        if (isset($data['status'])) {
            $progress->status = $data['status'];
        }
        if (isset($data['progress_percent'])) {
            $progress->progress_percent = $data['progress_percent'];
        }
        if (isset($data['time_spent_seconds'])) {
            $progress->time_spent_seconds = $data['time_spent_seconds'];
        }

        if (! $progress->started_at) {
            $progress->started_at = now();
        }
        if ($progress->status === LessonProgress::STATUS_COMPLETED) {
            $progress->progress_percent = 100;
            $progress->completed_at = $progress->completed_at ?: now();
        }

        $progress->save();

        return response()->json($progress);
    }

    public function analytics(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        abort_unless($user, 401);

        if ($user->role === 'student' || $user->role === 'parent') {
            abort(403, 'Analytics are not available to students.');
        }

        if ($user->isSubAdmin()) {
            abort_unless($user->hasAnyPermission(['reports.view_section', 'lessons.view']), 403);
            abort_unless((int) $lesson->section_id === (int) $user->section_id, 403, 'That lesson is in another section.');
        } elseif ($user->role === 'teacher') {
            abort_unless((int) $lesson->created_by === (int) $user->id, 403);
        }

        $totalSubmissions = LessonSubmission::where('lesson_id', $lesson->id)->count();
        $graded = LessonSubmission::where('lesson_id', $lesson->id)->where('status', LessonSubmission::STATUS_GRADED)->count();
        $average = (float) LessonSubmission::where('lesson_id', $lesson->id)->whereNotNull('grade')->avg('grade');
        $completed = LessonProgress::where('lesson_id', $lesson->id)
            ->where('status', LessonProgress::STATUS_COMPLETED)->count();

        $classCode = $lesson->class_id
            ? SchoolClass::whereKey($lesson->class_id)->value('code')
            : null;

        $students = $classCode
            ? DB::table('students')->where('class_code', $classCode)->count()
            : 0;

        return response()->json([
            'lesson_id' => $lesson->id,
            'total_students' => $students,
            'submissions' => $totalSubmissions,
            'graded' => $graded,
            'awaiting_grading' => $totalSubmissions - $graded,
            'completed' => $completed,
            'completion_rate' => $students > 0 ? round($completed / $students * 100, 2) : 0,
            'average_score' => round($average, 2),
            'graded_rate' => $totalSubmissions > 0 ? round($graded / $totalSubmissions * 100, 2) : 0,
        ]);
    }
}