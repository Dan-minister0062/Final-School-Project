<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $registrations = Registration::orderBy('id', 'desc');

        if ($request->has('status') && in_array($request->input('status'), ['pending', 'approved', 'rejected'], true)) {
            $registrations->where('status', $request->input('status'));
        }

        if ($request->boolean('paginate')) {
            return response()->json([
                'data' => $registrations->paginate($request->integer('per_page', 50)),
            ]);
        }

        return response()->json([
            'data' => $registrations->get()->map(fn (Registration $r) => $this->map($r)),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $registration = Registration::findOrFail($id);

        return response()->json(['data' => $this->map($registration)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $registration = Registration::findOrFail($id);

        $request->validate([
            'first_name' => 'sometimes|string|max:80',
            'last_name' => 'sometimes|string|max:80',
            'parent_phone' => 'sometimes|string|max:30',
            'parent_email' => 'sometimes|email|max:120',
            'status' => 'sometimes|in:pending,approved,rejected',
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
            'status', 'admin_notes',
        ]);

        if (array_key_exists('has_attended_before', $data)) {
            $data['has_attended_before'] = $request->boolean('has_attended_before');
        }
        if (array_key_exists('special_assistance', $data)) {
            $data['special_assistance'] = $request->boolean('special_assistance');
        }
        if (array_key_exists('terms_agreed', $data)) {
            $data['terms_agreed'] = $request->boolean('terms_agreed');
        }

        $registration->update($data);

        return response()->json([
            'success' => true,
            'data' => $this->map($registration),
        ]);
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $registration = Registration::findOrFail($id);
        $registration->update([
            'status' => $request->input('status'),
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->map($registration),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        Registration::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    protected function map(Registration $r): array
    {
        return [
            'id' => $r->id,
            'registration_number' => $r->registration_number,
            'first_name' => $r->first_name,
            'last_name' => $r->last_name,
            'studentName' => $r->full_name,
            'full_name' => $r->full_name,
            'dob' => $r->dob?->format('Y-m-d'),
            'dateOfBirth' => $r->dob?->format('Y-m-d'),
            'place_of_birth' => $r->place_of_birth,
            'placeOfBirth' => $r->place_of_birth,
            'gender' => $r->gender,
            'nationality' => $r->nationality,
            'address' => $r->address,
            'city' => $r->city,
            'academic_year' => $r->academic_year,
            'academicYear' => $r->academic_year,
            'level' => $r->level,
            'requested_class' => $r->requested_class,
            'requestedClass' => $r->requested_class,
            'admission_type' => $r->admission_type,
            'admissionType' => $r->admission_type,
            'has_attended_before' => (bool) $r->has_attended_before,
            'previous_school' => $r->previous_school,
            'previousSchool' => $r->previous_school,
            'previous_grade' => $r->previous_grade,
            'previousGrade' => $r->previous_grade,
            'last_academic_year' => $r->last_academic_year,
            'lastAcademicYear' => $r->last_academic_year,
            'massar_number' => $r->massar_number,
            'massarNumber' => $r->massar_number,
            'academic_track' => $r->academic_track,
            'academicTrack' => $r->academic_track,
            'special_assistance' => (bool) $r->special_assistance,
            'authorized_pickup' => $r->authorized_pickup,
            'authorizedPickup' => $r->authorized_pickup,
            'parent_name' => $r->parent_name,
            'parentName' => $r->parent_name,
            'relationship' => $r->relationship,
            'parent_phone' => $r->parent_phone,
            'parentPhone' => $r->parent_phone,
            'parent_email' => $r->parent_email,
            'parentEmail' => $r->parent_email,
            'parent_address' => $r->parent_address,
            'parentAddress' => $r->parent_address,
            'cin_id' => $r->cin_id,
            'cinId' => $r->cin_id,
            'emergency_contact' => $r->emergency_contact,
            'emergencyContact' => $r->emergency_contact,
            'emergency_relationship' => $r->emergency_relationship,
            'emergencyRelationship' => $r->emergency_relationship,
            'emergency_phone' => $r->emergency_phone,
            'emergencyPhone' => $r->emergency_phone,
            'message' => $r->additional_notes,
            'additional_notes' => $r->additional_notes,
            'terms_agreed' => (bool) $r->terms_agreed,
            'termsAgreed' => (bool) $r->terms_agreed,
            'status' => $r->status,
            'admin_notes' => $r->admin_notes,
            'adminNotes' => $r->admin_notes,
            'createdAt' => $r->created_at?->toIso8601String(),
            'created_at' => $r->created_at?->toIso8601String(),
            'updatedAt' => $r->updated_at?->toIso8601String(),
            'updated_at' => $r->updated_at?->toIso8601String(),
            '_serverId' => $r->id,
            'source' => 'server',
        ];
    }
}