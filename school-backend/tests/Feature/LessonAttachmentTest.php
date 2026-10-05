<?php

namespace Tests\Feature;

use App\Models\LessonAttachment;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LessonAttachmentTest extends TestCase
{
    use RefreshDatabase;

    private Section $primary;

    private User $teacher;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->primary = Section::where('key', 'primary')->firstOrFail();

        $this->teacher = $this->makeUser('teacher.attachments@example.test', 'teacher', [
            'section_id' => $this->primary->id,
            'section_scope' => 'primary',
            'assigned_classes' => ['P1A'],
        ]);

        $this->student = $this->makeUser('student.attachments@example.test', 'student', [
            'section_id' => $this->primary->id,
            'section_scope' => 'primary',
        ]);

        SchoolClass::firstOrCreate(
            ['code' => 'P1A'],
            ['name' => 'Primary 1A', 'level_key' => 'primary', 'section_id' => $this->primary->id],
        );
    }

    private function makeUser(string $email, string $role, array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => $email,
            'email' => $email,
            'role' => $role,
            'password' => Hash::make('password123'),
            'status' => 'active',
        ], $overrides));
    }

    protected function tearDown(): void
    {
        $dir = public_path('uploads/lessons');

        if (is_dir($dir)) {
            foreach (glob($dir.'/*') ?: [] as $file) {
                if (is_file($file)) {
                    File::delete($file);
                }
            }
        }

        parent::tearDown();
    }

    // ------------------------------------------------------------- uploading

    public function test_teacher_uploads_a_file_and_receives_metadata(): void
    {
        $response = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('lesson-notes.pdf', 120, 'application/pdf'),
            ]);

        $response->assertCreated();

        $payload = $response->json();

        $this->assertSame('lesson-notes.pdf', $payload['file_name']);
        $this->assertSame('application/pdf', $payload['file_type']);
        $this->assertSame(122880, $payload['file_size']);
        $this->assertStringEndsWith('.pdf', $payload['file_url']);
        $this->assertStringStartsWith('https://', $payload['file_url']);

        $stored = public_path(str_replace('/', DIRECTORY_SEPARATOR, parse_url($payload['file_url'], PHP_URL_PATH)));
        $this->assertFileExists($stored);
        $this->assertNotSame('lesson-notes.pdf', basename($stored), 'Stored name must be randomised, not the client name');
    }

    public function test_video_upload_is_accepted(): void
    {
        $response = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('lecture.mp4', 2048, 'video/mp4'),
                'title' => 'Lecture recording',
            ]);

        $response->assertCreated();
        $this->assertStringEndsWith('.mp4', $response->json('file_url'));
        $this->assertSame('Lecture recording', $response->json('title'));
    }

    public function test_explicit_title_wins_over_the_file_name(): void
    {
        $response = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('scan.png', 10, 'image/png'),
                'title' => 'Diagram of the water cycle',
            ]);

        $response->assertCreated();
        $this->assertSame('Diagram of the water cycle', $response->json('title'));
        $this->assertSame('scan.png', $response->json('file_name'));
    }

    public function test_executable_extension_is_rejected(): void
    {
        $response = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('shell.php', 4, 'application/x-php'),
            ]);

        $response->assertStatus(422);
        $this->assertSame(0, LessonAttachment::count());
    }

    public function test_upload_without_a_file_or_link_is_rejected(): void
    {
        $this->actingAs($this->teacher)
            ->postJson('/api/lesson-attachments', ['title' => 'nothing here'])
            ->assertStatus(422);
    }

    public function test_students_cannot_upload_attachments(): void
    {
        $this->actingAs($this->student)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
            ])
            ->assertForbidden();
    }

    public function test_guests_cannot_upload_attachments(): void
    {
        $this->post('/api/lesson-attachments', [
            'file' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ])->assertUnauthorized();
    }

    public function test_external_link_is_accepted_without_a_file(): void
    {
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/lesson-attachments', [
                'external_url' => 'https://www.youtube.com/watch?v=abc123',
                'title' => 'Recap video',
            ]);

        $response->assertCreated();

        $payload = $response->json();
        $this->assertSame('https://www.youtube.com/watch?v=abc123', $payload['file_url']);
        $this->assertSame('https://www.youtube.com/watch?v=abc123', $payload['external_url']);
        $this->assertNull($payload['file_size']);
    }

    // ------------------------------------------------------------ persisting

    public function test_uploaded_file_is_persisted_with_the_lesson(): void
    {
        $uploaded = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('worksheet.pdf', 30, 'application/pdf'),
            ])
            ->json();

        $lessonId = $this->actingAs($this->teacher)
            ->postJson('/api/lessons', [
                'title' => 'Fractions lesson',
                'section_id' => $this->primary->id,
                'attachments' => [$uploaded],
            ])
            ->assertCreated()
            ->json('id');

        $this->assertDatabaseHas('lesson_attachments', [
            'lesson_id' => $lessonId,
            'file_url' => $uploaded['file_url'],
            'file_name' => 'worksheet.pdf',
        ]);

        $row = LessonAttachment::where('file_url', $uploaded['file_url'])->firstOrFail();
        $this->assertSame($this->teacher->id, $row->uploaded_by);
    }

    public function test_resaving_a_lesson_does_not_duplicate_attachments(): void
    {
        $uploaded = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('slides.pdf', 30, 'application/pdf'),
            ])
            ->json();

        $payload = [
            'title' => 'Geometry lesson',
            'section_id' => $this->primary->id,
            'attachments' => [$uploaded],
        ];

        $lessonId = $this->actingAs($this->teacher)->postJson('/api/lessons', $payload)->json('id');

        $this->actingAs($this->teacher)
            ->putJson("/api/lessons/{$lessonId}", $payload)
            ->assertOk();

        $this->assertSame(1, LessonAttachment::where('lesson_id', $lessonId)->count());
    }

    public function test_omitting_an_attachment_removes_its_row(): void
    {
        $uploaded = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('slides.pdf', 30, 'application/pdf'),
            ])
            ->json();

        $lessonId = $this->actingAs($this->teacher)->postJson('/api/lessons', [
            'title' => 'Algebra lesson',
            'section_id' => $this->primary->id,
            'attachments' => [$uploaded],
        ])->json('id');

        $this->assertSame(1, LessonAttachment::where('lesson_id', $lessonId)->count());

        $this->actingAs($this->teacher)
            ->putJson("/api/lessons/{$lessonId}", [
                'title' => 'Algebra lesson',
                'attachments' => [],
            ])
            ->assertOk();

        $this->assertSame(0, LessonAttachment::where('lesson_id', $lessonId)->count());
    }

    public function test_lesson_detail_returns_the_attachment(): void
    {
        $uploaded = $this->actingAs($this->teacher)
            ->post('/api/lesson-attachments', [
                'file' => UploadedFile::fake()->create('audio-summary.mp3', 40, 'audio/mpeg'),
            ])
            ->json();

        $lessonId = $this->actingAs($this->teacher)->postJson('/api/lessons', [
            'title' => 'Poetry lesson',
            'section_id' => $this->primary->id,
            'attachments' => [$uploaded],
        ])->json('id');

        $this->actingAs($this->teacher)
            ->getJson("/api/lessons/{$lessonId}")
            ->assertOk()
            ->assertJsonPath('attachments.0.file_name', 'audio-summary.mp3');
    }
}
