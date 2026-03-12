from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
from django.contrib.auth.decorators import login_required
import asyncio
import secrets

from .forms import UserRegistrationForm, ProfileUpdateForm, AvatarUploadForm
from .models import UserProfile, EmailVerificationToken
from PyPDF2 import PdfReader, PdfWriter
from googletrans import Translator  # Importa googletrans per la traduzione
import hashlib
import os
import re
import tempfile
import time
import xml.etree.ElementTree as ET
import zipfile
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import json

# -------------------------
# Normal page views
# -------------------------
def home(request):
    return render(request, 'tools/home.html')


def faq(request):
    return render(request, 'tools/faq.html')


def privacy(request):
    return render(request, 'tools/privacy.html')


def about(request):
    return render(request, 'tools/about.html')


def contact(request):
    return render(request, 'tools/contact.html')


def accounts_home(request):
    """Redirect /accounts/ to admin (staff), account profile (user), or login."""
    if request.user.is_authenticated and request.user.is_staff:
        from django.urls import reverse
        return redirect(reverse('admin:auth_user_changelist'))
    if request.user.is_authenticated:
        return redirect('account_profile')
    return redirect('login')


@login_required
def account_profile(request):
    """Account settings: username, email, avatar, password change."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile_form = ProfileUpdateForm(user=request.user)
    avatar_form = AvatarUploadForm(instance=profile)
    msg = None
    avatar_saved = False

    if request.method == 'POST':
        if 'update_profile' in request.POST:
            profile_form = ProfileUpdateForm(request.POST, user=request.user)
            if profile_form.is_valid():
                request.user.username = profile_form.cleaned_data['username']
                request.user.email = profile_form.cleaned_data['email']
                request.user.save()
                msg = 'Profile updated.'
                profile_form = ProfileUpdateForm(user=request.user)
        elif 'update_avatar' in request.POST:
            avatar_form = AvatarUploadForm(request.POST, request.FILES, instance=profile)
            if avatar_form.is_valid():
                media_avatars = os.path.join(settings.MEDIA_ROOT, 'avatars')
                os.makedirs(media_avatars, exist_ok=True)
                avatar_form.save()
                if request.POST.get('avatar_action') == 'save':
                    return redirect(reverse('account_profile') + '?avatar_saved=1')
                avatar_form = AvatarUploadForm(instance=profile)
    else:
        avatar_saved = request.GET.get('avatar_saved') == '1'

    return render(request, 'tools/account_profile.html', {
        'profile': profile,
        'profile_form': profile_form,
        'avatar_form': avatar_form,
        'msg': msg,
        'avatar_saved': avatar_saved,
    })


@login_required
def account_delete_confirm(request):
    """Confirmation page: enter password to delete account."""
    err = None
    if request.method == 'POST':
        password = request.POST.get('password', '')
        user = authenticate(request, username=request.user.username, password=password)
        if user is not None:
            logout(request)
            user.delete()
            return redirect('home')
        err = 'Incorrect password.'
    return render(request, 'tools/account_delete_confirm.html', {'err': err})


@require_http_methods(["GET"])
def check_username(request):
    """API: check if username is available. Returns JSON {available: bool}."""
    username = (request.GET.get('username') or '').strip()
    if not username:
        return JsonResponse({'available': False, 'error': 'empty'})
    if len(username) < 3:
        return JsonResponse({'available': False, 'error': 'too_short'})
    taken = User.objects.filter(username__iexact=username).exists()
    return JsonResponse({'available': not taken})


def register(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.email = form.cleaned_data['email']
            user.save()
            UserProfile.objects.get_or_create(user=user)
            # Send verification email (use hex token - no special chars, avoids copy issues)
            EmailVerificationToken.objects.filter(user=user).delete()
            token = secrets.token_hex(24)
            EmailVerificationToken.objects.create(user=user, token=token)
            verify_url = request.build_absolute_uri(
                reverse("verify_email", kwargs={"token": token})
            )
            subject = "Verify your email - Gadly"
            message = (
                f"Hi {user.username},\n\n"
                f"Please verify your email by clicking this link:\n\n{verify_url}\n\n"
                f"This allows you to reset your password if you forget it.\n\n"
                f"If you didn't create an account, ignore this email.\n\n"
                f"— Gadly"
            )
            send_mail(
                subject,
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gadly.local'),
                [user.email],
                fail_silently=True,
            )
            login(request, user)
            # In dev (DEBUG): store link in session so user can click it directly from the page
            if settings.DEBUG:
                request.session['pending_verify_url'] = verify_url
            return redirect('verify_email_sent')
    else:
        form = UserRegistrationForm()
    return render(request, 'tools/register.html', {'form': form})


@require_GET
def verify_email(request, token):
    """Verify email when user clicks the link."""
    token = (token or '').strip()
    evt = EmailVerificationToken.objects.filter(token=token).first()
    if not evt:
        return render(request, 'tools/verify_email_invalid.html')
    profile, _ = UserProfile.objects.get_or_create(user=evt.user)
    profile.email_verified = True
    profile.save()
    evt.delete()
    return render(request, 'tools/verify_email_done.html')


def verify_email_sent(request):
    """Page shown after registration: check your email."""
    # In DEBUG mode, show clickable link (email goes to console, link is easier here)
    verify_url = request.session.pop('pending_verify_url', None)
    return render(request, 'tools/verify_email_sent.html', {'verify_url': verify_url})


def resend_verification_email(request):
    """Resend verification email (for logged-in users who haven't verified)."""
    if not request.user.is_authenticated:
        return redirect('login')
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if profile.email_verified:
        return redirect('home')
    EmailVerificationToken.objects.filter(user=request.user).delete()
    token = secrets.token_hex(24)
    EmailVerificationToken.objects.create(user=request.user, token=token)
    verify_url = request.build_absolute_uri(
        reverse("verify_email", kwargs={"token": token})
    )
    subject = "Verify your email - Gadly"
    message = (
        f"Hi {request.user.username},\n\n"
        f"Please verify your email by clicking this link:\n\n{verify_url}\n\n"
        f"— Gadly"
    )
    send_mail(
        subject,
        message,
        getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gadly.local'),
        [request.user.email],
        fail_silently=True,
    )
    if settings.DEBUG:
        request.session['pending_verify_url'] = verify_url
    return redirect('verify_email_sent')

def calculator(request):
    return render(request, 'tools/calculator.html')

# Single finance calculator (one panel per page)
CALC_PANELS = ('percent', 'iva', 'salary', 'interest', 'currency', 'loan', 'discount', 'margin', 'split')
CALC_TITLES = {
    'percent': 'Percentage',
    'iva': 'VAT',
    'salary': 'Net Salary',
    'interest': 'Interest',
    'currency': 'Currency',
    'loan': 'Loan',
    'discount': 'Discount',
    'margin': 'Margin',
    'split': 'Split Bill',
}

def calculator_single(request, panel):
    if panel not in CALC_PANELS:
        from django.http import Http404
        raise Http404
    return render(request, 'tools/calculator.html', {
        'active_panel': panel,
        'single_calc': True,
        'calc_title': CALC_TITLES.get(panel, 'Finance calculator'),
    })

def translator(request):
    return render(request, 'tools/translator.html')

def file_analyzer(request):
    return render(request, 'tools/file_analyzer.html')

def image_editor(request):
    return render(request, 'tools/image_editor.html')

def data_viz(request):
    return render(request, 'tools/data_viz.html')


def qr_generator(request):
    return render(request, 'tools/qr_generator.html')

def password_gen(request):
    return render(request, 'tools/password_gen.html')

def remove_spaces(request):
    return render(request, 'tools/remove_spaces.html')

def username_generator(request):
    return render(request, 'tools/username_generator.html')

def bio_generator(request):
    return render(request, 'tools/bio_generator.html')

def markdown_preview(request):
    return render(request, 'tools/markdown_preview.html')

def meta_tag_checker(request):
    return render(request, 'tools/meta_tag_checker.html')

def sitemap_extractor(request):
    return render(request, 'tools/sitemap_extractor.html')

def robots_txt_generator(request):
    return render(request, 'tools/robots_txt_generator.html')

def site_speed_check(request):
    return render(request, 'tools/site_speed_check.html')

def hashtag_generator(request):
    return render(request, 'tools/hashtag_generator.html')

def caption_generator(request):
    return render(request, 'tools/caption_generator.html')

def video_downloader(request):
    return render(request, 'tools/video_downloader.html')

# -------------------------
# Word Counter view
# -------------------------
def word_counter(request):
    count_words = None
    count_chars = None
    text = ''

    if request.method == 'POST':
        text = request.POST.get('text', '')
        if 'count_words_btn' in request.POST:
            count_words = len(text.split())
        elif 'count_chars_btn' in request.POST:
            count_chars = len(text)

    return render(request, 'tools/word_counter.html', {
        'count_words': count_words,
        'count_chars': count_chars,
        'text': text
    })

# -------------------------
# API-like view for Translator (server-side)
# -------------------------
@csrf_exempt
def translate_text(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        text = data.get("q", "")  # Il testo da tradurre
        target_lang = data.get("target", "en")  # Lingua di destinazione, di default 'en'

        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        # googletrans 4.x usa translate() async: va eseguita con asyncio.run()
        async def _translate():
            async with Translator() as translator:
                return await translator.translate(text, src='auto', dest=target_lang)

        translated = asyncio.run(_translate())
        return JsonResponse({"translatedText": translated.text})

    except Exception as e:
        print("Error in translate_text:", e)
        return JsonResponse({"error": str(e)}, status=500)
# -------------------------
# File Analyzer view
# -------------------------
def _human_size(size_bytes):
    for unit in ('B', 'KB', 'MB', 'GB', 'TB'):
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} PB"

@csrf_exempt
def analyze_file(request):
    if request.method == "POST" and request.FILES.get("file"):
        file = request.FILES["file"]

        file_name = file.name
        file_size = file.size
        file_type = file.content_type or "application/octet-stream"
        file_extension = os.path.splitext(file_name)[1] or "-"
        file_size_human = _human_size(file_size)

        # MD5 hash
        file.seek(0)
        hasher = hashlib.md5()
        for chunk in file.chunks():
            hasher.update(chunk)
        md5_hash = hasher.hexdigest()

        result = {
            "file_name": file_name,
            "file_size": file_size,
            "file_size_human": file_size_human,
            "file_type": file_type,
            "file_extension": file_extension,
            "md5_hash": md5_hash,
        }

        # Prova sempre a leggere come testo; se riesce, aggiungi linee/parole/caratteri
        try:
            file.seek(0)
            content = file.read().decode("utf-8", errors="ignore")
            lines = content.splitlines()
            words = content.split()
            result["line_count"] = len(lines)
            result["word_count"] = len(words)
            result["char_count"] = len(content)
        except Exception:
            pass

        return JsonResponse(result)

    return JsonResponse({"error": "No file uploaded"}, status=400)

# -----------------------------------------
# PDF Merger view
# -----------------------------------------
@csrf_exempt
def pdf_merger(request):
    if request.method == 'POST' and request.FILES.getlist('files'):
        files = request.FILES.getlist('files')
        
        writer = PdfWriter()

        # Unisci ogni PDF caricato
        for file in files:
            reader = PdfReader(file)
            for page in reader.pages:
                writer.add_page(page)

        # Usa tempfile per creare un file temporaneo per il PDF unito
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf', dir='temp_pdfs') as tmp_file:
                output_path = tmp_file.name  # Ottieni il percorso del file temporaneo

            # Assicurati che la cartella 'temp_pdfs' esista
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Scrivi il PDF unito nel file temporaneo
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)

            # Restituisci il PDF come file da scaricare
            with open(output_path, 'rb') as output_file:
                response = JsonResponse({"message": "Success"})
                response["Content-Type"] = "application/pdf"
                response["Content-Disposition"] = f"attachment; filename=merged_pdf.pdf"
                response.write(output_file.read())
                return response

        except Exception as e:
            return JsonResponse({"message": f"Error: {str(e)}"}, status=500)

    return render(request, 'tools/pdf_merge.html')


