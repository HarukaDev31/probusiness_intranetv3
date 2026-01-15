<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contenedor_consolidado_facturas_electronicas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_cotizacion');
            $table->string('nombre_archivo');
            $table->string('ruta_archivo');
            $table->unsignedBigInteger('tamaño')->nullable();
            $table->string('tipo_mime')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('id_cotizacion')
                  ->references('id')
                  ->on('contenedor_consolidado_cotizacion')
                  ->onDelete('cascade');

            // Index para búsquedas rápidas
            $table->index('id_cotizacion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contenedor_consolidado_facturas_electronicas');
    }
};

