# Domande, suggerimenti ed etichette del simulatore colloquio: gettext lato server
# così la lingua segue la richiesta (django.po / .mo), senza dipendere da djangojs.
from django.utils.translation import gettext as _


def _interview_questions_raw():
    questions = [
        _("Tell me about yourself and what draws you to this role."),
        _("What are your strongest skills for this position, with examples?"),
        _("What is a real weakness you are working on, and how?"),
        _("Describe a time you failed. What happened and what did you learn?"),
        _("Describe a challenging project: goal, your role, and outcome."),
        _("How do you prioritize when several deadlines collide?"),
        _("How do you respond to critical feedback you disagree with?"),
        _("Describe a workplace conflict and how you resolved it."),
        _("Why are you looking to move from your current or last role?"),
        _("Why this company or team specifically, beyond a generic interest?"),
        _("Where do you want your career to be in three years?"),
        _("How do you keep your professional skills current?"),
        _("What kind of manager helps you do your best work?"),
        _("How do you deliver quality when time is extremely tight?"),
        _("Tell me about a time you influenced others without formal authority."),
        _("How do you choose what to learn or improve next?"),
        _("What metrics or signals do you use to judge your own work?"),
        _("Describe a time you changed someone's mind with data or argument."),
        _("How do you push back or say no to a stakeholder politely?"),
        _("What would you focus on in your first 30 days here?"),
        _("What would your plan look like for the first 90 days?"),
        _("How do you work when requirements are vague or shifting?"),
        _("Describe a process you improved. Before, after, and impact."),
        _("How do you collaborate with people in different time zones?"),
        _("How would teammates describe your communication style?"),
        _("What do you do when a peer repeatedly misses commitments?"),
        _("Describe a high-pressure situation and how you stayed effective."),
        _("What genuinely motivates you in your work?"),
        _("What working conditions help you perform at your best?"),
        _("How do you balance competing priorities from different stakeholders?"),
        _("Tell me about a serious disagreement with your manager and the outcome."),
        _("How do you confirm that your deliverables meet expectations?"),
        _("What is the hardest professional decision you have made?"),
        _("How do you approach learning a new tool, stack, or domain quickly?"),
        _("Describe a time you missed a deadline. What did you do next?"),
        _("How do you trade off speed versus quality in real projects?"),
        _("What does accountability mean to you in a team setting?"),
        _("How do you document decisions and handoffs for others?"),
        _("Tell me about a time you went clearly above expectations."),
        _("How do you stay engaged when work is repetitive or routine?"),
        _("What would you like to ask us about the role or team?"),
        _("How do you manage context switching between tasks or projects?"),
        _("Describe making a complex topic simple for a non-expert audience."),
        _("How do you keep stakeholders informed without overwhelming them?"),
        _("How do you use performance reviews or feedback cycles to grow?"),
        _("How do you give constructive feedback to a peer?"),
        _("Describe mentoring or onboarding someone newer than you."),
        _("How do you react when priorities change mid-project?"),
        _("What risks do you see in this role and how would you reduce them?"),
        _("Why should we choose you over other qualified candidates?"),
    ]
    tips = [
        _("Give a short arc: background, relevant wins, and motivation for this role."),
        _("Name 2-3 skills with a one-line proof for each (project, outcome)."),
        _("Pick one weakness, show awareness, and a concrete improvement habit."),
        _("Use STAR; end with a lesson you still apply today."),
        _("Clarify scope, constraints, your actions, and measurable results."),
        _("Explain your method (e.g. impact/effort, dependencies) and one example."),
        _("Show you listen first; separate facts from interpretation; propose a next step."),
        _("Focus on interests, not personalities; outcome and what you'd do differently."),
        _("Stay factual and forward-looking; avoid blaming people by name."),
        _("Cite something specific: product, mission, team, or recent news."),
        _("Tie ambition to growth inside realistic paths; show you've thought it through."),
        _("Mention courses, communities, side projects, or regular reading habits."),
        _("Describe support you need and how you communicate upward."),
        _("Explain triage, trade-offs, and checks you use under pressure."),
        _("Highlight influence: allies, data, and the result you achieved."),
        _("Connect learning goals to role needs and how you'll measure progress."),
        _("Give examples: dashboards, user impact, quality, or delivery cadence."),
        _("Outline context, your reasoning, resistance, and the decision reached."),
        _("Give a polite script: alternatives, risks, and a recommended path."),
        _("List listening, quick wins, and one measurable early deliverable."),
        _("Split: learn, align stakeholders, ship small value, then scale."),
        _("Describe clarifying questions, assumptions, and how you validate."),
        _("Quantify waste, time saved, or errors reduced if you can."),
        _("Mention async rituals, documentation, and overlap windows."),
        _("Be honest: direct vs diplomatic; when you adapt your style."),
        _("Balance empathy, clarity, and escalation when needed."),
        _("Show calm habits: scope control, communication, and recovery."),
        _("Separate intrinsic drivers from perks; link to how you work."),
        _("Mention focus, autonomy, collaboration - whatever is true for you."),
        _("Show negotiation: stakeholders, criteria, and communication rhythm."),
        _("Stay respectful; focus on facts, expectations, and resolution."),
        _("Describe reviews, demos, tests, or user validation you rely on."),
        _("Explain trade-offs, who was affected, and what you'd do again."),
        _("Outline steps: goals, practice, feedback, and first real use."),
        _("Own the miss; explain communication, recovery, and prevention."),
        _("Give a real example where you chose one side and why."),
        _("Link to commitments, transparency, and follow-through."),
        _("Name format, where it lives, and who consumes it."),
        _("Use a concrete story: situation, extra effort, and recognition or impact."),
        _("Show how you gamify, automate, or batch dull work."),
        _("Ask about success, team, challenges - show genuine curiosity."),
        _("Name your techniques: batching, notes, or protecting deep work."),
        _("Explain analogy, structure, and how you checked understanding."),
        _("Balance cadence, channel, and audience-appropriate detail."),
        _("Show you set goals, act on input, and follow up."),
        _("Use situation-behavior-impact; focus on observable behavior."),
        _("Describe goals, check-ins, and how you measured their progress."),
        _("Explain re-planning, communication, and scope negotiation."),
        _("Be specific to role; show mitigation, not fear."),
        _("Summarize differentiators: impact, fit, and enthusiasm without arrogance."),
    ]
    if len(questions) != len(tips):
        raise ValueError("interview banks length mismatch")
    return questions, tips


