<?php

use App\Support\Notification\FakeWhatsAppGateway;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature', 'Browser');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

function latestWhatsappOtp(FakeWhatsAppGateway $gateway): string
{
    $messages = $gateway->sentMessages();
    $message = $messages[array_key_last($messages)]['message'] ?? '';

    preg_match('/\b(\d{6})\b/', $message, $matches);

    return $matches[1] ?? throw new RuntimeException('No OTP was sent by the fake gateway.');
}

/**
 * Measure the SQL queries executed while running a callback.
 *
 * @param  callable(): mixed  $callback
 * @param  list<string>  $tables
 * @return array{total: int, tables: array<string, int>}
 */
function measureDatabaseQueries(callable $callback, array $tables = []): array
{
    /** @var ConnectionInterface $connection */
    $connection = DB::connection();
    $connection->flushQueryLog();
    $connection->enableQueryLog();

    try {
        $callback();

        /** @var list<array{query: string, bindings: array<int, mixed>, time: float}> $queries */
        $queries = $connection->getQueryLog();
    } finally {
        $connection->disableQueryLog();
    }

    $counts = array_fill_keys($tables, 0);

    foreach ($queries as $query) {
        $sql = strtolower($query['query']);

        foreach (array_keys($counts) as $table) {
            if (str_contains($sql, $table)) {
                $counts[$table]++;
            }
        }
    }

    return [
        'total' => count($queries),
        'tables' => $counts,
    ];
}
