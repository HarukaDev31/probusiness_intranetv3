<?php

namespace App\Models\CargaConsolidada;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacturaComercial extends Model
{
    use HasFactory;

    protected $table = 'contenedor_consolidado_facturas_electronicas';

    protected $fillable = [
        'id_cotizacion',
        'nombre_archivo',
        'ruta_archivo',
        'tamaño',
        'tipo_mime',
    ];

    protected $casts = [
        'tamaño' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con la cotización
     */
    public function cotizacion(): BelongsTo
    {
        return $this->belongsTo(Cotizacion::class, 'id_cotizacion');
    }
}

