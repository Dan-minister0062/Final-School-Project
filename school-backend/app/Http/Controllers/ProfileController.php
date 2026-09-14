<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'sometimes|email|max:120|unique:users,email,'.$request->user()->id,
            'phone' => 'nullable|string|max:30',
            'avatar' => 'nullable|string',
            'address' => 'nullable|string|max:190',
            'dob' => 'nullable|date',
            'dateOfBirth' => 'nullable|date',
            'gender' => 'nullable|string|max:10',
            'bio' => 'nullable|string',
            'department' => 'nullable|string|max:90',
            'nationality' => 'nullable|string|max:60',
            'cin' => 'nullable|string|max:40',
            'city' => 'nullable|string|max:90',
            'emergencyContactName' => 'nullable|string|max:120',
            'emergencyContactRelationship' => 'nullable|string|max:60',
            'emergencyContactPhone' => 'nullable|string|max:40',
            'occupation' => 'nullable|string|max:120',
            'employer' => 'nullable|string|max:190',
        ]);

        $user = $request->user();

        $data = $request->only([
            'name', 'email', 'phone', 'avatar', 'address', 'gender',
            'bio', 'department', 'nationality', 'cin', 'city',
            'emergency_contact_name', 'emergency_contact_relationship',
            'emergency_contact_phone', 'occupation', 'employer',
        ]);

        if ($request->has('dob')) {
            $data['dob'] = $request->input('dob');
        } elseif ($request->has('dateOfBirth')) {
            $data['dob'] = $request->input('dateOfBirth');
        }

        $emergency = [
            'emergencyContactName' => 'emergency_contact_name',
            'emergencyContactRelationship' => 'emergency_contact_relationship',
            'emergencyContactPhone' => 'emergency_contact_phone',
        ];
        foreach ($emergency as $camel => $column) {
            if ($request->has($camel)) {
                $data[$column] = $request->input($camel);
            }
        }

        $user->fill($data);
        $user->save();

        $this->syncLinkedProfile($user);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => app(AuthController::class)->userPayload($user),
        ]);
    }

    /**
     * Keep the linked teacher/parent/student row in sync.
     */
    protected function syncLinkedProfile($user): void
    {
        if ($user->role === 'teacher' && $user->teacher_id) {
            $teacher = $user->teacher;
            $teacher->name = $user->name;
            $teacher->email = $user->email;
            $teacher->phone = $user->phone ?: $teacher->phone;
            $teacher->gender = $user->gender;
            $teacher->dob = $user->dob;
            $teacher->address = $user->address;
            $teacher->save();
        }

        if ($user->role === 'parent' && $user->parent_id) {
            $parent = $user->parent;
            $parent->name = $user->name;
            $parent->email = $user->email;
            $parent->phone = $user->phone ?: $parent->phone;
            $parent->save();
        }

        if ($user->role === 'student' && $user->student_id) {
            $student = $user->student;
            $student->name = $user->name;
            $student->email = $user->email;
            $student->save();
        }
    }
}