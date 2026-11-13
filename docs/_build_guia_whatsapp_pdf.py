# -*- coding: utf-8 -*-
"""Guía PDF — Configurar WhatsApp Chat (cliente no técnico)."""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "docs" / "Guia_Configurar_WhatsApp_Chat.pdf"

BRAND = colors.HexColor("#17233a")
ACCENT = colors.HexColor("#f26522")
MUTED = colors.HexColor("#5b6b82")
LIGHT = colors.HexColor("#f4f6f9")
BORDER = colors.HexColor("#d5dbe6")
WHITE = colors.white


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=BRAND,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=BRAND,
            spaceBefore=14,
            spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=ACCENT,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=BRAND,
            alignment=TA_JUSTIFY,
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=BRAND,
            leftIndent=2,
            spaceAfter=2,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=BRAND,
        ),
        "cell_b": ParagraphStyle(
            "cell_b",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=BRAND,
        ),
        "note": ParagraphStyle(
            "note",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=11,
            textColor=MUTED,
            spaceBefore=4,
            spaceAfter=6,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "step": ParagraphStyle(
            "step",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=BRAND,
            spaceAfter=3,
        ),
    }


def hr():
    return HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=4, spaceAfter=8)


def table(headers, rows, col_widths):
    s = styles()
    data = [[Paragraph(h, s["cell_b"]) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), s["cell"]) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    # header cells need white text - override Paragraph color via style on header row
    header_style = ParagraphStyle(
        "cell_h",
        parent=s["cell_b"],
        textColor=WHITE,
    )
    data[0] = [Paragraph(h, header_style) for h in headers]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(1.8 * cm, 1.4 * cm, A4[0] - 1.8 * cm, 1.4 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.8 * cm, 0.9 * cm, "ProBusiness · Guía WhatsApp Chat")
    canvas.drawRightString(A4[0] - 1.8 * cm, 0.9 * cm, f"Página {doc.page}")
    canvas.restoreState()


