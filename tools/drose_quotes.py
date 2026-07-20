"""Drose quote requests: persistence, customer/staff emails, offer delivery."""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone, translation
from django.utils.translation import gettext

from .auth_brand import drose_email_brand_preview
from .models import DroseQuoteRequest

logger = logging.getLogger(__name__)


def _staff_inbox() -> str:
    raw = (getattr(settings, "DROSE_QUOTE_EMAIL", "") or "").strip()
    if raw:
        return raw
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "contact@gadly.it")
    if "<" in from_email:
        return from_email.split("<")[-1].rstrip(">").strip()
    return from_email


def _from_email() -> str:
    return getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@gadly.local")


def _lang_code(language: str | None) -> str:
    code = (language or "en")[:2]
    return code if code in ("en", "it") else "en"


def _send_html_mail(
    request,
    *,
    to_email: str,
    subject: str,
    plain_message: str,
    html_template: str,
    context: dict[str, Any],
    language: str,
) -> None:
    with translation.override(_lang_code(language)):
        html_message = render_to_string(
            html_template,
            {**context, **drose_email_brand_preview(request)},
            request=request,
        )
    msg = EmailMultiAlternatives(subject, plain_message, _from_email(), [to_email])
    msg.attach_alternative(html_message, "text/html")
    msg.send(fail_silently=False)


def create_quote_from_form(request, form, *, language: str) -> DroseQuoteRequest:
    details = form.cleaned_data
    service_labels = dict(form.fields["service_type"].choices)
    budget_labels = dict(form.fields["budget_range"].choices)
    deliverable_labels = dict(form.fields["deliverables"].choices)
    selected = details.get("deliverables") or []
    with translation.override(_lang_code(language)):
        if selected:
            deliverables_label = ", ".join(deliverable_labels.get(code, code) for code in selected)
        else:
            deliverables_label = gettext("Not specified")
        service_type = details["service_type"]
        budget_range = details["budget_range"]
        service_label = service_labels.get(service_type, service_type)
        budget_label = budget_labels.get(budget_range, budget_range)

    return DroseQuoteRequest.objects.create(
        language=_lang_code(language),
        full_name=details["full_name"],
        email=details["email"],
        phone=details.get("phone") or "",
        company_name=details.get("company_name") or "",
        service_type=service_type,
        service_label=service_label,
        deliverables=list(selected),
        deliverables_label=deliverables_label,
        budget_range=budget_range,
        budget_label=budget_label,
        location=details.get("location") or "",
        preferred_timeline=details.get("preferred_timeline") or "",
        reference_links=details.get("reference_links") or "",
        project_details=details["project_details"],
        offer_scope=details["project_details"],
    )


def notify_staff_new_quote(request, quote: DroseQuoteRequest) -> None:
    manage_url = request.build_absolute_uri(reverse("drose_quote_staff_detail", kwargs={"pk": quote.pk}))
    with translation.override("en"):
        subject = gettext("New Drose quote request — %(reference)s") % {"reference": quote.reference}
        message = (
            f"{gettext('Full name')}: {quote.full_name}\n"
            f"{gettext('Email')}: {quote.email}\n"
            f"{gettext('Phone')}: {quote.phone or '-'}\n"
            f"{gettext('Company name (optional)')}: {quote.company_name or '-'}\n"
            f"{gettext('Service needed')}: {quote.service_label}\n"
            f"{gettext('Requested deliverables')}: {quote.deliverables_label}\n"
            f"{gettext('Estimated budget range')}: {quote.budget_label}\n"
            f"{gettext('Location')}: {quote.location or '-'}\n"
            f"{gettext('Preferred timeline (optional)')}: {quote.preferred_timeline or '-'}\n"
            f"{gettext('Reference links (optional)')}: {quote.reference_links or '-'}\n\n"
            f"{gettext('Project details')}:\n{quote.project_details}\n\n"
            f"Manage quote: {manage_url}\n"
        )
    send_mail(subject, message, _from_email(), [_staff_inbox()], fail_silently=False)


