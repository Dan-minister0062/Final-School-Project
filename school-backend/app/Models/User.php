<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar',
        'address',
        'dob',
        'gender',
        'teacher_id',
        'student_id',
        'parent_id',
        'status',
        'department',
        'bio',
        'last_login',
        'nationality',
        'cin',
        'city',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_phone',
        'level',
        'specialization',
        'employment_type',
        'previous_school',
        'experience',
        'qualifications',
        'subjects',
        'assigned_classes',
        'class_name',
        'massar_number',
        'academic_year',
        'admission_type',
        'previous_class',
        'previous_academic_year',
        'parent_name',
        'parent_email',
        'parent_phone',
        'attendance',
        'average_grade',
        'occupation',
        'employer',
        'children_names',
        'invite_token',
        'invite_token_expires_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'dob' => 'date',
            'last_login' => 'datetime',
            'invite_token_expires_at' => 'datetime',
            'qualifications' => 'array',
            'subjects' => 'array',
            'assigned_classes' => 'array',
            'children_names' => 'array',
            'attendance' => 'integer',
            'average_grade' => 'decimal:2',
            'experience' => 'integer',
        ];
    }

    public function teacher(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function student(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(StudentDataParent::class, 'parent_id');
    }

    public function scopeRole($query, $role)
    {
        return $query->where('role', $role);
    }
}