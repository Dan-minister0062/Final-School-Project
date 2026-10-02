<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_the_health_endpoint_returns_a_successful_response(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }

    public function test_the_root_path_redirects_to_the_health_endpoint(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/up');
    }
}
