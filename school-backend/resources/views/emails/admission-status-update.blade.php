<p>Hello {{ $name }},</p>

@if ($status === 'approved')
<p>Congratulations! Your admission request for your child has been <strong>approved</strong>.</p>
@else
<p>We are sorry to inform you that your admission request has been <strong>rejected</strong>.</p>
@endif

@if (! empty($adminNotes))
<p>Message from the school: {{ $adminNotes }}</p>
@endif

<p>Thank you for choosing our school.</p>