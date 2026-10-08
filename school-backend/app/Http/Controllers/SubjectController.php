<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subject::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_ar', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('level') && $request->level !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('level_key', $request->level)
                    ->orWhere('category', $request->level);
            });
        }

        // A Sub-Admin may only be handed the subjects of its own section.
        $caller = $request->user();
        if ($caller?->isSubAdmin()) {
            $key = $this->sectionKeyForCaller($caller);
            if ($key === null) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function ($q) use ($key) {
                    $q->where('category', $key)
                        ->orWhere('level_key', $key);
                });
            }
        }

        $page = max(1, (int) $request->input('page', 1));
        $limit = max(1, (int) $request->input('limit', $request->input('per_page', 10)));

        $subjects = $query->orderBy('id')->get();
        $total = $subjects->count();
        $pages = (int) ceil($total / $limit);
        $sliced = $subjects->slice(($page - 1) * $limit, $limit)->values();

        return response()->json([
            'success' => true,
            'data' => $sliced->map(fn (Subject $s) => $this->mapVue($s)),
            'allData' => $subjects->map(fn (Subject $s) => $this->mapVue($s)),
            'pagination' => [
                'total' => $total,
                'pages' => $pages,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->mapStore($request);

        $caller = $request->user();
        if ($caller?->isSubAdmin()) {
            $key = $this->sectionKeyForCaller($caller);
            abort_if($key === null, 403, 'Your account is not assigned to a section.');
            // A Sub-Admin only ever creates subjects inside its own section.
            $data['category'] = $key;
            $data['level_key'] = $key;
        }

        $data['code'] = $this->makeUniqueCode($request, $data['category'] ?? null);

        Subject::create($data);

        return response()->json(['success' => true]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $this->assertSubjectInScope($request, $subject);

        $data = $this->mapStore($request);

        $caller = $request->user();
        if ($caller?->isSubAdmin()) {
            $key = $this->sectionKeyForCaller($caller);
            $data['category'] = $key;
            $data['level_key'] = $key;
        }

        $subject->fill($data);
        $subject->save();

        return response()->json(['success' => true]);
    }

    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $this->assertSubjectInScope($request, $subject);

        $subject->status = $request->input('isActive', true) ? 'active' : 'inactive';
        $subject->save();

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $this->assertSubjectInScope($request, $subject);

        Subject::destroy($id);

        return response()->json(['success' => true]);
    }

    protected function mapStore(Request $request): array
    {
        $level = $request->input('level', $request->input('level_key', $request->input('category')));

        return [
            'name' => $request->input('name'),
            'name_en' => $request->input('nameEn') ?? $request->input('name'),
            'name_ar' => $request->input('nameAr'),
            'category' => $request->input('category'),
            'level_key' => $level,
            'status' => $request->input('isActive', true) ? 'active' : 'inactive',
        ];
    }

    protected function makeUniqueCode(Request $request, ?string $category = null): string
    {
        $category = $category ?? $request->input('category');
        $base = Str::slug(trim(($category ? $category.' ' : '').$request->input('name')), '_');
        if ($base === '') {
            $base = 'subject';
        }

        $code = $base;
        $i = 1;
        while (Subject::where('code', $code)->exists()) {
            $code = $base.'_'.$i;
            $i++;
        }

        return $code;
    }

    protected function mapVue(Subject $s): array
    {
        return [
            'id' => $s->id,
            'code' => $s->code,
            'name' => $s->name,
            'nameEn' => $s->name_en ?? $s->name,
            'nameAr' => $s->name_ar ?? '',
            'category' => $s->category ?? $s->level_key ?? 'primary',
            'level' => $s->level_key ?? $s->category ?? 'primary',
            'level_key' => $s->level_key,
            'class_code' => $s->class_code,
            'coefficient' => $s->coefficient,
            'isActive' => $s->status === 'active',
        ];
    }

    /**
     * The section key this caller is confined to. Null for Super Admins and
     * for Sub-Admins that have no section configured (they may manage nothing).
     */
    protected function sectionKeyForCaller(?User $caller): ?string
    {
        $key = $caller?->scopeKey();

        if (is_string($key) && $key !== '') {
            return $key;
        }

        if ($caller?->section_id !== null) {
            return Section::find($caller->section_id)?->key;
        }

        return null;
    }

    /** Strict: a subject outside the caller's section is never manageable. */
    protected function assertSubjectInScope(Request $request, Subject $subject): void
    {
        $caller = $request->user();

        if (! $caller || ! $caller->isSubAdmin()) {
            return;
        }

        $key = $this->sectionKeyForCaller($caller);
        $subjectKey = Section::keyForClassLevel($subject->category ?? $subject->level_key);

        abort_if(
            $key === null || $subjectKey === null || $subjectKey !== $key,
            403,
            'That subject belongs to another section.'
        );
    }
}