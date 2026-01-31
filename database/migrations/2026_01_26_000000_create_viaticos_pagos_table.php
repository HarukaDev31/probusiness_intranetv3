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
        Schema::create('viaticos_pagos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('viatico_id');
            $table->string('concepto');
            $table->decimal('monto', 12, 2);
            $table->string('nombre_original')->nullable()->comment('Nombre original del archivo subido');
            $table->string('ruta_archivo')->nullable()->comment('Ruta relativa del archivo en storage');
            $table->string('url')->nullable()->comment('URL completa para acceso al documento/imagen');
            $table->unsignedBigInteger('tamaño')->nullable()->comment('Tamaño del archivo en bytes');
            $table->string('tipo_mime', 100)->nullable()->comment('Tipo MIME del archivo');
            $table->timestamps();

            $table->foreign('viatico_id')->references('id')->on('viaticos')->onDelete('cascade');
            $table->index('viatico_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('viaticos_pagos');
    }
};
