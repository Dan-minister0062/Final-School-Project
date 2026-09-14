<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    protected array $defaults = [
        'schoolName' => 'Madrassat Al Fath',
        'schoolEmail' => 'info@madrassatalfath.edu',
        'schoolPhone' => '+123 456 7890',
        'schoolAddress' => '123 Education Street, City',
        'schoolDescription' => 'Nurturing Young Minds with Islamic Values',
        'schoolWebsite' => 'www.madrassatalfath.edu',
        'schoolLogo' => null,
        'language' => 'en',
        'enableRegistration' => true,
        'enableAttendance' => true,
        'enableGrades' => true,
        'enableNotifications' => true,
        'maintenanceMode' => false,
    ];

    public function index(): JsonResponse
    {
        $setting = Setting::find(1);

        return response()->json([
            'data' => array_merge($this->defaults, $setting?->payload ?? []),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->input('settings');
        if (! is_array($payload)) {
            $payload = $request->except(['settings']);
        }

        if (! empty($payload)) {
            $setting = Setting::find(1);
            if (! $setting) {
                $setting = new Setting(['id' => 1]);
            }
            $setting->payload = array_merge($this->defaults, $payload);
            $setting->save();
        }

        return response()->json(['message' => 'Settings saved successfully.']);
    }
}