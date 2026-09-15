<?php

class Router
{
    private array $routes = [];

    /** @param bool $auth si true, exige Auth::requireAuth() antes de despachar */
    public function add(string $method, string $pattern, string $controllerClass, string $action, bool $auth = true): void
    {
        $regex = preg_replace('#\{[a-zA-Z_]+\}#', '([^/]+)', $pattern);
        preg_match_all('#\{([a-zA-Z_]+)\}#', $pattern, $paramMatches);

        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => '#^' . $regex . '$#',
            'paramNames' => $paramMatches[1],
            'controllerClass' => $controllerClass,
            'action' => $action,
            'auth' => $auth,
        ];
    }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            if (preg_match($route['regex'], $path, $matches)) {
                array_shift($matches);
                $params = array_combine($route['paramNames'], $matches);

                if ($route['auth']) {
                    Auth::requireAuth();
                }

                $controller = new $route['controllerClass']();
                call_user_func_array([$controller, $route['action']], $params);
                return;
            }
        }
        Response::error('Ruta no encontrada', 404);
    }
}
