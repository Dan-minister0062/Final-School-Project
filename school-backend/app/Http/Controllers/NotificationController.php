<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Notification::orderBy('id', 'desc')
            ->where($this->visibilityScope($user));

        return response()->json($query->get()->map(fn (Notification $n) => $this->mapVue($n)));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:190',
            'message' => 'required|string',
            'audience' => 'sometimes|string|nullable|max:60',
            'user_id' => 'sometimes|integer|nullable',
        ]);

        $n = new Notification([
            'title' => $request->input('title'),
            'title_en' => $request->input('titleEn') ?? $request->input('title'),
            'title_ar' => $request->input('titleAr'),
            'message' => $request->input('message'),
            'message_en' => $request->input('messageEn') ?? $request->input('message'),
            'message_ar' => $request->input('messageAr'),
            'type' => $request->input('type', 'info'),
            'link' => $request->input('link'),
            'priority' => $request->input('priority', 'low'),
            'metadata' => $request->input('metadata'),
            'audience' => $request->input('audience', 'all'),
            'user_id' => $request->has('user_id') ? $request->input('user_id') : $request->user()?->id,
        ]);
        $n->save();

        return response()->json([
            'success' => true,
            'data' => ['id' => $n->id],
        ], 201);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::where('id', $id)
            ->where($this->visibilityScope($user))
            ->first();

        if ($notification) {
            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();
        Notification::where('is_read', false)
            ->where($this->visibilityScope($user))
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::find($id);

        if (! $notification) {
            return response()->json(['success' => true]);
        }

        if ($user && $user->role === 'admin') {
            $notification->delete();

            return response()->json(['success' => true]);
        }

        $visible = $notification->user_id === $user?->id || $notification->user_id === null;
        if (! $user || ! $visible) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $notification->delete();

        return response()->json(['success' => true]);
    }

    protected function mapVue(Notification $n): array
    {
        return [
            'id' => $n->id,
            'title' => $n->title,
            'titleEn' => $n->title_en ?? $n->title,
            'titleAr' => $n->title_ar ?? $n->title,
            'message' => $n->message,
            'messageEn' => $n->message_en ?? $n->message,
            'messageAr' => $n->message_ar ?? $n->message,
            'type' => $n->type ?? 'info',
            'link' => $n->link,
            'priority' => $n->priority ?? 'low',
            'metadata' => $n->metadata ?? [],
            'audience' => $n->audience ?? 'all',
            'read' => (bool) $n->is_read,
            'createdAt' => $n->created_at?->toIso8601String(),
            'created_at' => $n->created_at?->toIso8601String(),
        ];
    }

    /**
     * A notification is visible to a user when it was addressed to them
     * personally (user_id) OR it is broadcast to an audience they belong to
     * (audience = all | role | "teachers" | "students" | "parents" | class code).
     */
    protected function visibilityScope(?User $user): callable
    {
        return function ($q) use ($user) {
            if ($user) {
                $q->where(function ($inner) use ($user) {
                    $inner->where('user_id', $user->id)
                        ->orWhere(function ($broadcast) use ($user) {
                            $broadcast->whereNull('user_id')
                                ->whereIn('audience', $this->audiencesFor($user));
                        });
                });
            } else {
                $q->whereNull('user_id')->where('audience', 'all');
            }
        };
    }

    protected function audiencesFor(User $user): array
    {
        $audiences = ['all', $user->role];
        $user->loadMissing(['student', 'parent']);

        if ($user->role === 'student') {
            $audiences[] = 'students';
            if ($user->student) {
                $audiences[] = $user->student->class_code;
            }
        } elseif ($user->role === 'teacher') {
            $audiences[] = 'teachers';
            foreach ($this->teacherAssignedClasses($user) as $code) {
                $audiences[] = $code;
            }
        } elseif ($user->role === 'parent') {
            $audiences[] = 'parents';
            $audiences[] = 'students';
            foreach (\App\Models\Student::where('parent_id', $user->parent_id)->pluck('class_code') as $code) {
                $audiences[] = $code;
            }
        } elseif ($user->role === 'admin') {
            $audiences[] = 'admins';
        }

        return array_values(array_unique(array_filter($audiences)));
    }

    protected function teacherAssignedClasses(User $user): array
    {
        $raw = $user->assigned_classes;
        if (is_string($raw)) {
            $raw = json_decode($raw, true);
        }

        return is_array($raw) ? $raw : [];
    }
}