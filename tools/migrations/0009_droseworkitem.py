from django.db import migrations, models

import tools.models


class Migration(migrations.Migration):

    dependencies = [
        ("tools", "0008_drosequoterequest_reference_ds_prefix"),
    ]

    operations = [
        migrations.CreateModel(
            name="DroseWorkItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "media_type",
                    models.CharField(
                        choices=[("photo", "Photo"), ("video", "Video")],
                        max_length=10,
                    ),
                ),
                ("slot", models.PositiveSmallIntegerField()),
                ("file", models.FileField(upload_to=tools.models.drose_work_item_path)),
                ("caption", models.CharField(blank=True, default="", max_length=200)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ("media_type", "slot"),
            },
        ),
        migrations.AddConstraint(
            model_name="droseworkitem",
            constraint=models.UniqueConstraint(
                fields=("media_type", "slot"),
                name="unique_drose_work_slot",
            ),
        ),
    ]
