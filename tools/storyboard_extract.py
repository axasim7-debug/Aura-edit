# Extract storyboard JPEG sheets from a yt-dlp .mhtml file (raw binary parts with Content-Length)
import re, sys
data = open(sys.argv[1], 'rb').read()
times = re.findall(rb'Slide #\d+: ([\d:,]+) --> ([\d:,]+)', data)
n = 0
for m in re.finditer(rb'(?i)Content-type: image/jpeg\r?\nContent-length: (\d+)\r?\n(?:[^\r\n]+\r?\n)*?\r?\n', data):
    L = int(m.group(1)); s = m.end()
    open(f"{sys.argv[2]}_{n:02d}.jpg", 'wb').write(data[s:s + L]); n += 1
print(n, 'sheets', [(a.decode(), b.decode()) for a, b in times][:3])
