"""Export static Drose email preview HTML files from Django templates."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.template import Context, Engine
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from django.utils.translation import gettext as _, override

from tools.auth_brand import (
    DROSE_BRAND_TAGLINE,
    DROSE_EMAIL_LOGO_ASSET,
    DROSE_EMAIL_LOGO_DARK_ASSET,
    DROSE_EMAIL_LOGO_SIZE,
    DROSE_LOGO_ASSET_VERSION,
)


LOGO_OFFLINE = f"tools/static/{DROSE_EMAIL_LOGO_ASSET}?v={DROSE_LOGO_ASSET_VERSION}"
LOGO_DARK_OFFLINE = f"tools/static/{DROSE_EMAIL_LOGO_DARK_ASSET}?v={DROSE_LOGO_ASSET_VERSION}"
LOGO_SVG_OFFLINE = f"tools/static/tools/images/drose-logo.svg?v={DROSE_LOGO_ASSET_VERSION}"
LOGO_DARK_SVG_OFFLINE = f"tools/static/tools/images/drose-logo-dark.svg?v={DROSE_LOGO_ASSET_VERSION}"


def _brand() -> dict:
    return {
        "is_drose_brand": True,
        "brand_logo_url": LOGO_OFFLINE,
        "brand_logo_dark_url": LOGO_DARK_OFFLINE,
        "brand_name": "Drose",
        "brand_tagline": DROSE_BRAND_TAGLINE,
        "brand_color": "#b45309",
        "button_bg": "#b45309",
        "brand_logo_size": DROSE_EMAIL_LOGO_SIZE,
        "brand_header_gap": 10,
        "brand_tagline_spacing": "0",
        "brand_tagline_font_size": 15,
    }
PREVIEW_STYLES = """
    .preview-banner {
      max-width: 664px;
      margin: 0 auto 20px;
      padding: 12px 16px;
      background: #fff9f5;
      border: 1px solid #fbbf24;
      border-radius: 10px;
      font: 14px/1.5 Arial, sans-serif;
      color: #78350f;
    }
    .preview-banner code { font-size: 13px; }
    .preview-section-title {
      max-width: 664px;
      margin: 32px auto 12px;
      font: bold 16px/1.3 Arial, sans-serif;
      color: #b45309;
    }
    a.transactional-email-btn,
    a.drose-quote-offer-btn--accept,
    a.drose-quote-offer-btn--decline {
      transition: transform 0.18s ease, background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
    }
    @media (hover: hover) and (pointer: fine) {
      a.transactional-email-btn:hover,
      a.drose-quote-offer-btn--accept:hover {
        transform: scale(1.04);
      }
      a.drose-quote-offer-btn--decline:hover {
        transform: scale(1.04);
        background-color: #dc3545 !important;
        color: #ffffff !important;
        border-color: #dc3545 !important;
      }
    }
