#!/usr/bin/env python3
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import subprocess,json,re,hashlib,ast
from PIL import Image,ImageDraw
from fontTools.ttLib import TTFont
from playwright.sync_api import sync_playwright
from food_animation_content import CONTENT
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'s1/semester1_lessons/animations';REPORT=ROOT/'reports/food-animations';REPORT.mkdir(parents=True,exist_ok=True)
def run(a):return subprocess.check_output(a,text=True)
media=[]
cmap=(TTFont('/mnt/c/Windows/Fonts/msjh.ttc',fontNumber=0).getBestCmap() or {}) | (TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf').getBestCmap() or {})
strings=[n.value for n in ast.walk(ast.parse((ROOT/'tools/render_food_animations.py').read_text())) if isinstance(n,ast.Constant) and isinstance(n.value,str)]
for w,(title,terms,speech) in CONTENT.items():strings.extend([title,*terms,*speech])
assert not {c for s in strings for c in s if ord(c)>127 and not c.isspace() and ord(c) not in cmap}
for w in CONTENT:
 slug=f'w{w:02}';folder=BASE/slug;mp4=folder/f'{slug}_animation.mp4';data=json.loads((folder/'storyboard.json').read_text());probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(mp4)]));duration=float(probe['format']['duration'])
 assert {s['codec_type'] for s in probe['streams']}=={'audio','video'}
 video=next(s for s in probe['streams'] if s['codec_type']=='video');assert (video['width'],video['height'])==(1280,720)
 assert duration-data['timing']['speech_seconds']>=1.9
 run(['ffmpeg','-v','error','-i',str(mp4),'-f','null','-'])
 for ext in ['vtt','srt']:
  captions=(folder/f'{slug}_animation.{ext}').read_text();parts=re.findall(r'\d\d:\d\d:\d\d[.,]\d{3} --> \d\d:\d\d:\d\d[.,]\d{3}\n(.*?)(?=\n\n|\Z)',captions,re.S);assert len(parts)==9
  assert [p.replace('\n','').strip() for p in parts]==CONTENT[w][2]
 sheet=Image.new('RGB',(1920,1080),'white')
 for i,cue in enumerate(data['timing']['cues']):
  temp=REPORT/'frame.jpg';run(['ffmpeg','-y','-v','error','-ss',str((cue['start']+cue['end'])/2),'-i',str(mp4),'-frames:v','1',str(temp)]);im=Image.open(temp).resize((640,360));sheet.paste(im,((i%3)*640,(i//3)*360))
 sheet.save(REPORT/f'{slug}-all-scenes.jpg',quality=95);temp.unlink()
 media.append({'week':slug,'duration':duration,'bytes':mp4.stat().st_size,'sha256':hashlib.sha256(mp4.read_bytes()).hexdigest(),'complete_decode':'passed','full_subtitles':9,'ending_hold':duration-data['timing']['speech_seconds']})
(REPORT/'media.json').write_text(json.dumps(media,indent=2)+'\n');print('Media checks:',json.dumps(media),flush=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start();checks=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--autoplay-policy=no-user-gesture-required'])
  for profile,width in [('desktop',1365),('mobile',390)]:
   context=browser.new_context(viewport={'width':width,'height':844});page=context.new_page()
   for w in CONTENT:
    path=next((ROOT/'s1/semester1_lessons').glob(f'w{w:02}_*.html')).relative_to(ROOT)
    page.goto(f'http://127.0.0.1:{server.server_port}/{path}#video',wait_until='load');v=page.locator('video');assert v.count()==1;v.scroll_into_view_if_needed()
    page.evaluate('const v=document.querySelector("video");v.muted=true;v.textTracks[0].mode="showing";v.play()')
    page.wait_for_function('document.querySelector("video").currentTime>.2 && document.querySelector("video").textTracks[0].cues?.length===9')
    result=page.evaluate('()=>{const v=document.querySelector("video"),r=v.getBoundingClientRect();return {width:v.videoWidth,left:r.left,right:r.right,paused:v.paused,doc:document.documentElement.scrollWidth}}');assert result['width']==1280 and not result['paused'];assert result['left']>=-2 and result['right']<=width+2 and result['doc']<=width+2,result
    page.locator('.animation-options button').nth(1 if w==7 else 0).click();assert '答對了' in page.locator('.animation-feedback').inner_text()
    page.evaluate('const v=document.querySelector("video");v.pause();v.currentTime=v.duration-.4');page.wait_for_function('!document.querySelector("video").seeking && document.querySelector("video").readyState>=2')
    page.screenshot(path=str(REPORT/f'{profile}-w{w:02}.png'));checks.append({'week':w,'profile':profile,'playback':'passed','vtt_cues':9,'quiz':'passed','ending_seek':'passed','mobile_fit':'passed'})
   context.close()
  browser.close()
finally:server.shutdown()
assert len(checks)==6
(REPORT/'browser.json').write_text(json.dumps(checks,indent=2)+'\n');print('Browser checks:',json.dumps(checks))
