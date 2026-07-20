from django.db import migrations


def dr_to_ds_references(apps, schema_editor):
    DroseQuoteRequest = apps.get_model("tools", "DroseQuoteRequest")
    for quote in DroseQuoteRequest.objects.filter(reference__startswith="DR-"):
        quote.reference = "DS-" + quote.reference[3:]
        quote.save(update_fields=["reference"])


def ds_to_dr_references(apps, schema_editor):
    DroseQuoteRequest = apps.get_model("tools", "DroseQuoteRequest")
    for quote in DroseQuoteRequest.objects.filter(reference__startswith="DS-"):
        quote.reference = "DR-" + quote.reference[3:]
        quote.save(update_fields=["reference"])


class Migration(migrations.Migration):

    dependencies = [
        ("tools", "0007_drosequoterequest_deleted_at"),
    ]

    operations = [
        migrations.RunPython(dr_to_ds_references, ds_to_dr_references),
    ]
