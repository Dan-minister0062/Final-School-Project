<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\PasswordResetLink;
use App\Support\UserPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Build the user payload returned to the frontend.
     */
    public function userPayload(User $user): array
    {
        return UserPresenter::present($user);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'These credentials do not match our records.',
            ], 422);
        }

        $user->forceFill(['last_login' => now()])->save();

        if ($user->status === 'inactive') {
            return response()->json(['message' => 'Your account is inactive.'], 403);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'role' => $user->role,
            'user' => $this->userPayload($user),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,teacher,parent,student',
        ]);

        $data = $request->only([
            'name', 'email', 'password', 'phone', 'avatar', 'address',
            'dob', 'gender', 'nationality', 'cin', 'city',
            'emergency_contact_name', 'emergency_contact_relationship',
            'emergency_contact_phone',
        ]);
        $data['role'] = $request->role;

        if (in_array($request->role, ['teacher', 'parent', 'student'])) {
            $this->attachProfile($request, $data);
        }

        $user = User::create($data);
        $this->syncRoleFields($user, $request);

        \App\Support\ChildLinker::link($user);
        \App\Support\ChildLinker::linkAll();

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'role' => $user->role,
            'user' => $this->userPayload($user),
        ], 201);
    }

    /**
     * Create the linked profile row (teacher / parent / student) when present.
     */
    protected function attachProfile(Request $request, array &$data): void
    {
        if ($request->role === 'teacher') {
            $teacher = \App\Models\Teacher::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'subject_code' => $request->subject_code ?? $request->subject_specialization,
                'subject' => $request->subject_code ?? $request->subject_specialization,
                'class_codes' => $request->class_codes ?? [],
            ]);
            $data['teacher_id'] = $teacher->id;
        }

        if ($request->role === 'parent') {
            $parent = \App\Models\StudentDataParent::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'cin_id' => $request->cin_id,
                'address' => $request->address,
            ]);
            $data['parent_id'] = $parent->id;
        }

        if ($request->role === 'student') {
            $student = \App\Models\Student::create([
                'name' => $request->name,
                'email' => $request->email,
                'class_code' => $request->class_code,
                'code' => $request->code,
            ]);
            $data['student_id'] = $student->id;
        }
    }

    /**
     * Fold the frontend's role-specific registration/profile fields onto the
     * user row (they are kept flattened for the /users presenter).
     */
    protected function syncRoleFields(User $user, Request $request): void
    {
        $role = $user->role;
        $fill = [];

        if ($role === 'teacher') {
            $fill['level'] = $request->input('level', $request->input('program'));
            $fill['specialization'] = $request->input('specialization');
            $fill['employment_type'] = $request->input('employment_type');
            $fill['previous_school'] = $request->input('previous_school');
            $fill['experience'] = $request->input('experienceYears', $request->input('experience', 0));

            if ($request->has('qualifications')) {
                $fill['qualifications'] = $this->toStringArray($request->input('qualifications'));
            } elseif ($request->input('qualification')) {
                $fill['qualifications'] = [$request->input('qualification')];
            }

            if ($request->has('subjects')) {
                $fill['subjects'] = $this->toStringArray($request->input('subjects'));
            } elseif ($request->input('subject_specialization')) {
                $fill['subjects'] = [$request->input('subject_specialization')];
            }

            if ($request->has('assigned_classes')) {
                $fill['assigned_classes'] = $this->toStringArray($request->input('assigned_classes'));
            }
        }

        if ($role === 'student') {
            $fill['class_name'] = $request->input('className', $request->input('class_name', $request->input('grade')));
            $fill['level'] = $request->input('level', $request->input('program'));
            $fill['massar_number'] = $request->input('massar_number');
            $fill['academic_year'] = $request->input('academic_year');
            $fill['admission_type'] = $request->input('admission_type');
            $fill['previous_class'] = $request->input('previous_class');
            $fill['previous_academic_year'] = $request->input('previous_academic_year');
            $fill['parent_name'] = $request->input('parent_name', $request->input('parentName'));
            $fill['parent_email'] = $request->input('parent_email', $request->input('parentEmail'));
            $fill['parent_phone'] = $request->input('parent_phone', $request->input('parentPhone'));
        }

        if ($role === 'parent') {
            $fill['occupation'] = $request->input('occupation');
            $fill['employer'] = $request->input('employer');
            if ($request->has('childrenNames') || $request->has('children_names')) {
                $fill['children_names'] = $this->toStringArray(
                    $request->input('childrenNames', $request->input('children_names'))
                );
            }
        }

        if (! empty($fill)) {
            $user->fill($fill)->save();
        }
    }

    protected function toStringArray(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }
        if (is_string($value)) {
            return $value === ''
                ? []
                : array_map('trim', array_filter(explode(',', $value), fn ($v) => trim($v) !== ''));
        }

        return [];
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
            'role' => $request->user()->role,
        ]);
    }

    public function myChildren(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'parent' || ! $user->parent_id) {
            return response()->json(['data' => []]);
        }

        $studentIds = \App\Models\Student::where('parent_id', $user->parent_id)
            ->pluck('id');

        $children = User::with(['teacher', 'student', 'parent'])
            ->whereIn('student_id', $studentIds)
            ->orderBy('id')
            ->get()
            ->map(fn (User $u) => UserPresenter::present($u));

        return response()->json([
            'data' => array_values($children->all()),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'sometimes|required_without:new_password|string|min:6',
            'password_confirmation' => 'nullable|string|same:password',
            'new_password' => 'sometimes|required_without:password|string|min:6',
            'new_password_confirmation' => 'nullable|string|same:new_password',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        $newPassword = $request->input('password', $request->input('new_password'));
        $user->password = Hash::make($newPassword);
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if ($user) {
            $token = Str::random(64);
            $user->forceFill([
                'invite_token' => $token,
                'invite_token_expires_at' => now()->addMinutes(60),
            ])->save();

            Mail::to($user->email)->send(new PasswordResetLink($user, $token));
        }

        return response()->json([
            'message' => 'Password reset link sent to your email.',
        ]);
    }

    public function acceptInvite(Request $request, string $token): JsonResponse
    {
        $user = User::where('invite_token', $token)
            ->where(function ($query) {
                $query->whereNull('invite_token_expires_at')
                    ->orWhere('invite_token_expires_at', '>', now());
            })
            ->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired invitation link.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ],
        ]);
    }

    public function setPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('invite_token', $request->token)
            ->where(function ($query) {
                $query->whereNull('invite_token_expires_at')
                    ->orWhere('invite_token_expires_at', '>', now());
            })
            ->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired invitation link.',
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
            'invite_token' => null,
            'invite_token_expires_at' => null,
        ])->save();

        return response()->json(['success' => true]);
    }
}
