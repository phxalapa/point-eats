#!/usr/bin/env python3
"""Genera oliver-pizzas-menu.html: el menú en un solo archivo con las imágenes incrustadas.
Uso: python3 tools/build-single.py   (desde la carpeta oliver-pizzas)"""
import base64, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
imgs = {f"img/{f.name}": "data:image/jpeg;base64," + base64.b64encode(f.read_bytes()).decode()
        for f in sorted((root / "img").glob("*.jpg"))}
assert "const IMG = {};" in html
html = html.replace("const IMG = {};", "const IMG = " + json.dumps(imgs) + ";", 1)
for k, v in imgs.items():  # atributos HTML estáticos (logo, favicon)
    html = html.replace(f'src="{k}"', f'src="{v}"').replace(f'href="{k}"', f'href="{v}"')
out = root / "oliver-pizzas-menu.html"
out.write_text(html, encoding="utf-8")
print(out.name, out.stat().st_size // 1024, "KB")
