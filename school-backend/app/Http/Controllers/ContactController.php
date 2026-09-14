<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'sometimes|email|max:120',
            'subject' => 'sometimes|string|max:190',
            'message' => 'sometimes|string',
        ]);

        Contact::create($request->only(['name', 'email', 'subject', 'message']));

        return response()->json(['message' => 'Message sent successfully.']);
    }
}