# -----------------------------------------
# PDF Split view
# -----------------------------------------
@csrf_exempt
def pdf_split(request):
    if request.method == 'POST' and request.FILES.get('file'):
        pdf_file = request.FILES['file']
        pages_per_split = 1
        if request.POST.get('pages_per_split'):
            try:
                pages_per_split = max(1, int(request.POST['pages_per_split']))
            except (ValueError, TypeError):
                pages_per_split = 1
        zip_path = None
        try:
            reader = PdfReader(pdf_file)
            num_pages = len(reader.pages)
            if num_pages == 0:
                return JsonResponse({"error": "PDF has no pages"}, status=400)
            base_name = os.path.splitext(pdf_file.name)[0]
            fd, zip_path = tempfile.mkstemp(suffix='.zip')
            os.close(fd)
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                chunk_num = 0
                i = 0
                while i < num_pages:
                    writer = PdfWriter()
                    end_i = min(i + pages_per_split, num_pages)
                    for j in range(i, end_i):
                        writer.add_page(reader.pages[j])
                    chunk_num += 1
                    chunk_name = f"{base_name}_part_{chunk_num}.pdf"
                    fd2, tmp_path = tempfile.mkstemp(suffix='.pdf')
                    os.close(fd2)
                    try:
                        with open(tmp_path, 'wb') as out:
                            writer.write(out)
                        zf.write(tmp_path, chunk_name)
                    finally:
                        if os.path.exists(tmp_path):
                            os.unlink(tmp_path)
                    i = end_i
            with open(zip_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/zip')
                response['Content-Disposition'] = f'attachment; filename="{base_name}_split.zip"'
                return response
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        finally:
            if zip_path and os.path.exists(zip_path):
                try:
                    os.unlink(zip_path)
                except Exception:
                    pass
    return render(request, 'tools/pdf_split.html')


# -----------------------------------------
# Image Editor API: Background removal & Upscaling
# -----------------------------------------
import io

def _get_rembg():
    """Lazy import rembg to avoid blocking app startup if not installed."""
    try:
        from rembg import remove as rembg_remove
        return rembg_remove
    except Exception:
        return None


@csrf_exempt
def image_remove_bg_api(request):
    """Remove background from image. Requires: pip install "rembg[cpu]" """
    if request.method != 'POST' or not request.FILES.get('image'):
        return JsonResponse({"error": "POST with image file required"}, status=400)
    rembg_remove = _get_rembg()
    if rembg_remove is None:
        return JsonResponse({"error": "Background removal requires: pip install \"rembg[cpu]\""}, status=501)
    try:
        from PIL import Image as PILImage
        request.FILES['image'].seek(0)
        img = PILImage.open(request.FILES['image']).copy().convert('RGBA')
        w, h = img.size
        max_side = 4096
        if w > max_side or h > max_side:
            r = PILImage.Resampling.LANCZOS if hasattr(PILImage, 'Resampling') else PILImage.LANCZOS
            img.thumbnail((max_side, max_side), r)
            w, h = img.size
        out = rembg_remove(
            img,
            post_process_mask=False,
            alpha_matting=True,
            alpha_matting_foreground_threshold=285,
            alpha_matting_background_threshold=15,
        )
        buf = io.BytesIO()
        out.save(buf, format='PNG')
        buf.seek(0)
        return HttpResponse(buf.getvalue(), content_type='image/png')
    except Exception as e:
        err_msg = str(e)
        if 'onnxruntime' in err_msg.lower() or 'session' in err_msg.lower():
            err_msg = "rembg/onnxruntime error. Run: pip install \"rembg[cpu]\""
        elif not err_msg or len(err_msg) > 200:
            err_msg = err_msg[:200] if err_msg else "Unknown error"
        return JsonResponse({"error": err_msg}, status=500)


@csrf_exempt
def image_upscale_api(request):
    """Upscale image 2x using high-quality resampling."""
    if request.method != 'POST' or not request.FILES.get('image'):
        return JsonResponse({"error": "POST with image file required"}, status=400)
    try:
        from PIL import Image as PILImage
        f = request.FILES['image']
        f.seek(0)
        scale = 2
        if request.POST.get('scale'):
            try:
                scale = max(1, min(4, int(request.POST['scale'])))
            except (ValueError, TypeError):
                pass
        img = PILImage.open(f).copy().convert('RGBA')
        w, h = img.size
        new_w, new_h = w * scale, h * scale
        if new_w > 4096 or new_h > 4096:
            return JsonResponse({"error": "Result would exceed 4096px. Use smaller image or scale."}, status=400)
        try:
            resample = PILImage.Resampling.LANCZOS
        except AttributeError:
            resample = PILImage.LANCZOS
        out = img.resize((new_w, new_h), resample)
        buf = io.BytesIO()
        out.save(buf, format='PNG')
        return HttpResponse(buf.getvalue(), content_type='image/png')
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# -----------------------------------------
# Web / SEO API views
# -----------------------------------------
def _fetch_url(url, timeout=15):
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; ToolsBot/1.0)'})
    return urlopen(req, timeout=timeout)


