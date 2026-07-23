<?php

namespace App\Concerns;

interface InstitutionOwned
{
    /**
     * Return the owning institution identifier used for authorization and query scoping.
     */
    public function institutionId(): int;
}
