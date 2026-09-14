<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentDataParent extends Model
{
    use HasFactory;

    protected $table = 'parents';

    protected $fillable = [
        'code', 'name', 'email', 'phone', 'cin_id', 'address',
        'relationship', 'children', 'status',
    ];

    protected $casts = [
        'children' => 'array',
    ];

    public function user()
    {
        return $this->hasOne(User::class, 'parent_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'parent_id');
    }
}