<?php

namespace App\Mail;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Registration $registration,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Admission request received');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admission-received',
            with: [
                'name' => $this->registration->parent_name ?: $this->registration->full_name,
            ],
        );
    }
}