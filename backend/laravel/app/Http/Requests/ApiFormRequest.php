<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Все FormRequest кидают единый формат ошибки контракта (то же, что в bootstrap/app.php):
 * { status: 422, error: validation_error, message, details: { field: [messages] } }.
 */
abstract class ApiFormRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => 422,
            'error' => 'validation_error',
            'message' => 'The given data was invalid.',
            'details' => collect($validator->errors()->toArray())
                ->map(fn ($messages) => array_values((array) $messages))
                ->all(),
        ], 422));
    }
}
