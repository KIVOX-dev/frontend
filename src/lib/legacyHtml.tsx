import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

type RuntimeScript = {
  id: string;
  src?: string;
  code?: string;
};

const rootDir = path.resolve(process.cwd(), "../..");

function readOriginalHtml(fileName: string) {
  return fs.readFileSync(path.join(rootDir, "frontend", fileName), "utf8");
}

function extractBody(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1] ?? html;
}

function normalizeAssetPaths(html: string) {
  return html
    .replaceAll('href="landing.css"', 'href="/landing.css"')
    .replaceAll('href="styles.css"', 'href="/styles.css"')
    .replaceAll('href="settings_v3.css"', 'href="/settings_v3.css"')
    .replaceAll('src="logo.png"', 'src="/logo.png"')
    .replaceAll('src="hero_video.mp4"', 'src="/hero_video.mp4"')
    .replaceAll('src="beginner.jpeg"', 'src="/beginner.jpeg"')
    .replaceAll('src="proficientjpeg.jpeg"', 'src="/proficientjpeg.jpeg"')
    .replaceAll('src="advance.png.jpeg"', 'src="/advance.png.jpeg"')
    .replaceAll('src="expert.jpeg"', 'src="/expert.jpeg"');
}

function collectScripts(html: string) {
  const scripts: RuntimeScript[] = [];
  let body = html;
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>|<script\s+([^>]*)><\/script>/gi;
  let index = 0;

  body = body.replace(scriptRegex, (full, inlineCode, attrs) => {
    const srcMatch = full.match(/\ssrc=["']([^"']+)["']/i);
    const src = srcMatch?.[1];
    if (src) {
      scripts.push({
        id: `legacy-script-${index++}`,
        src: src.startsWith("http") ? src : `/${src.replace(/^\//, "")}`,
      });
    } else if (inlineCode?.trim()) {
      scripts.push({ id: `legacy-inline-${index++}`, code: inlineCode });
    } else if (attrs) {
      const attrSrc = attrs.match(/src=["']([^"']+)["']/i)?.[1];
      if (attrSrc) {
        scripts.push({
          id: `legacy-script-${index++}`,
          src: attrSrc.startsWith("http") ? attrSrc : `/${attrSrc.replace(/^\//, "")}`,
        });
      }
    }
    return "";
  });

  return { body, scripts };
}

export function renderOriginalPage(fileName: string) {
  const html = normalizeAssetPaths(extractBody(readOriginalHtml(fileName)));
  const { body, scripts } = collectScripts(html);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: body }} />
      {scripts.map((script) =>
        script.src ? (
          <Script key={script.id} id={script.id} src={script.src} strategy="afterInteractive" />
        ) : (
          <Script key={script.id} id={script.id} strategy="afterInteractive">
            {script.code}
          </Script>
        ),
      )}
    </>
  );
}
