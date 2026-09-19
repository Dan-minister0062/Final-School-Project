<?php

namespace App\Http\Controllers;

use App\Models\Subject;
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
        $data['code'] = $this->makeUniqueCode($request);

        Subject::create($data);

        return response()->json(['success' => true]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $subject->fill($this->mapStore($request));
        $subject->save();

        return response()->json(['success' => true]);
    }

    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $subject->status = $request->input('isActive', true) ? 'active' : 'inactive';
        $subject->save();

        return response()->json(['success' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        Subject::destroy($id);

        return response()->json(['success' => true]);
    }

    protected function mapStore(Request $request): array
    {
        $level = $request->input('level', $request->input('level_key', $request->input('category')));

        return [
            'name' => $request->input('name'),
            'name_ar' => $request->input('nameAr'),
            'category' => $request->input('category'),
            'level_key' => $level,
            'status' => $request->input('isActive', true) ? 'active' : 'inactive',
        ];
    }

    protected function makeUniqueCode(Request $request): string
    {
        $base = Str::slug(trim(($request->input('category') ? $request->category.' ' : '').$request->input('name')), '_');
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
            'nameAr' => $s->name_ar ?? '',
            'category' => $s->category ?? $s->level_key ?? 'primary',
            'level' => $s->level_key ?? $s->category ?? 'primary',
            'level_key' => $s->level_key,
            'class_code' => $s->class_code,
            'coefficient' => $s->coefficient,
            'isActive' => $s->status === 'active',
        ];
    }
}