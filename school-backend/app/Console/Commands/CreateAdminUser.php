<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateAdminUser extends Command
{
    protected $signature = 'school:create-admin {--name=} {--email=}';

    protected $description = 'Create or update the primary administrator account (password is entered interactively).';

    public function handle(): int
    {
        $name = trim((string) ($this->option('name') ?: $this->ask('Full name')));
        $email = strtolower(trim((string) ($this->option('email') ?: $this->ask('Email address'))));

        $password = (string) $this->secret('Password (12 characters minimum)');
        $confirmation = (string) $this->secret('Repeat password');

        if ($name === '') {
            $this->error('A full name is required.');

            return self::FAILURE;
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('A valid email address is required.');

            return self::FAILURE;
        }

        if (strlen($password) < 12) {
            $this->error('The password must be at least 12 characters long.');

            return self::FAILURE;
        }

        if (! hash_equals($password, $confirmation)) {
            $this->error('The passwords do not match.');

            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                'name' => $name,
                'password' => $password,
                'role' => 'admin',
                'status' => 'active',
                'last_login' => null,
            ])->save();

            $user->tokens()->delete();

            $this->info('Existing account promoted/updated: '.$email);

            return self::SUCCESS;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->info('Administrator created: '.$email);

        return self::SUCCESS;
    }
}
