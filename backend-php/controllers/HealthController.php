<?php

class HealthController
{
    public function check(): void
    {
        Response::json(['status' => 'ok']);
    }
}
