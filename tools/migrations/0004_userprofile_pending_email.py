from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tools", "0003_userprofile_home_hidden_tools"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="pending_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
    ]
