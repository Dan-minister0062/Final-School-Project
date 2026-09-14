<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Payment;

$rows = Payment::orderByDesc('id')->limit(10)->get(['id', 'reference', 'student_name', 'status', 'receipt', 'receipt_name']);
foreach ($rows as $p) {
    $r = (string) $p->receipt;
    echo $p->id.' | '.$p->status.' | '.($p->receipt_name ?: 'NO_NAME').' | len='.strlen($r).' | head='.substr($r, 0, 60).PHP_EOL;
}
echo 'TOTAL RECEIPT ROWS: '.Payment::whereNotNull('receipt')->where('receipt', '!=', '')->count().PHP_EOL;