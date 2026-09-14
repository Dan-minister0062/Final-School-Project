<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdmissionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:80',
            'last_name' => 'required|string|max:80',
            'parent_phone' => 'required|string|max:30',
            'parent_email' => 'required|email|max:120',
        ]);

        $data = $request->only([
            'first_name', 'last_name', 'dob', 'place_of_birth', 'gender',
            'nationality', 'address', 'city', 'academic_year', 'level',
            'requested_class', 'admission_type', 'has_attended_before',
            'previous_school', 'previous_grade', 'last_academic_year',
            'massar_number', 'academic_track', 'special_assistance',
            'authorized_pickup', 'parent_name', 'relationship',
            'parent_phone', 'parent_email', 'parent_address', 'cin_id',
            'parent_password', 'emergency_contact', 'emergency_relationship',
            'emergency_phone', 'additional_notes', 'terms_agreed',
        ]);

        $data['registration_number'] = 'REG-' . strtoupper(uniqid());
        $data['has_attended_before'] = $request->boolean('has_attended_before');
        $data['special_assistance'] = $request->boolean('special_assistance');
        $data['terms_agreed'] = $request->boolean('terms_agreed');
        $data['status'] = 'pending';

        // Never store the guardian password in plain text - it becomes the
        // account password when the admission is approved.
        if (! empty($data['parent_password'])) {
            $data['parent_password'] = \Illuminate\Support\Facades\Hash::make($data['parent_password']);
        }

        $registration = Registration::create($data);

        Notification::create([
            'title' => '📝 New Student Registration: ' . $registration->full_name,
            'message' => ($registration->parent_name ?: 'Parent') . ' registered '
                . $registration->full_name
                . ($registration->level ? ' (' . $registration->level . ')' : ''),
            'type' => 'registration',
            'audience' => 'admin',
            'link' => '/dashboard/admin/registrations',
            'priority' => 'high',
            'metadata' => [
                'student_name' => $registration->full_name,
                'parent_name' => $registration->parent_name,
                'registration_id' => $registration->id,
            ],
        ]);

        return response()->json([
            'message' => 'Admission application submitted successfully.',
            'registration' => $registration,
        ], 201);
    }
}