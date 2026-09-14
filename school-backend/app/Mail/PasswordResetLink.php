<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetLink extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $token,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reset your password');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset-link',
            with: [
                'name' => $this->user->name,
                'resetUrl' => rtrim((string) config('app.frontend_url'), '/')
                    . '/accept-invite/' . $this->token,
            ],
        );
    }
}
