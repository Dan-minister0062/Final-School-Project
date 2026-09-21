<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->rows()]);
    }

    public function adminIndex(): JsonResponse
    {
        $rows = collect($this->rows())->map(fn ($row) => [
            'id' => $row['code'],
            'code' => $row['code'],
            'name' => $row['name'],
            'nameEn' => $row['nameEn'] ?? $row['name'],
            'nameAr' => $row['nameAr'] ?? $row['name'],
            'level' => $row['level'],
            'level_key' => $row['level_key'],
            'status' => $row['status'],
            'students_count' => $row['students_count'],
        ]);

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $class = SchoolClass::create($this->validatedData($request, creating: true));

        return response()->json([
            'success' => true,
            'data' => $this->row($class),
        ], 201);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $class = SchoolClass::where('code', $code)->first();

        if (! $class) {
            return response()->json(['message' => 'Class not found.'], 404);
        }

        $class->update($this->validatedData($request, code: $code));

        return response()->json([
            'success' => true,
            'data' => $this->row($class),
        ]);
    }

    public function destroy(Request $request, string $code): JsonResponse
    {
        $class = SchoolClass::where('code', $code)->first();

        if (! $class) {
            return response()->json(['message' => 'Class not found.'], 404);
        }

        $class->delete();

        return response()->json(['success' => true]);
    }

    protected function validatedData(Request $request, bool $creating = false, ?string $code = null): array
    {
        $rules = [
            'name' => $creating ? 'required|string|max:120' : 'sometimes|string|max:120',
            'name_en' => 'nullable|string|max:120',
            'name_ar' => 'nullable|string|max:120',
            'level_key' => 'nullable|string|max:60',
            'capacity' => 'nullable|integer|min:0',
            'academic_year' => 'nullable|string|max:20',
            'room' => 'nullable|string|max:60',
            'teacher_name' => 'nullable|string|max:120',
            'status' => 'sometimes|in:active,inactive',
        ];

        if ($creating) {
            $rules['code'] = 'required|string|max:60|unique:classes,code';
        } else {
            $rules['code'] = 'sometimes|string|max:60|unique:classes,code,' . $code . ',code';
        }

        $data = $request->validate($rules);

        if (! array_key_exists('name', $data) && $creating) {
            $data['name'] = $request->input('name') ?? 'New Class';
        }
        if ($request->filled('code') || $request->filled('id')) {
            $data['code'] = $request->input('code') ?? $request->input('id');
        }
        $data['level_key'] = $data['level_key']
            ?? $request->input('level')
            ?? $request->input('educationLevel')
            ?? 'primary';
        $data['name_en'] = $data['name_en']
            ?? $request->input('nameEn')
            ?? $request->input('name')
            ?? $data['name']
            ?? null;
        $data['name_ar'] = $data['name_ar']
            ?? $request->input('nameAr')
            ?? $data['name_en']
            ?? null;
        $data['status'] = $request->has('isActive')
            ? ($request->input('isActive') ? 'active' : 'inactive')
            : ($data['status'] ?? 'active');
        $data['teacher_name'] = $data['teacher_name'] ?? $request->input('teacher');
        $data['room'] = $data['room'] ?? $request->input('schedule');
        $data['capacity'] = $data['capacity'] ?? 30;

        return $data;
    }

    protected function rows(): array
    {
        return SchoolClass::orderBy('id')->get()->map(fn ($class) => $this->row($class))->all();
    }

    protected function row(SchoolClass $class): array
    {
        return [
            'id' => $class->code,
            'code' => $class->code,
            'name' => $class->name,
            'nameEn' => $class->name_en ?? $class->name,
            'nameAr' => $class->name_ar ?? $class->name,
            'level_key' => $class->level_key,
            'level' => $class->level_key,
            'capacity' => $class->capacity,
            'academic_year' => $class->academic_year,
            'room' => $class->room,
            'teacher_name' => $class->teacher_name,
            'status' => $class->status,
            'students_count' => $class->students()->count(),
        ];
    }

    public function show(string $code): JsonResponse
    {
        $class = SchoolClass::where('code', $code)->first();

        if (! $class) {
            return response()->json(['message' => 'Class not found.'], 404);
        }

        return response()->json($this->row($class));
    }
}