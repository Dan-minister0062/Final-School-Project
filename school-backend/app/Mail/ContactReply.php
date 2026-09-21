<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactReply extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Contact $contact,
        public string $reply,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Re: ' . ($this->contact->subject ?: 'Your message to Madrassat Al Fath'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-reply',
            with: [
                'name' => $this->contact->name ?: 'there',
                'original' => $this->contact->message,
                'reply' => $this->reply,
            ],
        );
    }
}