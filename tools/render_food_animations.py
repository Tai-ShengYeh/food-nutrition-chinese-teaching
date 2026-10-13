#!/usr/bin/env python3
"""Regenerate shared MP4 packages: Pillow + ffmpeg + Windows Hanhan TTS.
Run from any directory. Python: Pillow/fonttools; Windows System.Speech required.
"""
from pathlib import Path
import sys, json, math, subprocess, wave, os
from functools import lru_cache
from PIL import Image,ImageDraw,ImageFont
from food_animation_content import CONTENT
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]; ASSETS=ROOT/'s1/semester1_lessons/animations'
W,H,FPS=960,540,12
FONT=os.environ.get('BIO_FONT','/mnt/c/Windows/Fonts/msjh.ttc')
BLUE='#267e96'; RED='#ce6045'; INK='#193946'
@lru_cache(maxsize=32)
def font(n): return ImageFont.truetype(FONT,n)
LATIN=os.environ.get('BIO_LATIN_FONT','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
CJK_CMAP=TTFont(FONT,fontNumber=0).getBestCmap()
LATIN_CMAP=TTFont(LATIN).getBestCmap()
@lru_cache(maxsize=32)
def latin_font(n):return ImageFont.truetype(LATIN,n)
@lru_cache(maxsize=1024)
def text_runs(s,n):
 runs=[]
 for char in s:
  face=font(n) if ord(char)>=0x2E80 and ord(char) in CJK_CMAP else latin_font(n)
  assert ord(char) in CJK_CMAP or ord(char) in LATIN_CMAP or char.isspace(),char
  if runs and runs[-1][0] is face:runs[-1]=(face,runs[-1][1]+char)
  else:runs.append((face,char))
 return runs
def text(d,x,y,s,n=24,c=INK):
 runs=text_runs(s,n);start=x-sum(f.getlength(t) for f,t in runs)/2
 for f,t in runs:d.text((start,y),t,font=f,fill=c,anchor='lm');start+=f.getlength(t)
@lru_cache(maxsize=256)
def wrap(s,n=25,width=870):
 lines=['']
 for c in s:
  if font(n).getlength(lines[-1]+c)>width: lines.append('')
  lines[-1]+=c
 return '\n'.join(lines)
def ball(d,x,y,label='',color=BLUE,r=22):
 d.ellipse((x-r,y-r,x+r,y+r),fill=color);text(d,x,y,label,19,'white')
def arrow(d,a,b,c=BLUE):
 d.line((a,b),fill=c,width=4); ang=math.atan2(b[1]-a[1],b[0]-a[0]);d.polygon([b,(b[0]-14*math.cos(ang-.5),b[1]-14*math.sin(ang-.5)),(b[0]-14*math.cos(ang+.5),b[1]-14*math.sin(ang+.5))],fill=c)

def card(d,x,y,label,active=True):
 d.rounded_rectangle((x-125,y-35,x+125,y+35),14,fill='#dceff5' if active else 'white',outline=BLUE,width=3)
 text(d,x,y,label,23)
def fruit(d,x,y,r=35):
 d.ellipse((x-r,y-r,x+r,y+r),fill='#ef9c36',outline='#b96916',width=3)
 d.ellipse((x+2,y-r-15,x+30,y-r+2),fill='#73a25a')
def cup(d,x,y,label,water=False):
 d.polygon([(x-42,y-60),(x+42,y-60),(x+32,y+65),(x-32,y+65)],fill='#b5dfef' if water else '#edbd7c',outline=BLUE,width=3)
 text(d,x,y+95,label,23)
def diagram(d,w,s,p,t):
 if w==6:
  if s in (0,1):
   text(d,260,175,'台灣',25);text(d,700,175,'越南',25)
   for x in (200,330,640,770):fruit(d,x,260+8*math.sin(t+x),38)
   text(d,480,365,'當季：看產季，不只看國家',28)
   for i,label in enumerate(['冬','春','夏','秋']):card(d,150+i*220,420,label,i==int(t)%4)
  elif s in (2,3,4,5):
   text(d,480,155,'每 100 克水果的維生素 C（毫克）',25)
   for j,(label,v) in enumerate([('柳橙',50),('芒果',25),('鳳梨',12),('山竹',5)]):
    y=202+j*48;text(d,115,y,label,23);d.rounded_rectangle((185,y-14,185+v*11*min(1,.3+p),y+14),5,fill='#ef9c36');text(d,800,y,str(v),24)
   text(d,480,414,'課文約略值；不是所有品種的固定數字',20)
  elif s==6:
   fruit(d,270,245);fruit(d,690,245);text(d,480,345,'台灣和越南 都 有芒果。',30);text(d,480,405,'都：說相同點',25)
  elif s==7:
   for j,label in enumerate(['先 掂重量','再 看表皮','最後 聞香味']):
    x=175+j*305;fruit(d,x,250+10*math.sin(t+j));card(d,x,360,label,p>(j/3))
   text(d,480,420,'避免發霉、破損的水果',23)
  else:
   card(d,480,215,'比：說不同點');card(d,480,310,'都：說相同點');text(d,480,410,'寫兩句，說出證據',28)
 elif w==7:
  if s in (0,1,6):
   fruit(d,175,260+5*math.sin(t));cup(d,480,260,'100% 果汁');cup(d,780,260,'白開水',True)
   for j in range(7):d.rectangle((445+j%3*23,220+j//3*25,458+j%3*23,233+j//3*25),fill='white',outline='#ab8035')
   text(d,480,155,'沒有加糖，不等於完全無糖',27)
  elif s in (2,3,4):
   arrow(d,(150,270),(825,270));x=150+p*675;ball(d,x,270,'', '#ef9c36',16)
   text(d,150,220,'小時候',24);text(d,810,220,'長大後',24);text(d,480,345,'追蹤 25 年：一直注意、一直記錄',27)
   text(d,480,405,'相關 ≠ 一定造成' if s==4 else '用前後句，猜詞義',25)
  elif s==5:
   fruit(d,230,260,55);cup(d,710,260,'果汁')
   for j in range(7):d.arc((190+j*5,225,235+j*5,295),80,280,fill='#548b49',width=3)
   text(d,240,370,'水果：保留纖維、需要咀嚼',22);text(d,710,405,'果汁：通常纖維較少',23)
   text(d,480,155,'切塊水果也可以保留纖維',26)
  else:
   card(d,270,225,'我覺得：說意見');card(d,690,225,'因為：說理由');arrow(d,(395,225),(560,225))
   text(d,480,325,'我覺得口渴時喝白開水比較好，',27);text(d,480,380,'因為白開水沒有糖。',27)
 else:
  if s in (0,1,2,3):
   text(d,260,165,'台灣早餐',26);text(d,710,165,'越南早餐',26)
   d.ellipse((110,230,410,330),fill='#f4dba1',outline='#c38845',width=3)
   for j in range(4):d.line((160+j*45,235,160+j*45,325),fill='#c38845',width=3)
   d.arc((570,190,850,350),0,180,fill=BLUE,width=6)
   for j in range(6):d.arc((595+j*15,230,720+j*15,290),180,350,fill='#d9b76c',width=3)
   text(d,260,365,'蛋餅、燒餅、豆漿',23);text(d,710,365,'河粉、麵包夾蛋',23);text(d,480,415,'各有特色，不是排名',25)
   ball(d,480+25*math.sin(t),270,'',BLUE,8)
  else:
   labels=['先 洗臉','再 吃早餐','最後 去上課'] if s!=6 else ['先 選主食','再 蛋／豆製品','最後 無糖飲料']
   for j,label in enumerate(labels):
    x=175+j*305;card(d,x,250,label,p>j/3);text(d,x,320,str(j+1),32,BLUE)
    if j<2:arrow(d,(x+130,250),(x+170,250))
   ball(d,125+p*700,365,'', '#ef9c36',13);text(d,480,414,'用順序詞，把三個步驟連起來',26)
def frame(data,i,p,t,caption):
 im=Image.new('RGB',(960,540),'#f4fafc');d=ImageDraw.Draw(im)
 text(d,480,28,f"食品營養華語 W{int(data['week'][1:]):02} · 中文 A2",22,BLUE)
 text(d,480,75,data['title'],28);text(d,480,115,data['key_terms'][i%3],20,BLUE)
 diagram(d,int(data['week'][1:]),i,p,t)
 d.rounded_rectangle((25,452,935,532),12,fill='white',outline='#c5dce3',width=2)
 d.multiline_text((480,492),wrap(caption,23,875),font=font(23),fill=INK,anchor='mm',align='center',spacing=4)
 return im.resize((1280,720),Image.Resampling.LANCZOS)
def stamp(t,sep=','):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}{sep}{n%1000:03}'
def render(w):
 title,terms,speech=CONTENT[w];slug=f'w{w:02}';out=ASSETS/slug;out.mkdir(parents=True,exist_ok=True);cache=out/'.render-cache';cache.mkdir(exist_ok=True)
 data={'week':slug.upper(),'title':title,'key_terms':terms,'sources':[str(next((ROOT/'s1/semester1_lessons').glob(slug+'_*.html')).relative_to(ROOT))],'simplification':'語文與營養概念示意；W06數字引用課文約略值，不代表所有品種','scenes':[{'speech':s} for s in speech]}
 (out/'storyboard.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 ps=ASSETS/'make_narration.ps1';p=subprocess.check_output(['wslpath','-w',str(ps)],text=True).strip();folder=subprocess.check_output(['wslpath','-w',str(out)],text=True).strip()
 subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',p,'-Folder',folder],check=True,capture_output=True)
 durations=[]
 with wave.open(str(cache/'speech-000.wav'),'rb') as f: params=f.getparams()
 with wave.open(str(cache/'narration.wav'),'wb') as f:
  f.setparams(params)
  for i in range(len(speech)):
   with wave.open(str(cache/f'speech-{i:03}.wav'),'rb') as a:durations.append(a.getnframes()/a.getframerate());f.writeframes(a.readframes(a.getnframes()))
 cues=[];start=0
 for s,dur in zip(speech,durations):cues.append({'start':start,'end':start+dur,'text':s});start+=dur
 total=math.ceil((start+2)*FPS)/FPS;data['timing']={'speech_seconds':start,'video_seconds':total,'cues':cues}
 (out/'storyboard.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 for ext,sep in [('srt',','),('vtt','.')]:
  lines=['WEBVTT',''] if ext=='vtt' else []
  for i,c in enumerate(cues,1):lines += [str(i),stamp(c['start'],sep)+' --> '+stamp(c['end'],sep),wrap(c['text']),'']
  (out/f'{slug}_animation.{ext}').write_text('\n'.join(lines)+'\n')
 frame(data,0,.5,1,speech[0]).save(out/'poster.jpg',quality=88)
 command=['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r',str(FPS),'-i','pipe:0','-i',str(cache/'narration.wav'),'-af','apad','-t',str(total),'-c:v','libx264','-preset','veryfast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','80k','-movflags','+faststart',str(out/f'{slug}_animation.mp4')]
 proc=subprocess.Popen(command,stdin=subprocess.PIPE)
 try:
  i=0
  for f in range(round(total*FPS)):
   t=f/FPS
   while i<len(cues)-1 and t>=cues[i]['end']:i+=1
   c=cues[i];p=min(1,max(0,(t-c['start'])/(c['end']-c['start'])))
   proc.stdin.write(frame(data,i,p,t,c['text']).tobytes())
 finally:proc.stdin.close()
 assert proc.wait()==0;print(slug,total,flush=True)
 return {'week':slug,'duration':total,'path':str(out.relative_to(ROOT))}
if __name__=='__main__':
 results=[]
 for w in (list(map(int,sys.argv[1:])) if len(sys.argv)>1 else CONTENT):
  results.append(render(w));(ASSETS/'render-results.json').write_text(json.dumps(results,indent=2)+'\n')