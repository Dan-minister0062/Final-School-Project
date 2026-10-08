<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_number', 'first_name', 'last_name', 'dob',
        'place_of_birth', 'gender', 'nationality', 'address', 'city',
        'academic_year', 'level', 'requested_class', 'admission_type',
        'has_attended_before', 'previous_school', 'previous_grade',
        'last_academic_year', 'massar_number', 'academic_track',
        'special_assistance', 'authorized_pickup', 'parent_name',
        'relationship', 'parent_phone', 'parent_email', 'parent_address',
        'cin_id', 'parent_password', 'emergency_contact',
        'emergency_relationship', 'emergency_phone', 'additional_notes',
        'terms_agreed', 'status', 'admin_notes',
    ];

    protected $casts = [
        'dob' => 'date',
        'has_attended_before' => 'boolean',
        'special_assistance' => 'boolean',
        'terms_agreed' => 'boolean',
    ];

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    /**
     * Restrict a registrations query to the section a Sub-Admin governs:
     * a row belongs to the section its level maps to, or whose requested
     * class sits inside that section. Super Admins (and every other caller)
     * stay unrestricted here.
     *
     * Registrations carry no section_id of their own; the level / requested
     * class is the only section signal the schema stores.
     */
    public function scopeForSectionAdmin($query, ?User $caller)
    {
        if (! $caller || ! $caller->isSubAdmin()) {
            return $query;
        }

        $scope = $caller->scopeKey();
        $values = $caller->allowedClassValues();

        $levelLikes = match ($scope) {
            Section::KEY_KINDERGARTEN => ['%kindergarten%', '%kg%'],
            Section::KEY_PRIMARY => ['%primary%'],
            Section::KEY_SECONDARY => ['%secondary%', '%middle%'],
            Section::KEY_HIGH_SCHOOL => ['%high_school%', '%high school%'],
            default => [],
        };

        return $query->where(function ($q) use ($values, $levelLikes) {
            $q->whereIn('requested_class', $values);

            if ($levelLikes !== []) {
                $q->orWhere(function ($levelQuery) use ($levelLikes) {
                    foreach ($levelLikes as $like) {
                        $levelQuery->orWhere('level', 'like', $like);
                    }
                });
            }
        });
    }
}