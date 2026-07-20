from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tools", "0006_drosequoterequest_staff_viewed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="drosequoterequest",
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
