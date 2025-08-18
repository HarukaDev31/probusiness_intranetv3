import type { PaginationInfo } from "../types/data-table"

/**type this {
    "success": true,
    "data": [
        {
            "index": 1,
            "nombre": 0,
            "documento": "44649921",
            "correo": "Lucia.morem@gmail.com",
            "telefono": "51 925759748",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 987
        },
        {
            "index": 2,
            "nombre": 0,
            "documento": "20612718173",
            "correo": null,
            "telefono": "51 980 306 086",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 1017
        },
        {
            "index": 3,
            "nombre": 0,
            "documento": "46818550",
            "correo": "arturo.pomiano@gmail.com",
            "telefono": "51915092388",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 1018
        },
        {
            "index": 4,
            "nombre": 0,
            "documento": "76622754",
            "correo": null,
            "telefono": "51 913 737 313",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 982
        },
        {
            "index": 5,
            "nombre": 0,
            "documento": "73319649",
            "correo": "juegosmundofeliz01@gmail.com",
            "telefono": "51 984 481 013",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 986
        },
        {
            "index": 6,
            "nombre": 0,
            "documento": "75433593",
            "correo": "Freddy23rf@gmail.com",
            "telefono": "51 977 151 514",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 964
        },
        {
            "index": 7,
            "nombre": 0,
            "documento": "2899576",
            "correo": "eduardo.daza.daza@gmail.com",
            "telefono": "51 965 830 485",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 959
        },
        {
            "index": 8,
            "nombre": 0,
            "documento": "20611333928",
            "correo": null,
            "telefono": "51 944 119 988",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 960
        },
        {
            "index": 9,
            "nombre": 0,
            "documento": "76329597",
            "correo": "mseo421@hotmail.com",
            "telefono": "51 912396528 ",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 954
        },
        {
            "index": 10,
            "nombre": 0,
            "documento": null,
            "correo": null,
            "telefono": "51901332628",
            "tipo_cliente": 0,
            "volumen_final": null,
            "fob_final": "0.00",
            "logistica_final": null,
            "impuestos_final": "0.00",
            "tarifa_final": null,
            "estado_cotizacion_final": "PENDIENTE",
            "id_cotizacion": 955
        }
    ],
    "pagination": {
        "current_page": 1,
        "per_page": 10,
        "total": 27,
        "last_page": 3,
        "from": 1,
        "to": 10
    }
} */
export interface General {
    nombre: number
    documento: string
    correo: string | null
    telefono: string
    tipo_cliente: number
    volumen_final: number | null
    fob_final: number
    logistica_final: number | null
    impuestos_final: number
    tarifa_final: number | null
    estado_cotizacion_final: string
    id_cotizacion: number
}
export interface GeneralResponse {
    success: boolean
    data: General[]
    pagination: PaginationInfo
}