<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference', 'student_id', 'student_code', 'student_name',
        'parent_id', 'title', 'category', 'amount', 'method', 'status',
        'due_date', 'paid_at', 'created_by', 'notes',
        'month', 'year', 'admission_id', 'parent_email', 'parent_name',
        'class_name', 'level', 'date_of_birth', 'gender', 'address',
        'city', 'phone', 'receipt', 'receipt_name',
    ];

    protected $casts = [
        'amount' => 'float',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'date_of_birth' => 'date',
    ];

    public function student()
    {
        // student_id stores the user id (frontend student.id == users.id)
        return $this->belongsTo(User::class, 'student_id');
    }

    public function parent()
    {
        // parent_id stores the user id of the parent account
        return $this->belongsTo(User::class, 'parent_id');
    }
}