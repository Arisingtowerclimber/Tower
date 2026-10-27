# Перекрашивает светлый фон портретов в тёмный тёпло-коричневый тон игры.
# Оригиналы сохраняются в assets/portraits/originals/.
# Запуск: powershell -ExecutionPolicy Bypass -File dev/recolor-portraits.ps1

Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class PortraitRecolor
{
    static bool IsBackground(byte r, byte g, byte b, int minBrightness, double maxSaturation)
    {
        int max = Math.Max(r, Math.Max(g, b));
        int min = Math.Min(r, Math.Min(g, b));
        if (max < minBrightness) return false;
        double sat = max == 0 ? 0 : (double)(max - min) / max;
        return sat <= maxSaturation;
    }

    static int Hash(int x, int y)
    {
        unchecked
        {
            int h = x * 73856093 ^ y * 19349663;
            h ^= h >> 13;
            h *= 1274126177;
            h ^= h >> 16;
            return h & 7;
        }
    }

    public static void Process(string source, string destination)
    {
        using (var original = new Bitmap(source))
        {
            int w = original.Width;
            int h = original.Height;

            using (var bitmap = new Bitmap(w, h, PixelFormat.Format32bppArgb))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.DrawImage(original, 0, 0, w, h);
                }

                var data = bitmap.LockBits(
                    new Rectangle(0, 0, w, h),
                    ImageLockMode.ReadWrite,
                    PixelFormat.Format32bppArgb);

                int stride = data.Stride;
                byte[] pixels = new byte[stride * h];
                Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

                bool[] mask = new bool[w * h];
                bool[] visited = new bool[w * h];
                var queue = new Queue<int>(w * 2 + h * 2);

                Action<int, int> seed = (x, y) =>
                {
                    int i = y * w + x;
                    if (visited[i]) return;
                    int p = y * stride + x * 4;
                    byte b = pixels[p], g = pixels[p + 1], r = pixels[p + 2];
                    if (IsBackground(r, g, b, 170, 0.20))
                    {
                        visited[i] = true;
                        queue.Enqueue(i);
                    }
                };

                for (int x = 0; x < w; x++)
                {
                    seed(x, 0);
                    seed(x, h - 1);
                }
                for (int y = 0; y < h; y++)
                {
                    seed(0, y);
                    seed(w - 1, y);
                }

                while (queue.Count > 0)
                {
                    int i = queue.Dequeue();
                    int x = i % w;
                    int y = i / w;
                    int p = y * stride + x * 4;
                    byte b = pixels[p], g = pixels[p + 1], r = pixels[p + 2];

                    if (!IsBackground(r, g, b, 170, 0.20)) continue;
                    mask[i] = true;

                    if (x > 0) { int n = i - 1; if (!visited[n]) { visited[n] = true; queue.Enqueue(n); } }
                    if (x + 1 < w) { int n = i + 1; if (!visited[n]) { visited[n] = true; queue.Enqueue(n); } }
                    if (y > 0) { int n = i - w; if (!visited[n]) { visited[n] = true; queue.Enqueue(n); } }
                    if (y + 1 < h) { int n = i + w; if (!visited[n]) { visited[n] = true; queue.Enqueue(n); } }
                }

                // Мягкий тёплый фон: вертикальный градиент, свечение за спиной и виньетка.
                Action<int, int, double> paint = (x, y, alpha) =>
                {
                    int p = y * stride + x * 4;

                    double nx = (x - w * 0.5) / (w * 0.5);
                    double ny = (y - h * 0.40) / (h * 0.40);
                    double dist = Math.Sqrt(nx * nx + ny * ny);
                    double glow = Math.Max(0, 1 - dist * 1.15);
                    glow *= glow;

                    double down = (double)y / Math.Max(1, h - 1);

                    int r = (int)(16 + 42 * glow + 7 * (1 - down));
                    int g = (int)(11 + 27 * glow + 4 * (1 - down));
                    int b = (int)(8 + 17 * glow + 2 * (1 - down));

                    double vx = (x - w * 0.5) / (w * 0.5);
                    double vy = (y - h * 0.5) / (h * 0.5);
                    double vd = Math.Sqrt(vx * vx + vy * vy);
                    double vig = 1.0 - 0.38 * Math.Max(0, Math.Min(1, (vd - 0.45) / 0.75));

                    int grain = Hash(x, y) - 3;
                    r = Math.Max(0, Math.Min(255, (int)(r * vig) + grain));
                    g = Math.Max(0, Math.Min(255, (int)(g * vig) + grain));
                    b = Math.Max(0, Math.Min(255, (int)(b * vig) + grain));

                    if (alpha >= 1)
                    {
                        pixels[p] = (byte)b;
                        pixels[p + 1] = (byte)g;
                        pixels[p + 2] = (byte)r;
                        pixels[p + 3] = 255;
                    }
                    else
                    {
                        pixels[p] = (byte)(pixels[p] * (1 - alpha) + b * alpha);
                        pixels[p + 1] = (byte)(pixels[p + 1] * (1 - alpha) + g * alpha);
                        pixels[p + 2] = (byte)(pixels[p + 2] * (1 - alpha) + r * alpha);
                    }
                };

                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        if (mask[y * w + x]) paint(x, y, 1.0);
                    }
                }

                // Светлая кромка вокруг волос и плеч остаётся от исходного фона.
                // Проходим от маски вглубь на несколько пикселей, но только по
                // светлым малосатурационным пикселям — кожа и одежда не задеты.
                int[] depth = new int[w * h];
                for (int i = 0; i < depth.Length; i++) depth[i] = -1;

                var fringe = new Queue<int>();
                for (int i = 0; i < mask.Length; i++)
                {
                    if (!mask[i]) continue;
                    depth[i] = 0;
                    fringe.Enqueue(i);
                }

                int maxDepth = 8;
                while (fringe.Count > 0)
                {
                    int i = fringe.Dequeue();
                    int d = depth[i];
                    if (d >= maxDepth) continue;

                    int x = i % w;
                    int y = i / w;

                    for (int oy = -1; oy <= 1; oy++)
                    {
                        int ny = y + oy;
                        if (ny < 0 || ny >= h) continue;
                        for (int ox = -1; ox <= 1; ox++)
                        {
                            if (ox == 0 && oy == 0) continue;
                            int nx = x + ox;
                            if (nx < 0 || nx >= w) continue;

                            int n = ny * w + nx;
                            if (mask[n] || depth[n] != -1) continue;

                            int p = ny * stride + nx * 4;
                            byte b = pixels[p], g = pixels[p + 1], r = pixels[p + 2];
                            if (!IsBackground(r, g, b, 140, 0.28)) continue;

                            depth[n] = d + 1;
                            fringe.Enqueue(n);
                        }
                    }
                }

                double[] fringeAlpha = { 0, 1.0, 0.90, 0.78, 0.62, 0.46, 0.32, 0.20, 0.10 };
                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int d = depth[y * w + x];
                        if (d > 0 && d <= maxDepth) paint(x, y, fringeAlpha[d]);
                    }
                }

                // Светлые карманы исходного фона, зажатые между прядями волос,
                // не связаны с внешним фоном. Убираем их по близости к кремовому
                // цвету, но только рядом с силуэтом — глаза и блики металла целы.
                int[] near = new int[w * h];
                for (int i = 0; i < near.Length; i++) near[i] = -1;

                var pockets = new Queue<int>();
                for (int i = 0; i < mask.Length; i++)
                {
                    if (!mask[i]) continue;
                    near[i] = 0;
                    pockets.Enqueue(i);
                }

                int pocketRadius = 48;
                while (pockets.Count > 0)
                {
                    int i = pockets.Dequeue();
                    int d = near[i];
                    if (d >= pocketRadius) continue;

                    int x = i % w;
                    int y = i / w;

                    for (int oy = -1; oy <= 1; oy++)
                    {
                        int ny = y + oy;
                        if (ny < 0 || ny >= h) continue;
                        for (int ox = -1; ox <= 1; ox++)
                        {
                            if (ox == 0 && oy == 0) continue;
                            int nx = x + ox;
                            if (nx < 0 || nx >= w) continue;

                            int n = ny * w + nx;
                            if (near[n] != -1) continue;
                            near[n] = d + 1;
                            pockets.Enqueue(n);
                        }
                    }
                }

                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int d = near[y * w + x];
                        if (d <= 0 || d > pocketRadius) continue;

                        int p = y * stride + x * 4;
                        byte b = pixels[p], g = pixels[p + 1], r = pixels[p + 2];
                        int dr = r - 245, dg = g - 242, db = b - 232;
                        if (dr * dr + dg * dg + db * db > 1600) continue;
                        if (r < 205 || g < 200 || b < 190) continue;

                        double alpha = d <= 8 ? 1.0
                            : d <= 16 ? 0.90
                            : d <= 24 ? 0.75
                            : d <= 32 ? 0.55
                            : d <= 40 ? 0.35
                            : 0.20;
                        paint(x, y, alpha);
                    }
                }

                Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
                bitmap.UnlockBits(data);

                var jpeg = GetEncoder(ImageFormat.Jpeg);
                var parameters = new EncoderParameters(1);
                parameters.Param[0] = new EncoderParameter(Encoder.Quality, 94L);
                bitmap.Save(destination, jpeg, parameters);
            }
        }
    }

    static ImageCodecInfo GetEncoder(ImageFormat format)
    {
        foreach (var codec in ImageCodecInfo.GetImageDecoders())
        {
            if (codec.FormatID == format.Guid) return codec;
        }
        return null;
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$portraitDir = Join-Path $root "assets\portraits"
$originalDir = Join-Path $portraitDir "originals"
New-Item -ItemType Directory -Force -Path $originalDir | Out-Null

foreach ($name in @("m1", "m2", "f1")) {
    $source = Join-Path $portraitDir "$name.jpg"
    $backup = Join-Path $originalDir "$name.jpg"
    if (-not (Test-Path $backup)) {
        Copy-Item -LiteralPath $source -Destination $backup
    }
    $temp = Join-Path $portraitDir "$name.recolored.jpg"
    [PortraitRecolor]::Process($backup, $temp)
    Move-Item -LiteralPath $temp -Destination $source -Force
    Write-Output "Готово: $name.jpg"
}
