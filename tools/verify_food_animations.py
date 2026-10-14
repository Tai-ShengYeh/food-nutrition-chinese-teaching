#!/usr/bin/env python3
"""Batch/resumable verification, evidence tied to final MP4 hashes.
python tools/verify_food_animations.py media|browser|aggregate [week ...]
Run media after every re-render; browser evidence is valid only for matching input hashes.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import subprocess,json,re,hashlib,sys,wave,array,math
from PIL import Image
from playwright.sync_api import sync_playwright
from food_animation_content import CONTENT
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'s1/semester1_lessons/animations';REPORT=ROOT/'reports/food-animations';REPORT.mkdir(parents=True,exist_ok=True)
EXPECTED=set(CONTENT)
def run(a):return subprocess.check_output(a,text=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def package(w):
 slug=f'w{w:02}';folder=BASE/slug;return slug,folder,folder/f'{slug}_animation.mp4',json.loads((folder/'storyboard.json').read_text())
def media(weeks):
 for w in weeks:
  slug,folder,mp4,data=package(w);probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(mp4)]));duration=float(probe['format']['duration'])
  assert {s['codec_type'] for s in probe['streams']}=={'audio','video'}
  video=next(s for s in probe['streams'] if s['codec_type']=='video');assert (video['width'],video['height'])==(1280,720)
  assert 60<=duration<=125
  assert 1.9<=duration-data['timing']['speech_seconds']<=2.3
  run(['ffmpeg','-v','error','-i',str(mp4),'-f','null','-'])
  cues=data['timing']['cues'];speech=[s for s,f in CONTENT[w][1]];assert [c['text'] for c in cues]==speech
  assert len(cues)==9 and cues[0]['start']==0
  for i,c in enumerate(cues):
   assert c['end']>c['start']
   if i:assert abs(c['start']-cues[i-1]['end'])<1e-6
  for ext in ['vtt','srt']:
   captions=(folder/f'{slug}_animation.{ext}').read_text();parts=re.findall(r'\d\d:\d\d:\d\d[.,]\d{3} --> \d\d:\d\d:\d\d[.,]\d{3}\n(.*?)(?=\n\n|\Z)',captions,re.S)
   assert len(parts)==9
   assert [p.replace('\n','').strip() for p in parts]==speech
  # Decode actual encoded narration and check it is audible, not just an audio stream header.
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(mp4),'-vn','-ac','1','-ar','16000','-f','s16le','-'])
  a=array.array('h');a.frombytes(raw);rms=math.sqrt(sum(x*x for x in a)/len(a));assert rms>100,rms
  for c in cues:
   samples=a[round(c['start']*16000):round(c['end']*16000)];assert math.sqrt(sum(x*x for x in samples)/len(samples))>100
  assert Path(ROOT/data['sources'][0]).is_file()
  sheet=Image.new('RGB',(1920,1080),'white')
  for i,cue in enumerate(cues):
   temp=REPORT/f'{slug}-frame.jpg';run(['ffmpeg','-y','-v','error','-ss',str((cue['start']+cue['end'])/2),'-i',str(mp4),'-frames:v','1',str(temp)]);sheet.paste(Image.open(temp).resize((640,360)),((i%3)*640,(i//3)*360));temp.unlink()
  sheet.save(REPORT/f'{slug}-all-scenes.jpg',quality=95)
  # Include last-frame evidence for ending hold and opening reveal.
  for name,t in [('opening',.5),('ending',duration-.25)]:run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(mp4),'-frames:v','1',str(REPORT/f'{slug}-{name}.jpg')])
  row={'week':w,'slug':slug,'title':data['title'],'duration':duration,'bytes':mp4.stat().st_size,'sha256':sha(mp4),'width':1280,'height':720,'complete_decode':'passed','audible_narration_rms':round(rms,2),'full_subtitles':9,'scene_count':9,'ending_hold':duration-data['timing']['speech_seconds'],'speech_alignment':'per-sentence measured WAV durations'}
  (REPORT/f'media-{slug}.json').write_text(json.dumps(row,ensure_ascii=False,indent=2)+'\n');print(json.dumps(row,ensure_ascii=False),flush=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
 def handle(self):
  try:super().handle()
  except (ConnectionResetError,BrokenPipeError):pass

def browser(weeks):
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(headless=True,args=['--autoplay-policy=no-user-gesture-required'])
   for profile,width in [('desktop',1365),('mobile',390)]:
    context=b.new_context(viewport={'width':width,'height':844});page=context.new_page()
    # Keep tests local/offline and never submit real student tracking data.
    page.route('**/*',lambda route:route.continue_() if route.request.url.startswith('http://127.0.0.1:') else route.abort())
    for w in weeks:
     slug,folder,mp4,data=package(w);path=next((ROOT/'s1/semester1_lessons').glob(f'{slug}_*.html')).relative_to(ROOT)
     page.goto(f'http://127.0.0.1:{server.server_port}/{path}#video',wait_until='load');v=page.locator('video');assert v.count()==1;v.scroll_into_view_if_needed()
     for x in ['read','vocab','g1','g2','g3','g4','g5','write']:assert page.locator('#'+x).count()==1
     assert page.locator('.nav a[href="#video"]').count()==1
     page.evaluate('const v=document.querySelector("video");v.muted=true;v.textTracks[0].mode="showing";v.play()')
     page.wait_for_function('document.querySelector("video").currentTime>.4 && document.querySelector("video").textTracks[0].cues?.length===9',timeout=25000)
     result=page.evaluate('()=>{const v=document.querySelector("video"),r=v.getBoundingClientRect();return {width:v.videoWidth,height:v.videoHeight,left:r.left,right:r.right,paused:v.paused,doc:document.documentElement.scrollWidth,progress:v.currentTime,cues:[...v.textTracks[0].cues].map(c=>c.text)}}')
     assert result['width']==1280 and result['height']==720 and not result['paused'];assert result['left']>=-2 and result['right']<=width+2 and result['doc']<=width+2,result
     assert [c.replace('\n','') for c in result['cues']]==[s for s,f in CONTENT[w][1]]
     page.evaluate('document.querySelector("video").pause();document.querySelector("video").currentTime=3');page.wait_for_function('!document.querySelector("video").seeking')
     # Native player receives keyboard focus; game score and selected options must not change.
     v.focus();page.keyboard.press('Space');page.wait_for_timeout(350)
     assert page.locator('#totalPts').inner_text()=='0'
     page.locator('#video').screenshot(path=str(REPORT/f'{profile}-{slug}.png'))
     answers={1:0,2:1,3:0,4:0,5:1,10:0,11:0,12:0,13:1,14:0,15:0,16:1,17:0};page.locator('.animation-options button').nth(answers[w]).click();assert '答對了' in page.locator('.animation-feedback').inner_text()
     page.locator('.animation-options button').nth(1-answers[w]).click();assert '再試一次' in page.locator('.animation-feedback').inner_text()
     page.evaluate('const v=document.querySelector("video");v.pause();v.currentTime=v.duration-.4');page.wait_for_function('!document.querySelector("video").seeking && document.querySelector("video").readyState>=2')
     row={'week':w,'profile':profile,'mp4_sha256':sha(mp4),'html_sha256':sha(ROOT/path),'enhancement_sha256':sha(ROOT/'s1/semester1_lessons/remaining_animations.js'),'playback':'passed','vtt_cues':9,'subtitle_text':'exact narration','correct_and_wrong_feedback':'passed','ending_seek':'passed','viewport_fit':'passed','existing_lessons_games_write':'preserved','media_keyboard_score_isolation':'passed','rect':{k:result[k] for k in ['left','right','doc','progress']}}
     (REPORT/f'browser-{profile}-{slug}.json').write_text(json.dumps(row,indent=2)+'\n');print(json.dumps(row),flush=True)
    context.close()
   b.close()
 finally:server.shutdown()

def aggregate():
 media_rows=[json.loads((REPORT/f'media-w{w:02}.json').read_text()) for w in sorted(EXPECTED)]
 browser_rows=[json.loads((REPORT/f'browser-{p}-w{w:02}.json').read_text()) for p in ['desktop','mobile'] for w in sorted(EXPECTED)]
 assert len(media_rows)==13 and {r['week'] for r in media_rows}==EXPECTED
 assert len(browser_rows)==26 and {(r['week'],r['profile']) for r in browser_rows}=={(w,p) for w in EXPECTED for p in ['desktop','mobile']}
 for r in media_rows:
  slug,folder,mp4,data=package(r['week']);assert r['sha256']==sha(mp4)
 for r in browser_rows:
  slug,folder,mp4,data=package(r['week']);p=next((ROOT/'s1/semester1_lessons').glob(f'{slug}_*.html'))
  assert r['mp4_sha256']==sha(mp4) and r['html_sha256']==sha(p) and r['enhancement_sha256']==sha(ROOT/'s1/semester1_lessons/remaining_animations.js')
 for w in [6,7,8]:
  p=next((ROOT/'s1/semester1_lessons').glob(f'w{w:02}_*.html'));assert p.read_bytes()==subprocess.check_output(['git','show','origin/master:'+str(p.relative_to(ROOT))],cwd=ROOT)
 p=ROOT/'s1/semester1_lessons/lesson_engine.js';assert p.read_bytes()==subprocess.check_output(['git','show','origin/master:'+str(p.relative_to(ROOT))],cwd=ROOT)
 for w in EXPECTED:
  p=next((ROOT/'s1/semester1_lessons').glob(f'w{w:02}_*.html'));old=subprocess.check_output(['git','show','origin/master:'+str(p.relative_to(ROOT))],cwd=ROOT).decode()
  assert p.read_text().replace("<script src='remaining_animations.js'></script>\n",'')==old
 for name,rows in [('media',media_rows),('browser',browser_rows)]: (REPORT/f'{name}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 summary={'verified_media':len(media_rows),'verified_browser_keys':len(browser_rows),'original_W06_W07_W08':'byte-identical to origin/master','lesson_engine':'byte-identical to origin/master','original_target_html_content':'only one enhancement script added to each target','excluded_exam_weeks':[9,18],'total_mp4_bytes':sum(r['bytes'] for r in media_rows),'durations':{r['slug']:r['duration'] for r in media_rows}}
 (REPORT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False,indent=2))
if __name__=='__main__':
 mode=sys.argv[1];weeks=list(map(int,sys.argv[2:])) if len(sys.argv)>2 else sorted(EXPECTED)
 assert set(weeks)<=EXPECTED
 if mode=='media':media(weeks)
 elif mode=='browser':browser(weeks)
 elif mode=='aggregate':aggregate()
 else:raise SystemExit('media|browser|aggregate')