"""


def _request():
    factory = RequestFactory()
    request = factory.get("/drose/email-preview/", HTTP_HOST="localhost")
    request.user = AnonymousUser()
    return request


def _offline_html(html: str) -> str:
    html = re.sub(
        r'https?://[^"\']+/static/tools/images/drose-logo-email\.png\?v=\d+',
        LOGO_OFFLINE,
        html,
    )
    html = re.sub(
        r'https?://[^"\']+/static/tools/images/drose-logo-email-dark\.png\?v=\d+',
        LOGO_DARK_OFFLINE,
        html,
    )
    return html


def _extract_body(html: str) -> str:
    match = re.search(r"<body[^>]*>(.*)</body>", html, flags=re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else html


def _wrap_page(filename: str, page_title: str, sections: list[tuple[str, str]]) -> str:
    parts = [
        "<!doctype html>",
        '<html lang="it">',
        "<head>",
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width,initial-scale=1">',
        f"  <title>{page_title}</title>",
        f"  <style>{PREVIEW_STYLES}</style>",
        "</head>",
        '<body style="margin:0;padding:24px 12px 48px;background:#e2e8f0;font-family:Arial,sans-serif;color:#0f172a;">',
        '  <p class="preview-banner">',
        f"    <strong>Tools_Site / {filename}</strong> — doppio clic per aprire nel browser.",
        '    <a href="email-preview-drose-index.html" style="color:#b45309;">← Indice anteprime Drose</a><br>',
        f"    Logo light: <code>{LOGO_OFFLINE}</code> · dark: <code>{LOGO_DARK_OFFLINE}</code> (68×68 px, PNG 512 px). SVG: <code>{LOGO_SVG_OFFLINE}</code>, <code>{LOGO_DARK_SVG_OFFLINE}</code>",
        "  </p>",
    ]
    for index, (title, body_html) in enumerate(sections, start=1):
        parts.append(f'  <h2 class="preview-section-title">{index}) {title}</h2>')
        parts.append(f"  {_extract_body(body_html)}")
    parts.extend(["</body>", "</html>"])
    return "\n".join(parts) + "\n"


def _render_template(template_name: str, context: dict, request=None) -> str:
    from django.template.loader import render_to_string

    return render_to_string(template_name, context, request=request)


def _render_password_reset(request, lang: str) -> str:
    user = SimpleNamespace(get_username=lambda: "mario")
    template_path = ROOT / "tools/templates/registration/password_reset_email_html.html"
    template_source = template_path.read_text(encoding="utf-8")
    template_source = template_source.replace(
        "{% url 'password_reset_confirm_short' uidb64=uid token=token %}",
        "/rp/{{ uid }}/{{ token }}/",
    )
    engine = Engine(
        dirs=[str(ROOT / "tools/templates")],
        libraries={"i18n": "django.templatetags.i18n"},
        app_dirs=False,
    )
    template = engine.from_string(template_source)
    with override(lang):
        return template.render(
            Context(
                {
                    "user": user,
                    "protocol": "https",
                    "domain": "example.com",
                    "uid": "preview",
                    "token": "preview-token",
                    "site_name": "Gadly",
                    **_brand(),
                },
                autoescape=True,
            )
        )


def _render_verify(request, lang: str, email_change: bool = False) -> str:
    with override(lang):
        return _render_template(
            "tools/emails/verify_email.html",
            {
                "username": "mario",
                "verify_url": "https://example.com/v/abc123def456",
                "email_change": email_change,
                **_brand(),
            },
            request=request,
        )


def _render_quote_offer(request, lang: str) -> str:
    with override(lang):
        return _render_template(
            "tools/emails/drose_quote_offer.html",
            {
                "recipient_name": "Mario Rossi",
                "quote_reference": "DS-2026-0041",
                "valid_until": "31/07/2026",
                "location": "Milano",
                "service_label": _("Inspection"),
                "project_scope": _("Facade and roof visual inspection with 4K coverage."),
                "deliverables": [
                    _("12 edited aerial photos"),
                    _("1 short recap video (45-60 seconds)"),
                    _("Inspection summary PDF"),
                ],
                "price_subtotal": "680 EUR",
                "price_total": "680 EUR",
                "timeline": _("Delivery in 3 business days after flight."),
                "notes": _("Flight date subject to weather and local airspace clearance."),
                "accept_url": "https://example.com/drose/quote-response/preview-token/?intent=accept",
                "decline_url": "https://example.com/drose/quote-response/preview-token/?intent=decline",
                **_brand(),
            },
            request=request,
        )


def _render_quote_received(request, lang: str) -> str:
    with override(lang):
        return _render_template(
            "tools/emails/drose_quote_request_received.html",
            {
                "recipient_name": "Mario Rossi",
                "quote_reference": "DS-2026-0041",
                **_brand(),
            },
            request=request,
        )


def _write(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")
    print(f"Wrote {path}")


def main() -> None:
    request = _request()

    verify_sections = [
        ("Nuova registrazione da Drose — English", _offline_html(_render_verify(request, "en"))),
        ("Nuova registrazione da Drose — Italiano", _offline_html(_render_verify(request, "it"))),
        ("Cambio email account — English", _offline_html(_render_verify(request, "en", email_change=True))),
        ("Cambio email account — Italiano", _offline_html(_render_verify(request, "it", email_change=True))),
    ]
    _write(
        ROOT / "email-preview-drose-verify-email.html",
        _wrap_page("email-preview-drose-verify-email.html", "Anteprima email verifica Drose", verify_sections),
    )

    reset_sections = [
        ("Reset password — English", _offline_html(_render_password_reset(request, "en"))),
        ("Reset password — Italiano", _offline_html(_render_password_reset(request, "it"))),
    ]
    _write(
        ROOT / "email-preview-drose-password-reset.html",
        _wrap_page("email-preview-drose-password-reset.html", "Anteprima email reset password Drose", reset_sections),
    )

    offer_sections = [
        ("Proposta preventivo — English", _offline_html(_render_quote_offer(request, "en"))),
        ("Proposta preventivo — Italiano", _offline_html(_render_quote_offer(request, "it"))),
    ]
    _write(
        ROOT / "email-preview-drose-quote-offer.html",
        _wrap_page("email-preview-drose-quote-offer.html", "Anteprima email preventivo Drose", offer_sections),
    )

    received_sections = [
        ("Richiesta preventivo ricevuta — English", _offline_html(_render_quote_received(request, "en"))),
        ("Richiesta preventivo ricevuta — Italiano", _offline_html(_render_quote_received(request, "it"))),
    ]
    _write(
        ROOT / "email-preview-drose-quote-received.html",
        _wrap_page(
            "email-preview-drose-quote-received.html",
            "Anteprima email richiesta preventivo Drose",
            received_sections,
        ),
    )

    index_html = f"""<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Anteprime email Drose — Tools_Site</title>
  <style>
    body {{ margin: 0; padding: 32px 20px 48px; font-family: Arial, sans-serif; background: #e2e8f0; color: #0f172a; }}
    .wrap {{ max-width: 640px; margin: 0 auto; }}
    h1 {{ margin: 0 0 8px; font-size: 1.6rem; color: #b45309; }}
    .lead {{ margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 15px; }}
    .note {{ margin: 0 0 28px; padding: 14px 16px; background: #fff9f5; border: 1px solid #fbbf24; border-radius: 10px; font-size: 14px; line-height: 1.55; color: #78350f; }}
    .note code {{ font-size: 13px; }}
    section {{ margin-bottom: 28px; }}
    section h2 {{ margin: 0 0 12px; font-size: 1.05rem; color: #003f7f; }}
    ul {{ margin: 0; padding: 0; list-style: none; }}
    li {{ margin: 0 0 10px; }}
    a.file-link {{
      display: block;
      padding: 14px 18px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #003f7f;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
    }}
    a.file-link:hover {{ border-color: #b45309; color: #b45309; }}
    a.file-link span {{ display: block; margin-top: 4px; font-weight: 400; font-size: 13px; color: #64748b; }}
    a.live-link {{ display: inline-block; margin-top: 8px; font-size: 13px; color: #b45309; }}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Anteprime email Drose</h1>
    <p class="lead">File HTML nella cartella <strong>Tools_Site</strong>. Doppio clic su un link (o sul file) per aprire l’anteprima nel browser.</p>
    <p class="note">
      <strong>Cartella:</strong> <code>Tools_Site</code><br>
      Logo light: <code>{LOGO_OFFLINE}</code> · dark: <code>{LOGO_DARK_OFFLINE}</code> (68×68 px, PNG 512 px). SVG: <code>{LOGO_SVG_OFFLINE}</code>, <code>{LOGO_DARK_SVG_OFFLINE}</code>. Rigenera con <code>python scripts/export_drose_email_previews.py</code>.<br>
      Con il server in esecuzione (<code>DEBUG=True</code>) usa anche <code>/drose/email-preview/</code> (template live).
    </p>

    <section>
      <h2>Richiesta preventivo ricevuta</h2>
      <ul>
        <li>
          <a class="file-link" href="email-preview-drose-quote-received.html">
            email-preview-drose-quote-received.html
            <span>Conferma ricezione richiesta EN/IT</span>
          </a>
        </li>
      </ul>
    </section>

    <section>
      <h2>Proposta preventivo</h2>
      <ul>
        <li>
          <a class="file-link" href="email-preview-drose-quote-offer.html">
            email-preview-drose-quote-offer.html
            <span>Proposta preventivo EN/IT · Accetta / Rifiuta</span>
          </a>
        </li>
      </ul>
    </section>

    <section>
      <h2>Verifica email e conferma indirizzo</h2>
      <ul>
        <li>
          <a class="file-link" href="email-preview-drose-verify-email.html">
            email-preview-drose-verify-email.html
            <span>Registrazione EN/IT · Cambio email EN/IT</span>
          </a>
        </li>
      </ul>
    </section>

    <section>
      <h2>Reset password</h2>
      <ul>
        <li>
          <a class="file-link" href="email-preview-drose-password-reset.html">
            email-preview-drose-password-reset.html
            <span>Reset password EN/IT</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</body>
</html>
"""
    _write(ROOT / "email-preview-drose-index.html", index_html)


if __name__ == "__main__":
    main()
