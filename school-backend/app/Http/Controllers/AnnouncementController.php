<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Support\MediaStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::orderBy('id', 'desc');
        $caller = $request->user();

        if ($caller?->isSubAdmin()) {
            // A Sub-Admin manages the announcements of its own section only.
            if ($caller->section_id === null) {
                return response()->json(['data' => []]);
            }

            $query->where('section_id', $caller->section_id);
        }

        $announcements = $query->get();

        return response()->json(['data' => $announcements->map(fn (Announcement $a) => $this->mapVue($a))]);
    }

    public function published(): JsonResponse
    {
        $announcements = Announcement::whereIn('status', ['published', 'active'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json(['data' => $announcements->map(fn (Announcement $a) => $this->mapVue($a))]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:190',
            'content' => 'nullable|string',
            'section_id' => 'nullable|integer|exists:sections,id',
        ]);

        $caller = $request->user();

        $a = new Announcement($this->mapStore($request));
        $a->published_by = $caller?->id;

        if ($caller?->isSubAdmin()) {
            // Pinned to the caller's section regardless of payload.
            $a->section_id = $caller->section_id;
        } elseif ($request->filled('section_id')) {
            $a->section_id = $request->integer('section_id');
        }

        $a->save();

        return response()->json([
            'success' => true,
            'data' => ['id' => $a->id],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $a = Announcement::findOrFail($id);
        $this->assertInScope($request, $a);

        $fill = $this->mapUpdate($request);
        if (!empty($fill)) {
            $a->fill($fill);
        }
        $a->save();

        return response()->json([
            'success' => true,
            'data' => ['id' => $a->id],
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $a = Announcement::findOrFail($id);
        $this->assertInScope($request, $a);

        $a->delete();

        return response()->json(['success' => true]);
    }

    /**
     * A Sub-Admin may only touch announcements inside its own section;
     * global (section-less) announcements belong to the Super Admin.
     */
    protected function assertInScope(Request $request, Announcement $announcement): void
    {
        $caller = $request->user();

        if (! $caller || ! $caller->isSubAdmin()) {
            return;
        }

        abort_if(
            $caller->section_id === null
                || $announcement->section_id === null
                || (int) $announcement->section_id !== (int) $caller->section_id,
            403,
            'That announcement belongs to another section.'
        );
    }

    protected function mapStore(Request $request): array
    {
        $title = $request->input('title');
        $content = $request->input('content');

        $fill = [
            'title' => $title,
            'title_en' => $request->input('titleEn') ?? $title,
            'title_ar' => $request->input('titleAr'),
            'content' => $content ?? '',
            'content_en' => $request->input('contentEn') ?? $content ?? '',
            'content_ar' => $request->input('contentAr'),
            'type' => $request->input('type', 'announcement'),
            'priority' => $request->input('priority', 'medium'),
            'status' => $request->input('status', 'published'),
            'author' => $request->input('author', 'Admin'),
            'image' => MediaStore::toUrl($request->input('image'), 'announcements'),
            'video' => MediaStore::toUrl($request->input('video'), 'announcements'),
            'media_type' => $request->input('mediaType') ?? 'none',
            'date' => $request->input('date'),
            'time' => $request->input('time'),
        ];

        if ($request->has('targetAudience')) {
            $fill['target_audience'] = is_array($request->input('targetAudience'))
                ? $request->input('targetAudience')
                : ['all'];
        }

        return $fill;
    }

    /**
     * Only include fields that were actually sent in the request, so a partial
     * update (e.g. toggling only the status) never nulls the remaining
     * NOT NULL columns or wipes the stored values.
     */
    protected function mapUpdate(Request $request): array
    {
        // Multi-key aliases for the bilingual columns: a row is updated when
        // ANY of its aliases is present in the request.
        $aliases = [
            'title_en' => ['title', 'titleEn'],
            'title_ar' => ['titleAr'],
            'content_en' => ['content', 'contentEn'],
            'content_ar' => ['contentAr'],
        ];

        $filtered = [];
        foreach ($this->mapStore($request) as $key => $value) {
            if (isset($aliases[$key])) {
                $present = false;
                foreach ($aliases[$key] as $alt) {
                    if ($request->has($alt)) {
                        $present = true;
                        break;
                    }
                }
                if ($present) {
                    $filtered[$key] = $value;
                }
                continue;
            }

            $requestKey = match ($key) {
                'media_type' => 'mediaType',
                'target_audience' => 'targetAudience',
                default => $key,
            };

            if ($request->has($requestKey)) {
                $filtered[$key] = $value;
            }
        }

        return $filtered;
    }

    protected function mapVue(Announcement $a): array
    {
        $targetAudience = $a->target_audience;
        if (empty($targetAudience)) {
            $targetAudience = $a->audience && $a->audience !== 'all'
                ? [$a->audience]
                : ['all'];
        }

        return [
            'id' => $a->id,
            'title' => $a->title,
            'titleEn' => $a->title_en ?? $a->title,
            'titleAr' => $a->title_ar ?? $a->title,
            'content' => $a->content,
            'contentEn' => $a->content_en ?? $a->content,
            'contentAr' => $a->content_ar ?? $a->content,
            'type' => $a->type ?? 'announcement',
            'priority' => $a->priority ?? 'medium',
            'status' => $a->status,
            'author' => $a->author ?? 'Admin',
            'targetAudience' => $targetAudience,
            'image' => $a->image,
            'video' => $a->video,
            'mediaType' => $a->media_type ?? 'none',
            'views' => (int) ($a->views ?? 0),
            'likes' => (int) ($a->likes ?? 0),
            'comments' => (int) ($a->comments ?? 0),
            'date' => $a->date,
            'time' => $a->time,
            'section_id' => $a->section_id,
            'createdAt' => $a->created_at?->toIso8601String(),
            'updatedAt' => $a->updated_at?->toIso8601String(),
        ];
    }
}