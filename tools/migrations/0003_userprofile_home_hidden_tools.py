from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tools", "0002_userprofile_avatar"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="home_hidden_tools",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
