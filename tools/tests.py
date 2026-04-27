import json

from django.test import TestCase
from django.urls import reverse


class CorePagesSmokeTests(TestCase):
    def test_key_pages_return_200(self):
        for name in [
            "home",
            "cron_explainer",
            "help_cron_explainer",
            "site_speed_check",
            "qr_generator",
            "qr_decoder",
            "base64_encoder",
        ]:
            with self.subTest(url_name=name):
                response = self.client.get(reverse(name))
                self.assertEqual(response.status_code, 200)


class SiteSpeedApiTests(TestCase):
    def test_site_speed_api_rejects_empty_url(self):
        response = self.client.post(
            reverse("site_speed_api"),
            data=json.dumps({"url": ""}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertIn("error", payload)


class CronHelpI18nTests(TestCase):
    def test_cron_help_page_in_italian(self):
        response = self.client.get(
            reverse("help_cron_explainer"),
            HTTP_ACCEPT_LANGUAGE="it",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Guida Cron")

    def test_cron_help_page_in_english(self):
        response = self.client.get(
            reverse("help_cron_explainer"),
            HTTP_ACCEPT_LANGUAGE="en",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cron Explainer help")
