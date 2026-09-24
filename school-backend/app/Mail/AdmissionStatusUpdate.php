<?php

namespace App\Mail;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionStatusUpdate extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Registration $registration,
        public string $status,
    ) {
    }

    public function envelope(): Envelope
    {
        $subject = $this->status === 'approved'
            ? 'Admission request approved'
            : 'Admission request rejected';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admission-status-update',
            with: [
                'name' => $this->registration->parent_name ?: $this->registration->full_name,
                'status' => $this->status,
                'adminNotes' => $this->registration->admin_notes,
            ],
        );
    }
}