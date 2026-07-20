from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tools", "0005_drose_quote_request"),
    ]

    operations = [
        migrations.AddField(
            model_name="drosequoterequest",
            name="staff_viewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
