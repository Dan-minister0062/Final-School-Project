<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $classes = SchoolClass::all(['code', 'name', 'level_key']);
        $byCode = $classes->keyBy('code');
        $byName = $classes->keyBy(fn ($c) => mb_strtolower(trim($c->name)));

        $students = Student::orderBy('name')->get();
        $userByEmail = User::query()
            ->where('role', 'student')
            ->get(['id', 'email', 'student_id', 'avatar'])
            ->keyBy(fn ($u) => mb_strtolower(trim((string) $u->email)));
        $userByStudentId = $userByEmail->groupBy('student_id');

        $data = $students->map(function (Student $s) use ($byCode, $byName, $userByEmail, $userByStudentId) {
            $class = $byCode->get($s->class_code)
                ?? $byName->get(mb_strtolower(trim((string) $s->class_code)));

            $emailKey = mb_strtolower(trim((string) $s->email));
            $user = $userByEmail->get($emailKey)
                ?? optional($userByStudentId->get($s->id))->first();

            return [
                'id' => $s->id,
                'userId' => $user?->id,
                'code' => $s->code,
                'name' => $s->name,
                'email' => $s->email,
                'class_code' => $s->class_code,
                'classId' => $class ? $class->code : $s->class_code,
                'className' => $class ? $class->name : $s->class_code,
                'level' => $class ? $class->level_key : null,
                'gender' => $s->gender,
                'dob' => $s->dob,
                'status' => $s->status,
                'avatar' => $user?->avatar,
                'parentId' => $s->parent_id,
            ];
        });

        return response()->json([
            'data' => array_values($data->all()),
        ]);
    }
}