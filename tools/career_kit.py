"""Application kit step order and navigation helpers."""

CAREER_KIT_STEPS = (
    {
        "id": "cv_generator",
        "url_name": "cv_generator",
        "next_label_en": "Optimize",
        "next_label_it": "Ottimizza",
    },
    {
        "id": "cv_optimizer",
        "url_name": "cv_optimizer",
        "next_label_en": "Cover letter",
        "next_label_it": "Lettera",
    },
    {
        "id": "cover_letter_generator",
        "url_name": "cover_letter_generator",
        "next_label_en": "Email",
        "next_label_it": "Email",
    },
    {
        "id": "application_email_generator",
        "url_name": "application_email_generator",
        "next_label_en": "Interview",
        "next_label_it": "Colloquio",
    },
    {
        "id": "interview_simulator",
        "url_name": "interview_simulator",
        "next_label_en": "",
        "next_label_it": "",
    },
)

CAREER_KIT_STEP_BY_ID = {step["id"]: step for step in CAREER_KIT_STEPS}
CAREER_KIT_TOTAL = len(CAREER_KIT_STEPS)


def get_career_kit_flow_context(step_id, lang_code="en"):
    """Build template context for kit flow navigation on a career tool page."""
    lang = (lang_code or "en")[:2].lower()
    label_key = "next_label_it" if lang == "it" else "next_label_en"

    step_index = None
    current = None
    for index, step in enumerate(CAREER_KIT_STEPS):
        if step["id"] == step_id:
            step_index = index
            current = step
            break

    if current is None or step_index is None:
        return None

    next_step = None
    next_label = ""
    if step_index + 1 < CAREER_KIT_TOTAL:
        next_step = CAREER_KIT_STEPS[step_index + 1]
        next_label = current[label_key]

    return {
        "step_id": step_id,
        "step_number": step_index + 1,
        "total_steps": CAREER_KIT_TOTAL,
        "next_step": next_step,
        "next_label": next_label,
        "is_last": next_step is None,
        "lang_prefix": lang,
    }
