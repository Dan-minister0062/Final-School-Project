<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    use HasFactory;

    public const KEY_KINDERGARTEN = 'kindergarten';

    public const KEY_PRIMARY = 'primary';

    public const KEY_SECONDARY = 'secondary';

    public const KEY_HIGH_SCHOOL = 'high_school';

    protected $fillable = [
        'key',
        'name',
        'name_en',
        'name_ar',
        'description',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'section_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'section_id');
    }

    public function subAdmins(): HasMany
    {
        return $this->hasMany(User::class, 'section_id')->where('role', 'admin');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'section_id');
    }

    public static function keyForClassLevel(?string $levelKey): ?string
    {
        if (! $levelKey) {
            return null;
        }
        $normalised = strtolower(trim($levelKey));

        return match (true) {
            str_contains($normalised, 'kindergarten') || str_contains($normalised, 'kg') => self::KEY_KINDERGARTEN,
            str_contains($normalised, 'high_school') || str_contains($normalised, 'high school') => self::KEY_HIGH_SCHOOL,
            str_contains($normalised, 'secondary') || str_contains($normalised, 'middle') => self::KEY_SECONDARY,
            str_contains($normalised, 'primary') => self::KEY_PRIMARY,
            default => in_array($normalised, self::keys(), true) ? $normalised : null,
        };
    }

    /** @return array<int, string> */
    public static function keys(): array
    {
        return [
            self::KEY_KINDERGARTEN,
            self::KEY_PRIMARY,
            self::KEY_SECONDARY,
            self::KEY_HIGH_SCHOOL,
        ];
    }
}