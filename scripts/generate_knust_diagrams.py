from __future__ import annotations

import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "DOCUMENTATION" / "assets" / "knust_diagrams"

GREEN = "#006B3F"
GOLD = "#D9A900"
NAVY = "#17324D"
TEAL = "#167D78"
RED = "#B9473F"
INK = "#1E293B"
MUTED = "#64748B"
LINE = "#B8C4C0"
PAPER = "#FFFFFF"
SOFT_GREEN = "#EAF5EF"
SOFT_GOLD = "#FFF7D6"
SOFT_BLUE = "#EDF4FA"
SOFT_RED = "#FBEDEC"
SOFT_GRAY = "#F4F6F5"

FONT_REGULAR = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def wrapped(text: str, width: int) -> str:
    lines: list[str] = []
    for source_line in text.splitlines() or [""]:
        lines.extend(wrap(source_line, width=width, break_long_words=False) or [""])
    return "\n".join(lines)


def box(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    title: str,
    detail: str = "",
    *,
    fill: str = PAPER,
    outline: str = LINE,
    title_color: str = INK,
    radius: int = 24,
    title_size: int = 36,
    detail_size: int = 27,
    title_wrap: int = 24,
    detail_wrap: int = 34,
) -> None:
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=4)
    title_text = wrapped(title, title_wrap)
    title_font = font(title_size, True)
    detail_font = font(detail_size)
    title_bbox = draw.multiline_textbbox((0, 0), title_text, font=title_font, spacing=6, align="center")
    detail_text = wrapped(detail, detail_wrap) if detail else ""
    detail_bbox = draw.multiline_textbbox((0, 0), detail_text, font=detail_font, spacing=6, align="center")
    total_h = (title_bbox[3] - title_bbox[1]) + (18 if detail_text else 0) + (detail_bbox[3] - detail_bbox[1])
    y = y1 + ((y2 - y1) - total_h) // 2
    draw.multiline_text(
        ((x1 + x2) // 2, y),
        title_text,
        font=title_font,
        fill=title_color,
        anchor="ma",
        align="center",
        spacing=6,
    )
    if detail_text:
        y += (title_bbox[3] - title_bbox[1]) + 18
        draw.multiline_text(
            ((x1 + x2) // 2, y),
            detail_text,
            font=detail_font,
            fill=MUTED,
            anchor="ma",
            align="center",
            spacing=6,
        )


def arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    *,
    color: str = NAVY,
    width: int = 7,
    label: str | None = None,
    label_offset: tuple[int, int] = (0, -24),
) -> None:
    draw.line([start, end], fill=color, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    size = 22
    points = [
        end,
        (
            int(end[0] - size * math.cos(angle - math.pi / 6)),
            int(end[1] - size * math.sin(angle - math.pi / 6)),
        ),
        (
            int(end[0] - size * math.cos(angle + math.pi / 6)),
            int(end[1] - size * math.sin(angle + math.pi / 6)),
        ),
    ]
    draw.polygon(points, fill=color)
    if label:
        mx = (start[0] + end[0]) // 2 + label_offset[0]
        my = (start[1] + end[1]) // 2 + label_offset[1]
        bbox = draw.textbbox((0, 0), label, font=font(24, True))
        pad = 8
        draw.rounded_rectangle(
            (mx - (bbox[2] - bbox[0]) // 2 - pad, my - 18 - pad, mx + (bbox[2] - bbox[0]) // 2 + pad, my + 12 + pad),
            radius=10,
            fill=PAPER,
        )
        draw.text((mx, my), label, font=font(24, True), fill=color, anchor="mm")


def heading(draw: ImageDraw.ImageDraw, title: str, subtitle: str = "") -> None:
    draw.text((90, 66), title, font=font(48, True), fill=NAVY)
    draw.rectangle((90, 132, 260, 142), fill=GOLD)
    if subtitle:
        draw.text((90, 164), subtitle, font=font(27), fill=MUTED)


def save(image: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / name, format="PNG", optimize=True, dpi=(180, 180))


def conceptual_framework() -> None:
    image = Image.new("RGB", (1800, 980), PAPER)
    draw = ImageDraw.Draw(image)
    heading(draw, "SmartPark conceptual framework", "Low-infrastructure signals are converted into verifiable parking outcomes")

    box(draw, (90, 280, 430, 480), "Inputs", "Phone camera\nZone QR signs\nBooking and payment data\nWarden observations", fill=SOFT_BLUE, outline=NAVY, detail_size=21, detail_wrap=20)
    box(draw, (570, 235, 1230, 535), "SmartPark platform", "Zone identification  |  Booking and payment\nTicket verification  |  Session timer and extension\nAvailability confidence  |  Violation prioritisation", fill=SOFT_GREEN, outline=GREEN, title_color=GREEN, title_size=42)
    box(draw, (1370, 280, 1710, 480), "Outputs", "Valid sessions\nPayment audit trail\nFaster checks\nActionable alerts", fill=SOFT_GOLD, outline=GOLD, detail_size=21, detail_wrap=20)
    arrow(draw, (430, 380), (570, 380), color=NAVY, label="collect")
    arrow(draw, (1230, 380), (1370, 380), color=GREEN, label="produce")

    box(draw, (360, 680, 720, 850), "Driver feedback", "Scan, pay, view time, extend", fill=SOFT_GRAY, outline=TEAL)
    box(draw, (1080, 680, 1440, 850), "Warden feedback", "Validate, observe, confirm or dismiss", fill=SOFT_RED, outline=RED)
    arrow(draw, (540, 680), (710, 535), color=TEAL, label="usage", label_offset=(-15, -8))
    arrow(draw, (1260, 680), (1090, 535), color=RED, label="verification", label_offset=(30, -8))
    save(image, "figure_2_1_conceptual_framework.png")


def architecture() -> None:
    image = Image.new("RGB", (1800, 1120), PAPER)
    draw = ImageDraw.Draw(image)
    heading(draw, "SmartPark system architecture", "A single responsive platform serves drivers, wardens and administrators")

    layer_x1, layer_x2 = 120, 1460
    rows = [
        (230, 365, "Client layer", "Driver PWA  |  Warden PWA  |  Admin browser", SOFT_BLUE, NAVY),
        (410, 545, "Interface and API layer", "Next.js pages  |  Protected API routes  |  Role-based navigation", SOFT_GRAY, NAVY),
        (590, 725, "Domain service layer", "Booking  |  Pricing  |  Wallet  |  QR validation  |  Violations", SOFT_GREEN, GREEN),
        (770, 905, "Data and provider layer", "Demo store / Supabase-ready schema  |  Payment adapter  |  Plate adapter", SOFT_GOLD, GOLD),
    ]
    for y1, y2, title, detail, fill, outline in rows:
        box(draw, (layer_x1, y1, layer_x2, y2), title, detail, fill=fill, outline=outline, title_color=outline, title_size=38, detail_size=30, title_wrap=40, detail_wrap=70)
    for y in (365, 545, 725):
        arrow(draw, (790, y + 5), (790, y + 40), color=GREEN, width=6)

    box(draw, (1510, 230, 1720, 905), "Cross-cutting controls", "Authentication\nAuthorisation\nValidation\nAudit trail\nHMAC QR\nsigning\nHuman\nconfirmation\nPrivacy limits", fill=SOFT_RED, outline=RED, title_color=RED, title_size=28, detail_size=24, title_wrap=18, detail_wrap=18)
    draw.text((120, 990), "Deployment path", font=font(27, True), fill=NAVY)
    draw.text((345, 990), "In-memory academic MVP  ->  Supabase + supplied payment provider for production", font=font(27), fill=INK)
    save(image, "figure_3_1_system_architecture.png")


def use_case() -> None:
    image = Image.new("RGB", (1800, 1120), PAPER)
    draw = ImageDraw.Draw(image)
    heading(draw, "SmartPark use-case model", "Phone-first tasks are grouped around the shared parking-session lifecycle")

    box(draw, (80, 300, 360, 550), "Driver", "Register vehicle\nScan or find zone\nBook and pay\nView or extend time", fill=SOFT_BLUE, outline=NAVY, detail_size=22, detail_wrap=20)
    box(draw, (1440, 300, 1720, 550), "Warden", "Scans ticket\nChecks plate\nMonitors spaces\nResolves violations", fill=SOFT_RED, outline=RED, detail_size=23, detail_wrap=18)
    box(draw, (760, 850, 1040, 1040), "Administrator", "Views setup\nPrints signed zone QR signs", fill=SOFT_GOLD, outline=GOLD, title_size=30, detail_size=23, detail_wrap=14)

    cases = [
        (520, 250, 850, 390, "Identify zone", "Signed QR, visible code or map"),
        (950, 250, 1280, 390, "Reserve and pay", "Server-calculated price and wallet"),
        (520, 470, 850, 610, "Issue and validate", "Ticket QR for entry, verify and exit"),
        (950, 470, 1280, 610, "Manage session", "Timer, extension and reminders"),
        (735, 690, 1065, 820, "Enforce safely", "Plate review and ranked violations"),
    ]
    for x1, y1, x2, y2, title, detail in cases:
        box(draw, (x1, y1, x2, y2), title, detail, fill=SOFT_GREEN, outline=GREEN, title_color=GREEN, title_size=31, detail_size=23, title_wrap=20, detail_wrap=26)

    arrow(draw, (360, 390), (520, 320), color=NAVY)
    arrow(draw, (360, 420), (520, 540), color=NAVY)
    arrow(draw, (1440, 390), (1280, 320), color=RED)
    arrow(draw, (1440, 420), (1280, 540), color=RED)
    arrow(draw, (900, 860), (900, 820), color=GOLD)
    arrow(draw, (850, 540), (950, 540), color=GREEN)
    arrow(draw, (1065, 690), (1110, 610), color=GREEN)
    arrow(draw, (735, 690), (690, 610), color=GREEN)
    save(image, "figure_3_2_use_case_model.png")


def data_model() -> None:
    image = Image.new("RGB", (1800, 1050), PAPER)
    draw = ImageDraw.Draw(image)
    heading(draw, "Core data model", "The booking record links payment, space, ticket, verification and enforcement evidence")

    entities = {
        "Driver": (90, 260, 380, 400, "profile_id\nrole\nwallet_balance", SOFT_BLUE, NAVY),
        "Vehicle": (90, 590, 380, 730, "vehicle_id\nplate_number\ndriver_id", SOFT_BLUE, NAVY),
        "Booking": (690, 395, 1110, 625, "booking_id\ndriver_id / vehicle_id\nzone_id / spot_id\nstart_at / end_at\nstatus / amount", SOFT_GREEN, GREEN),
        "Zone and spot": (690, 720, 1110, 900, "zone_id / visible_code\nrate / coordinates\nspot_id / status", SOFT_GOLD, GOLD),
        "Payment": (1370, 215, 1710, 365, "payment_id\nbooking_id\nstatus / amount", SOFT_GOLD, GOLD),
        "QR ticket": (1370, 435, 1710, 585, "ticket_id\nbooking_id\ntoken_hash / status", SOFT_BLUE, NAVY),
        "Verification": (1370, 655, 1710, 805, "event_id\nbooking_id\nmode / actor / time", SOFT_GRAY, TEAL),
        "Violation": (1370, 850, 1710, 1000, "violation_id\nbooking_id\npriority / decision", SOFT_RED, RED),
    }
    for title, (x1, y1, x2, y2, detail, fill, outline) in entities.items():
        box(draw, (x1, y1, x2, y2), title, detail, fill=fill, outline=outline, title_color=outline, title_size=31, detail_size=24, title_wrap=24, detail_wrap=28)

    arrow(draw, (380, 330), (690, 460), color=NAVY, label="creates", label_offset=(0, -18))
    arrow(draw, (380, 660), (690, 560), color=NAVY, label="used for", label_offset=(0, 20))
    arrow(draw, (900, 625), (900, 720), color=GOLD, label="allocates")
    arrow(draw, (1110, 455), (1370, 290), color=GOLD, label="paid by")
    arrow(draw, (1110, 500), (1370, 510), color=NAVY, label="issues")
    arrow(draw, (1110, 555), (1370, 730), color=TEAL, label="checked by")
    arrow(draw, (1110, 600), (1370, 920), color=RED, label="may create", label_offset=(15, 16))
    save(image, "figure_3_3_core_data_model.png")


def workflow_sequence() -> None:
    image = Image.new("RGB", (1800, 1120), PAPER)
    draw = ImageDraw.Draw(image)
    heading(draw, "End-to-end parking workflow", "The server controls payment validity, timing and enforcement state")

    lane_centres = [300, 900, 1500]
    lane_names = [("Driver phone", NAVY, SOFT_BLUE), ("SmartPark server", GREEN, SOFT_GREEN), ("Warden phone", RED, SOFT_RED)]
    for x, (name, color, fill) in zip(lane_centres, lane_names):
        box(draw, (x - 190, 210, x + 190, 330), name, "", fill=fill, outline=color, title_color=color, title_size=34)
        draw.line((x, 330, x, 1040), fill=LINE, width=4)

    steps = [
        (390, 300, 900, "1  Scan zone or choose map"),
        (470, 900, 300, "2  Return zone, price and confidence"),
        (550, 300, 900, "3  Submit vehicle, space and duration"),
        (630, 900, 300, "4  Debit wallet, reserve and issue ticket"),
        (710, 1500, 900, "5  Scan ticket at entry"),
        (790, 900, 1500, "6  Validate and activate timer"),
        (870, 300, 900, "7  View or pay to extend session"),
        (950, 900, 1500, "8  Exit validation or ranked violation"),
    ]
    for y, start_x, end_x, label in steps:
        color = NAVY if start_x == 300 else RED if start_x == 1500 else GREEN
        arrow(draw, (start_x, y), (end_x, y), color=color, width=6)
        draw.rounded_rectangle((590, y - 28, 1210, y + 28), radius=14, fill=PAPER, outline=LINE, width=2)
        draw.text((900, y), label, font=font(25, True), fill=INK, anchor="mm")
    save(image, "figure_4_1_end_to_end_workflow.png")


def booking_lifecycle() -> None:
    image = Image.new("RGB", (1800, 900), PAPER)
    draw = ImageDraw.Draw(image)
    heading(draw, "Booking and enforcement lifecycle", "Only controlled server-side transitions can change a parking session")

    states = [
        (80, 350, 330, 500, "Pending payment", SOFT_GRAY, NAVY),
        (420, 350, 670, 500, "Reserved", SOFT_BLUE, NAVY),
        (760, 350, 1010, 500, "Active", SOFT_GREEN, GREEN),
        (1100, 240, 1350, 390, "Completed", SOFT_GOLD, GOLD),
        (1100, 520, 1350, 670, "Expired", SOFT_RED, RED),
        (1450, 520, 1720, 670, "Violation open", SOFT_RED, RED),
    ]
    for x1, y1, x2, y2, title, fill, outline in states:
        box(draw, (x1, y1, x2, y2), title, "", fill=fill, outline=outline, title_color=outline, title_size=31, title_wrap=12)
    arrow(draw, (330, 425), (420, 425), color=NAVY, label="payment confirmed")
    arrow(draw, (670, 425), (760, 425), color=GREEN, label="entry scan")
    arrow(draw, (1010, 390), (1100, 315), color=GOLD, label="exit scan", label_offset=(15, -4))
    arrow(draw, (1010, 500), (1100, 595), color=RED, label="time elapsed", label_offset=(15, 6))
    arrow(draw, (1350, 595), (1450, 595), color=RED, label="create once")
    arrow(draw, (1225, 520), (1225, 390), color=GOLD, label="validated exit", label_offset=(100, 0))
    draw.rounded_rectangle((650, 680, 1150, 800), radius=18, fill=SOFT_GREEN, outline=GREEN, width=3)
    draw.text((900, 718), "Active-session extension", font=font(30, True), fill=GREEN, anchor="mm")
    draw.text((900, 762), "wallet debit + new end time + audit event", font=font(24), fill=MUTED, anchor="mm")
    arrow(draw, (900, 680), (900, 500), color=GREEN, label="returns to Active", label_offset=(115, 0))
    save(image, "figure_4_2_booking_lifecycle.png")


def main() -> None:
    conceptual_framework()
    architecture()
    use_case()
    data_model()
    workflow_sequence()
    booking_lifecycle()
    print(OUT)


if __name__ == "__main__":
    main()
