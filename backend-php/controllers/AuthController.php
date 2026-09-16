<?php

class AuthController
{
    public function login(): void
    {
        $body = Request::body();
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';
        $token = Auth::login($email, $password);
        Response::json(['token' => $token]);
    }

    public function logout(): void
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
            Auth::logout($matches[1]);
        }
        Response::noContent();
    }
}
