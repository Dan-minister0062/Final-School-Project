<?php

namespace App\Console\Commands;

use App\Support\ChildLinker;
use Illuminate\Console\Command;

class LinkChildren extends Command
{
    protected $signature = 'children:link';

    protected $description = 'Re-link every parent to their students so each parent can see their children.';

    public function handle(): int
    {
        ChildLinker::linkAll();

        $this->info('Parent-child links have been reconciled.');

        return self::SUCCESS;
    }
}