def get_interview_simulator_payload():
    """JSON-serializzabile: domande, suggerimenti ed etichette già tradotte."""
    questions, tips = _interview_questions_raw()
    labels = {
        "maleRecruiter": _("Male recruiter"),
        "femaleRecruiter": _("Female recruiter"),
        "you": _("You"),
        "suggestedImprovement": _("Suggested improvement"),
        "role": _("Role"),
        "level": _("Level"),
        "focusAreas": _("Focus areas"),
        "lastQuestionThanks": _("That was the last question. Thanks for practicing!"),
        "pleaseWriteAnswer": _("Please write an answer before sending."),
        "pushback1": _(
            "That doesn't really address what I asked. Can you answer more directly?"
        ),
        "pushback2": _(
            "I'm not sure that connects to my question. Could you focus on what I asked?"
        ),
        "pushback3": _(
            "This doesn't seem aligned with my question. Please try again with a clearer answer."
        ),
        "voiceUnsupported": _("Voice input is not supported in this browser."),
        "listeningHint": _("Listening… speak now"),
        "micDenied": _(
            "Microphone access denied. Allow the microphone in the browser bar."
        ),
        "noSpeech": _("No speech detected. Try again."),
        "micGenericError": _("Could not use the microphone. Check permissions."),
        "voiceUnavailable": _("Voice input is not available."),
        "couldNotStartListening": _(
            "Could not start listening. Try again in a moment."
        ),
        "copied": _("Copied!"),
        "loadError": _(
            "Could not load interview questions. Please reload the page."
        ),
        "backToChoice": _("Back to setup"),
        "voiceAndOptions": _("Voice & options"),
        "hideOptions": _("Hide options"),
        "newInterview": _("New interview"),
        "copyConversation": _("Copy conversation"),
        "chatActionsMenu": _("Actions"),
    }
    return {"questions": questions, "tips": tips, "labels": labels}


def get_interview_banks():
    """Compat: solo domande e suggerimenti."""
    p = get_interview_simulator_payload()
    return {"questions": p["questions"], "tips": p["tips"]}
