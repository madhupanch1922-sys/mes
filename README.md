# M.E.S. Convent English High School — redesigned site

Pure HTML5 + CSS3 + vanilla JavaScript. No build step.

## Run
Pages contain their markup directly and need no build step. Use VS Code "Live Server" or deploy to Netlify to test form submissions.

## Put your existing images in /images
logo.png, school-entrance.jpg, chairman1.jpg, chairman2.jpg, principal.jpg  (same names as the current site)

## Structure
index.html, about.html, academics.html, facilities.html, admissions.html, gallery.html, contact.html

index.html    Home page with its sections inline
other pages   Shared header, footer, and admission popup inline
css/          styles.css (all site styles)
js/           main.js (all site behavior)

## Change colours
css/base.css -> the :root block (--primary, --primary-dark, --accent ...)

## Forms (Netlify)
Admission popup form = "admission-enquiry", contact form = "contact".
Submissions appear in Netlify dashboard > Forms after deploy.
index.html contains a hidden copy of the popup form so Netlify can register it — don't delete it.

## Placeholders to replace
Phone, email, address, map (page HTML), leadership names, notices/events
(index.html), gallery photos, facilities, grade list + academic years (admissions popup in each page's HTML).