def send_customer_received_confirmation(request, quote: DroseQuoteRequest) -> None:
    with translation.override(_lang_code(quote.language)):
        subject = gettext("We received your quote request — Drose")
        plain = gettext(
            "Hi %(name)s,\n\n"
            "Thank you for your quote request to Drose Drone Services. "
            "We have received your project details and will review them shortly.\n\n"
            "Your reference: %(reference)s\n\n"
            "We will get back to you as soon as possible with scope, timing, and pricing.\n\n"
            "Best regards,\n"
            "Drose Drone Services"
        ) % {"name": quote.full_name, "reference": quote.reference}
        context = {
            "recipient_name": quote.full_name,
            "quote_reference": quote.reference,
        }
    _send_html_mail(
        request,
        to_email=quote.email,
        subject=subject,
        plain_message=plain,
        html_template="tools/emails/drose_quote_request_received.html",
        context=context,
        language=quote.language,
    )


def _offer_email_context(request, quote: DroseQuoteRequest) -> dict[str, Any]:
    token = quote.response_token
    return {
        "recipient_name": quote.full_name,
        "quote_reference": quote.reference,
        "valid_until": quote.valid_until.strftime("%d/%m/%Y") if quote.valid_until else "",
        "location": quote.location or "—",
        "service_label": quote.service_label,
        "project_scope": quote.offer_scope,
        "deliverables": quote.offer_deliverables,
        "price_subtotal": quote.price_subtotal,
        "price_total": quote.price_total,
        "timeline": quote.offer_timeline,
        "notes": quote.offer_notes,
        "response_url": request.build_absolute_uri(reverse("drose_quote_response", kwargs={"token": token})),
        "accept_url": request.build_absolute_uri(
            reverse("drose_quote_response", kwargs={"token": token})
        )
        + "?intent=accept",
        "decline_url": request.build_absolute_uri(
            reverse("drose_quote_response", kwargs={"token": token})
        )
        + "?intent=decline",
    }


def send_quote_offer_to_customer(request, quote: DroseQuoteRequest) -> None:
    with translation.override(_lang_code(quote.language)):
        subject = gettext("Your quote proposal — %(reference)s — Drose") % {"reference": quote.reference}
        plain = gettext(
            "Hi %(name)s,\n\n"
            "Thank you for your request. Please find our quote proposal in this email.\n\n"
            "Reference: %(reference)s\n"
            "Total: %(total)s\n\n"
            "Open the links in the email to accept or decline the proposal.\n\n"
            "Best regards,\n"
            "Drose Drone Services"
        ) % {
            "name": quote.full_name,
            "reference": quote.reference,
            "total": quote.price_total,
        }
        context = _offer_email_context(request, quote)
    _send_html_mail(
        request,
        to_email=quote.email,
        subject=subject,
        plain_message=plain,
        html_template="tools/emails/drose_quote_offer.html",
        context=context,
        language=quote.language,
    )
    quote.status = DroseQuoteRequest.STATUS_OFFER_SENT
    quote.offer_sent_at = timezone.now()
    quote.save(update_fields=["status", "offer_sent_at", "updated_at"])


def notify_staff_quote_response(request, quote: DroseQuoteRequest) -> None:
    status_label = quote.get_status_display()
    with translation.override("en"):
        subject = gettext("Quote %(reference)s — customer response: %(status)s") % {
            "reference": quote.reference,
            "status": status_label,
        }
        manage_url = request.build_absolute_uri(reverse("drose_quote_staff_detail", kwargs={"pk": quote.pk}))
        message = (
            f"{gettext('Full name')}: {quote.full_name}\n"
            f"{gettext('Email')}: {quote.email}\n"
            f"Status: {status_label}\n\n"
            f"Manage quote: {manage_url}\n"
        )
    send_mail(subject, message, _from_email(), [_staff_inbox()], fail_silently=False)


def process_quote_submission(request, form, *, language: str) -> DroseQuoteRequest:
    quote = create_quote_from_form(request, form, language=language)
    notify_staff_new_quote(request, quote)
    send_customer_received_confirmation(request, quote)
    return quote


def unviewed_quote_count() -> int:
    return DroseQuoteRequest.objects.filter(staff_viewed_at__isnull=True).count()


def mark_quote_viewed_by_staff(quote: DroseQuoteRequest) -> None:
    if quote.staff_viewed_at is None:
        quote.staff_viewed_at = timezone.now()
        quote.save(update_fields=["staff_viewed_at", "updated_at"])
