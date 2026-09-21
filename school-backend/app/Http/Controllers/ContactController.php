<?php

namespace App\Http\Controllers;

use App\Mail\ContactReply;
use App\Models\Contact;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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

        $contact = Contact::create($request->only(['name', 'email', 'subject', 'message']));

        $sender = $contact->name ?: ($contact->email ?: 'Visitor');
        $excerpt = mb_substr($contact->message ?? '', 0, 160);

        Notification::create([
            'title' => '📩 New Contact Message from ' . $sender,
            'title_en' => '📩 New contact message: ' . $sender,
            'title_ar' => '📩 رسالة تواصل جديدة من ' . $sender,
            'message' => ($contact->subject ? $contact->subject . ' — ' : '') . $excerpt
                . ($contact->email ? ' (' . $contact->email . ')' : ''),
            'message_en' => ($contact->subject ? $contact->subject . ' — ' : '') . $excerpt
                . ($contact->email ? ' (' . $contact->email . ')' : ''),
            'message_ar' => ($contact->subject ? $contact->subject . ' — ' : '') . $excerpt,
            'type' => 'contact',
            'audience' => 'admin',
            'link' => '/dashboard/admin/contacts',
            'priority' => 'high',
            'metadata' => [
                'contact_id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'subject' => $contact->subject,
            ],
        ]);

        return response()->json(['message' => 'Message sent successfully.']);
    }

    public function index(): JsonResponse
    {
        $contacts = Contact::orderByDesc('id')->get()->map(fn (Contact $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'email' => $c->email,
            'subject' => $c->subject,
            'message' => $c->message,
            'created_at' => $c->created_at?->toIso8601String(),
        ]);

        return response()->json($contacts);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reply' => 'required|string|max:5000',
        ]);

        $contact = Contact::find($id);

        if (! $contact) {
            return response()->json(['message' => 'Message not found.'], 404);
        }

        if (empty($contact->email)) {
            return response()->json(['message' => 'This message has no reply email address.'], 422);
        }

        Mail::to($contact->email)->send(new ContactReply($contact, $request->input('reply')));

        return response()->json(['message' => 'Reply sent successfully.']);
    }
}