@csrf_exempt
def meta_tag_check_api(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid method"}, status=405)
    try:
        data = json.loads(request.body)
        url = data.get('url', '').strip()
        if not url:
            return JsonResponse({"error": "URL required"}, status=400)
        resp = _fetch_url(url)
        html = resp.read().decode('utf-8', errors='ignore')
        meta_tags = []
        # title
        m = re.search(r'<title[^>]*>([^<]+)</title>', html, re.I | re.S)
        if m:
            meta_tags.append({"name": "title", "content": m.group(1).strip()})
        # meta tags
        for m in re.finditer(r'<meta\s+([^>]+)>', html, re.I):
            attrs = m.group(1)
            name = None
            prop = None
            content = None
            for a in re.finditer(r'(\w+)\s*=\s*["\']([^"\']*)["\']', attrs):
                k, v = a.group(1).lower(), a.group(2)
                if k == 'name': name = v
                elif k == 'property': prop = v
                elif k == 'content': content = v
            if content and (name or prop):
                meta_tags.append({"name": name or prop, "content": content})
        return JsonResponse({"meta_tags": meta_tags})
    except (URLError, HTTPError) as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def sitemap_extract_api(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid method"}, status=405)
    try:
        data = json.loads(request.body)
        url = data.get('url', '').strip()
        if not url:
            return JsonResponse({"error": "URL required"}, status=400)
        resp = _fetch_url(url)
        content = resp.read()
        # Check if we got HTML instead of XML
        try:
            peek = content[:100].decode('utf-8', errors='ignore').strip().lower()
        except Exception:
            peek = ''
        if peek.startswith('<!') or '<html' in peek[:50]:
            return JsonResponse({
                "error": "This URL returns a web page (HTML), not a sitemap. Please enter the direct link to your sitemap file (e.g. https://example.com/sitemap.xml)."
            }, status=400)
        root = ET.fromstring(content)
        ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = []
        for loc in root.findall('.//sm:url/sm:loc', ns):
            if loc.text:
                urls.append(loc.text.strip())
        if not urls:
            for loc in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
                if loc.text:
                    urls.append(loc.text.strip())
        if not urls:
            for loc in root.findall('.//*[local-name()="loc"]'):
                if loc.text:
                    urls.append(loc.text.strip())
        return JsonResponse({"urls": urls})
    except (URLError, HTTPError) as e:
        return JsonResponse({"error": str(e)}, status=400)
    except ET.ParseError as e:
        return JsonResponse({
            "error": "This URL does not return valid sitemap XML. Please enter the direct link to your sitemap file (e.g. https://example.com/sitemap.xml)."
        }, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def site_speed_api(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid method"}, status=405)
    try:
        data = json.loads(request.body)
        url = data.get('url', '').strip()
        if not url:
            return JsonResponse({"error": "URL required"}, status=400)
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; ToolsBot/1.0)'})
        t0 = time.time()
        resp = urlopen(req, timeout=30)
        _ = resp.read()
        elapsed = round((time.time() - t0) * 1000)
        return JsonResponse({"time_ms": elapsed, "status": resp.status})
    except (URLError, HTTPError) as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def video_download_api(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid method"}, status=405)
    try:
        import yt_dlp
    except ImportError:
        return JsonResponse({
            "error": "Video download requires yt-dlp. Install with: pip install yt-dlp"
        }, status=503)
    try:
        data = json.loads(request.body)
        url = data.get('url', '').strip()
        if not url:
            return JsonResponse({"error": "URL required"}, status=400)
        out_tmpl = os.path.join(tempfile.gettempdir(), 'ydl_%(id)s.%(ext)s')
        MIME_BY_EXT = {
            'mp4': 'video/mp4', 'webm': 'video/webm', 'mkv': 'video/x-matroska',
            '3gp': 'video/3gpp', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime',
        }
        # Prefer merged video+audio to mp4 (needs ffmpeg). Fallback to single-file formats.
        opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best',
            'merge_output_format': 'mp4',
            'quiet': True,
            'outtmpl': out_tmpl,
            'postprocessors': [{'key': 'FFmpegVideoConvertor', 'preferedformat': 'mp4'}],
        }
        fallback_opts = {
            'format': 'best[ext=mp4]/22/18/best',
            'quiet': True,
            'outtmpl': out_tmpl,
        }
        info = None
        for attempt_opts in (opts, fallback_opts):
            try:
                with yt_dlp.YoutubeDL(attempt_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                break
            except Exception as e:
                if attempt_opts is fallback_opts:
                    raise
                err = str(e).lower()
                if 'ffmpeg' in err or 'merge' in err or 'requested format' in err:
                    continue
                raise
        if not info:
            return JsonResponse({"error": "Could not extract video info"}, status=400)
        title = (info.get('title') or 'video')[:80]
        path = (out_tmpl % {'id': info.get('id', 'x'), 'ext': info.get('ext', 'mp4')})
        if os.path.exists(path):
            ext = (info.get('ext') or os.path.splitext(path)[1].lstrip('.') or 'mp4').lower()
            content_type = MIME_BY_EXT.get(ext, 'video/mp4')
            safe_title = re.sub(r'[^\w\-.]', '_', title) + ('.' + ext if ext else '.mp4')
            with open(path, 'rb') as f:
                resp = HttpResponse(f.read(), content_type=content_type)
                resp['Content-Disposition'] = 'attachment; filename="' + safe_title + '"'
                resp['X-Suggested-Filename'] = safe_title
                try:
                    os.unlink(path)
                except Exception:
                    pass
                return resp
        return JsonResponse({"error": "Download failed"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