def build():
    s = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.6 * cm,
        bottomMargin=2.0 * cm,
        title="Guía: Configurar WhatsApp Chat",
        author="ProBusiness",
    )
    story = []

    # Portada
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph("Guía rápida", s["cover_sub"]))
    story.append(Paragraph("Configurar WhatsApp<br/>para el Chat de la intranet", s["cover_title"]))
    story.append(hr())
    story.append(
        Paragraph(
            "Instrucciones claras para conectar el número de WhatsApp Business "
            "con el chat de la intranet. Pensado para quien configura la cuenta, "
            "sin jerga técnica.",
            s["cover_sub"],
        )
    )
    story.append(Spacer(1, 0.4 * cm))

    # 1
    story.append(Paragraph("1. Qué vas a lograr", s["h1"]))
    story.append(
        Paragraph(
            "Que tu equipo pueda chatear con clientes desde la intranet, "
            "usando el número de WhatsApp Business de tu empresa.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Cada empresa usa su propio número. La configuración se guarda en la intranet, "
            "en la pantalla <b>WhatsApp</b>.",
            s["body"],
        )
    )

    # 2
    story.append(Paragraph("2. Qué necesitas antes", s["h1"]))
    bullets = [
        "Cuenta de WhatsApp Business en Meta (Facebook Business).",
        "Un número de WhatsApp ya activo en esa cuenta.",
        "Acceso a Meta for Developers (o alguien de tu equipo que lo gestione).",
        "Usuario de intranet con permiso para configurar WhatsApp "
        "(en ProBusiness: Gerencia; en socios: perfil Socio).",
        "La dirección del enlace webhook la te dará el equipo técnico de ProBusiness "
        "(es la URL donde Meta envía los mensajes).",
    ]
    for b in bullets:
        story.append(Paragraph(f"• {b}", s["bullet"]))

    # 3
    story.append(Paragraph("3. Dónde se configura en la intranet", s["h1"]))
    story.append(
        table(
            ["Pantalla", "Para qué", "Cómo llegar"],
            [
                [
                    "WhatsApp<br/>(configuración)",
                    "Pegar los datos del número y las claves de Meta. Activar o apagar el servicio.",
                    "Menú o ruta <b>/admin/whatsapp</b>. También desde el engranaje del chat.",
                ],
                [
                    "Chat WhatsApp",
                    "Ver conversaciones y escribir a clientes.",
                    "Menú <b>Chat WhatsApp</b> → <b>/coordinacion/whatsapp-inbox</b>.",
                ],
            ],
            [4.2 * cm, 7.2 * cm, 5.4 * cm],
        )
    )
    story.append(
        Paragraph(
            "Regla simple: los datos de Meta van solo en <b>WhatsApp (configuración)</b>. "
            "El chat es solo para operar.",
            s["note"],
        )
    )

    # 4
    story.append(Paragraph("4. Datos que debes completar", s["h1"]))
    story.append(
        Paragraph(
            "En la pantalla <b>WhatsApp</b> completa estos campos. "
            "Si un campo secreto ya estaba guardado, déjalo vacío para no cambiarlo.",
            s["body"],
        )
    )
    story.append(
        table(
            ["Campo en la pantalla", "Qué es (en simple)", "¿Obligatorio?"],
            [
                ["Activar WhatsApp", "Enciende o apaga el chat de tu empresa.", "Sí"],
                ["Número visible", "Cómo se muestra el número (ej. +51 999…).", "Recomendado"],
                ["ID del número", "Identificador del número en Meta (Phone number ID).", "Sí"],
                ["ID de la cuenta (WABA)", "Identificador de tu cuenta WhatsApp Business.", "Sí"],
                ["Token de acceso", "Clave para que la intranet envíe y reciba mensajes.", "Sí"],
                ["Secreto de la app", "Clave de seguridad de la aplicación en Meta.", "Sí"],
                [
                    "Token del webhook",
                    "Contraseña que tú defines. Debe ser <b>igual</b> en Meta y aquí.",
                    "Sí",
                ],
                ["Versión de la API", "Versión técnica (suele ser v19.0).", "Recomendado"],
                ["Idioma de plantillas", "Idioma de los mensajes plantilla (ej. es_PE).", "Recomendado"],
            ],
            [4.5 * cm, 9.0 * cm, 3.3 * cm],
        )
    )

    # 5
    story.append(Paragraph("5. Pasos en Meta (Facebook)", s["h1"]))
    story.append(Paragraph("5.1 Preparar la cuenta", s["h2"]))
    for i, t in enumerate(
        [
            "Entra a Meta for Developers y abre (o crea) la aplicación de tu empresa.",
            "Agrega el producto WhatsApp y vincula tu cuenta Business y el número.",
            "Copia: ID del número, ID de la cuenta (WABA), Token de acceso y Secreto de la app.",
        ],
        1,
    ):
        story.append(Paragraph(f"<b>{i}.</b> {t}", s["step"]))

    story.append(Paragraph("5.2 Conectar el webhook (entrada de mensajes)", s["h2"]))
    story.append(
        Paragraph(
            "En Meta, en la configuración del webhook de WhatsApp:",
            s["body"],
        )
    )
    for i, t in enumerate(
        [
            "Pega la <b>URL de callback</b> que te indique ProBusiness (termina en /webhooks/meta/whatsapp-inbox).",
            "En <b>Verify token</b> escribe la misma frase/clave que pondrás en “Token del webhook” de la intranet.",
            "Suscribe el campo de mensajes (messages).",
            "Guarda. Meta debe mostrar el webhook como verificado.",
        ],
        1,
    ):
        story.append(Paragraph(f"<b>{i}.</b> {t}", s["step"]))

    story.append(Paragraph("5.3 Plantillas (mensajes fuera de la ventana de 24 h)", s["h2"]))
    story.append(
        Paragraph(
            "Si necesitas escribirle a un cliente que no te ha respondido en las últimas 24 horas, "
            "Meta exige plantillas aprobadas. Créalas en Meta Business Manager en el idioma "
            "configurado (por ejemplo español Perú). El detalle de textos lo puede entregar el equipo ProBusiness.",
            s["body"],
        )
    )

    # 6
    story.append(Paragraph("6. Pasos en la intranet", s["h1"]))
    for i, t in enumerate(
        [
            "Inicia sesión con un usuario autorizado (Gerencia / Socio, según tu empresa).",
            "Abre <b>WhatsApp</b> (configuración): /admin/whatsapp.",
            "Enciende <b>Activar WhatsApp</b>.",
            "Completa los campos de la sección 4 con los datos de Meta.",
            "Asegúrate de que el <b>Token del webhook</b> sea idéntico al de Meta.",
            "Pulsa <b>Guardar</b>.",
            "Abre el <b>Chat WhatsApp</b> y haz una prueba: plantilla o mensaje de texto.",
        ],
        1,
    ):
        story.append(Paragraph(f"<b>{i}.</b> {t}", s["step"]))

    # 7
    story.append(Paragraph("7. Cómo saber que quedó bien", s["h1"]))
    for b in [
        "Meta muestra el webhook verificado.",
        "En la intranet, WhatsApp está activado y guardado.",
        "Puedes enviar un mensaje de prueba desde el chat.",
        "Llega un mensaje del cliente al chat (prueba escribiendo al número desde un celular).",
    ]:
        story.append(Paragraph(f"• {b}", s["bullet"]))

    # 8
    story.append(Paragraph("8. Si algo falla", s["h1"]))
    story.append(
        table(
            ["Qué ves", "Qué revisar"],
            [
                [
                    "Meta no verifica el webhook",
                    "El token del webhook debe ser exactamente el mismo en Meta y en /admin/whatsapp.",
                ],
                [
                    "No llegan mensajes",
                    "URL del webhook, secreto de la app, y que el ID del número coincida con el de Meta.",
                ],
                [
                    "No puedo enviar",
                    "Que “Activar WhatsApp” esté encendido y que el token de acceso sea válido.",
                ],
                [
                    "No veo la pantalla de configuración",
                    "Tu usuario no tiene permiso (pide Gerencia o perfil Socio).",
                ],
                [
                    "No veo el chat en el menú",
                    "Falta asignar el menú Chat WhatsApp a tu rol (panel de acceso).",
                ],
            ],
            [5.5 * cm, 11.3 * cm],
        )
    )

    # 9
    story.append(Paragraph("9. Qué no mezclar", s["h1"]))
    story.append(
        Paragraph(
            "Esta guía es solo para el <b>Chat WhatsApp</b> de coordinación/operación. "
            "No uses el webhook ni las claves del Copiloto de ventas: es otro producto y otro número.",
            s["body"],
        )
    )

    story.append(Spacer(1, 0.6 * cm))
    story.append(hr())
    story.append(
        Paragraph(
            "¿Dudas con Meta o con el enlace del webhook? Escríbele al equipo técnico de ProBusiness.",
            s["note"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT)


if __name__ == "__main__":
    build()
