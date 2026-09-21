<p>Hello {{ $name }},</p>

<p>Thank you for contacting Madrassat Al Fath. Here is our reply to your message:</p>

<blockquote style="border-left: 3px solid #1a5f7a; padding-left: 12px; margin: 12px 0; color: #555;">
    {!! nl2br(e($reply)) !!}
</blockquote>

@if($original)
    <p style="color: #888; font-size: 0.9em;">
        Your original message:<br>
        <em>{{ $original }}</em>
    </p>
@endif

<p>Best regards,<br>Madrassat Al Fath Administration</p>