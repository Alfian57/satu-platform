<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuditRequestContext
{
    /**
     * Extract the fixed, non-payload request context allowed in domain audit.
     *
     * @return array<string, scalar|null>
     */
    public function from(?Request $request): array
    {
        if ($request === null) {
            return [];
        }

        $context = [
            'method' => $request->method(),
        ];

        $requestId = $request->headers->get('X-Request-ID');

        if (
            is_string($requestId)
            && (
                preg_match(
                    '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                    $requestId,
                ) === 1
                || preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/i', $requestId) === 1
            )
        ) {
            $context['request_id'] = $requestId;
        }

        $routeName = $request->route()?->getName();

        if (is_string($routeName) && $routeName !== '') {
            $context['route_name'] = Str::limit($routeName, 128, '');
        }

        return $context;
    }
}
