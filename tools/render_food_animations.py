#!/usr/bin/env python3
"""Reproducible narrated pencil-style lessons. Pillow/fonttools, ffmpeg, Windows Hanhan TTS.
Original W06–08 reference videos inform paper/ink palette and scene grammar, not copied art.
Run: python tools/render_food_animations.py 1 2 ... (default: all remaining weeks).
"""
from pathlib import Path
import sys,json,math,subprocess,wave,os,re,random
from functools import lru_cache
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from fontTools.ttLib import TTFont
from food_animation_content import CONTENT
ROOT=Path(__file__).resolve().parents[1]; ASSETS=ROOT/'s1/semester1_lessons/animations'
FPS=6; W,H=1280,720
FONT=os.environ.get('FOOD_FONT','/mnt/c/Windows/Fonts/msjh.ttc');LATIN=os.environ.get('FOOD_LATIN_FONT','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
INK='#51463d';RED='#b9755e';BLUE='#87abb6';GREEN='#96aa8d';PAPER='#f4eee3';GOLD='#d7b77e'
CJK=TTFont(FONT,fontNumber=0).getBestCmap() or {};LAT=TTFont(LATIN).getBestCmap() or {}
@lru_cache(maxsize=64)
def font(n,latin=False):return ImageFont.truetype(LATIN if latin else FONT,n)
@lru_cache(maxsize=2048)
def runs(s,n):
 r=[]
 for c in s:
  use=ord(c)<0x2e80 or ord(c) not in CJK
  assert c.isspace() or ord(c) in CJK or ord(c) in LAT,c
  f=font(n,use)
  if r and r[-1][0] is f:r[-1]=(f,r[-1][1]+c)
  else:r.append((f,c))
 return r
@lru_cache(maxsize=2048)
def width(s,n):return sum(f.getlength(t) for f,t in runs(s,n))
@lru_cache(maxsize=2048)
def wrap(s,n=25,maxw=860):
 lines=['']
 for c in s:
  if width(lines[-1]+c,n)>maxw:lines.append('')
  lines[-1]+=c
 return lines

def text(d,x,y,s,n=26,c=INK,maxw=900):
 while width(s,n)>maxw and n>16:n-=1
 start=x-width(s,n)/2
 for f,t in runs(s,n):d.text((start,y),t,font=f,fill=c,anchor='lm');start+=f.getlength(t)

def line(d,pts,c=INK,w=2):
 d.line(pts,fill=c,width=w,joint='curve')
 # fine offset ink stroke makes deliberate sketch contours
 d.line([(x+.8,y-.6) for x,y in pts],fill=c,width=1)
def ellipse(d,b,fill=PAPER):
 d.ellipse(b,fill=fill,outline=INK,width=2);d.arc((b[0]+2,b[1]-1,b[2]+1,b[3]-2),20,270,fill=INK,width=1)
def box(d,b,fill=PAPER):
 d.rectangle(b,fill=fill,outline=INK,width=2);line(d,[(b[0]+2,b[3]+2),(b[2]-1,b[3]+1)],w=1)
def arrow(d,a,b):
 line(d,[a,b],RED);ang=math.atan2(b[1]-a[1],b[0]-a[0]);line(d,[(b[0]-12*math.cos(ang-.45),b[1]-12*math.sin(ang-.45)),b,(b[0]-12*math.cos(ang+.45),b[1]-12*math.sin(ang+.45))],RED)

def fruit(d,x,y,kind='tomato',r=35):
 color={'tomato':RED,'banana':GOLD,'grape':'#aaa0b0','sweet':'#c49675','leaf':GREEN,'beet':'#a77687'}.get(kind,RED)
 if kind=='leaf':
  for j in range(3):ellipse(d,(x-38+j*16,y-45,x+j*16,y+20),GREEN)
  line(d,[(x,y+40),(x,y-18)],GREEN,3)
 elif kind=='grape':
  for j in range(3):
   for k in range(3-j):ellipse(d,(x-30+k*22+j*12,y-25+j*20,x-5+k*22+j*12,y+j*20),color)
 elif kind=='banana':
  d.arc((x-r,y-r,x+r,y+r),15,165,fill=INK,width=18);d.arc((x-r,y-r,x+r,y+r),15,165,fill=GOLD,width=14)
 elif kind=='sweet':
  ellipse(d,(x-r*1.6,y-r*.65,x+r*1.6,y+r*.65),color)
  for j in range(4):line(d,[(x-r+j*20,y-6),(x-r+j*20+5,y+6)],INK,1)
 elif kind=='beet':
  ellipse(d,(x-r,y-r,x+r,y+r),color);line(d,[(x,y+r),(x+9,y+r+25),(x+3,y+r+34)])
  for j in range(3):ellipse(d,(x-20+j*12,y-r-35,x-4+j*12,y-r+3),GREEN)
 else:
  ellipse(d,(x-r,y-r,x+r,y+r),color);line(d,[(x,y-r),(x+7,y-r-16)],GREEN,3);ellipse(d,(x+4,y-r-20,x+27,y-r-7),GREEN)

def bowl(d,x,y,label='米飯',kind='rice'):
 ellipse(d,(x-70,y-12,x+70,y+40),'#e8dfce');d.arc((x-70,y-22,x+70,y+75),0,180,fill=INK,width=3)
 if kind=='rice':
  for j in range(12):line(d,[(x-45+j%6*17,y+j//6*12),(x-39+j%6*17,y-4+j//6*12)],INK,1)
 elif kind=='egg':ellipse(d,(x-45,y-12,x+45,y+28),'#fbf7ed');ellipse(d,(x-15,y-2,x+15,y+25),GOLD)
 elif kind=='yogurt':text(d,x,y+6,'優格',22)
 text(d,x,y+75,label,23)

def cup(d,x,y,label='牛奶',color='#eee9df'):
 line(d,[(x-35,y-45),(x-28,y+45),(x+28,y+45),(x+35,y-45),(x-35,y-45)])
 d.polygon([(x-31,y-25),(x+31,y-25),(x+25,y+40),(x-25,y+40)],fill=color);line(d,[(x+5,y-40),(x+14,y-75)],INK,2);text(d,x,y+72,label,22)

def person(d,x,y,walk=False):
 ellipse(d,(x-13,y-75,x+13,y-49));line(d,[(x,y-48),(x,y+3)]);line(d,[(x-27,y-20),(x,y-35),(x+27,y-20)]);line(d,[(x-25,y+48),(x,y+3),(x+23,y+48)])

def notebook(d,title,rows):
 box(d,(355,167,875,411),'#faf6ef')
 for y in range(192,410,43):line(d,[(378,y+27),(850,y+27)],'#ddd3c5',1)
 line(d,[(400,174),(400,405)],RED,1);text(d,625,188,title,22,RED,maxw=450)
 for i,s in enumerate(rows[:4]):text(d,630,243+i*45,s,24,maxw=430)

def shrimp(d,x,y):
 d.arc((x-60,y-35,x+50,y+50),20,290,fill=INK,width=24);d.arc((x-60,y-35,x+50,y+50),20,290,fill='#cb9780',width=20)
 for j in range(5):line(d,[(x-40+j*16,y-24),(x-42+j*16,y+8)],INK,1)
 ellipse(d,(x+22,y-8,x+50,y+16),'#cb9780');d.ellipse((x+40,y-3,x+44,y+1),fill=INK);line(d,[(x+44,y-5),(x+75,y-38)])

def stove(d,x,y,smoke=False):
 box(d,(x-80,y+20,x+80,y+65),'#ddd4c8');d.arc((x-75,y-30,x+75,y+35),0,180,fill=INK,width=4);line(d,[(x+70,y+5),(x+110,y-5)],INK,4)
 if smoke:
  for j in range(3):line(d,[(x-25+j*25,y-15),(x-32+j*25,y-40),(x-20+j*25,y-65)],'#a49787',2)

def stall(d,x,y,label,food='leaf'):
 box(d,(x-100,y-85,x+100,y+70),'#eee5d5')
 for j in range(5):d.polygon([(x-110+j*44,y-95),(x-66+j*44,y-95),(x-62+j*44,y-55),(x-114+j*44,y-55)],fill=RED if j%2==0 else '#e5d8bc',outline=INK)
 text(d,x,y-31,label,23)
 if food=='omelette':
  ellipse(d,(x-69,y-3,x+69,y+53),GOLD)
  for j in range(5):ellipse(d,(x-47+j*20,y+12,x-33+j*20,y+27),'#bbb6a2')
  for j in range(4):line(d,[(x-42+j*26,y+34),(x-31+j*26,y+37)],GREEN,4)
 elif food=='bun':
  for a in [x-42,x+36]:
   ellipse(d,(a-28,y+3,a+28,y+49),'#d8bc90')
   for j in range(3):line(d,[(a-13+j*11,y+14),(a-8+j*11,y+26)],INK,1)
 else:fruit(d,x-40,y+26,food,20);fruit(d,x+35,y+26,food,20)

def subject(d,w,s):
 # All compositions use a ground line and real objects, not slide-card substitutes.
 if w==1:
  for j,(label,col,size) in enumerate([('特砂','#eee8da',7),('細砂','#eee8da',3),('二砂','#c4a079',5)]):
   x=200+j*280
   for k in range(24):
    a=x-55+(k%8)*15;b=295-(k//8)*16;box(d,(a,b,a+size,b+size),col)
   text(d,x,345,label,28)
  if s in (0,1,4):text(d,480,198,'一樣是砂糖，到底差在哪？',30,RED);line(d,[(275,225),(690,225)],RED)
  else:cup(d,855,220,'甜湯',GOLD)
 elif w==2:
  if s in (3,4,5):
   person(d,190,272);text(d,190,365,'參加研究的大人',22)
   notebook(d,'課文研究', ['參加：74 位大人','時間：12 星期','體重沒有明顯變重','不是人人保證'])
   return
  for j in range(6):
   x=135+j%3*340;y=215+j//3*145
   if j==0:bowl(d,x,y,'全榖雜糧')
   elif j==1:fruit(d,x,y,'leaf');text(d,x,y+65,'蔬菜',23)
   elif j==2:fruit(d,x,y,'banana');text(d,x,y+65,'水果',23)
   elif j==3:bowl(d,x,y,'豆魚蛋肉','egg')
   elif j==4:cup(d,x,y,'乳品')
   else:cup(d,x,y,'油脂',GOLD)
 elif w==3:
  ellipse(d,(55,190,330,405),'#faf6ef');d.pieslice((65,200,320,395),90,270,fill=GREEN);d.pieslice((65,200,320,395),270,360,fill=GOLD);d.pieslice((65,200,320,395),0,90,fill='#d7a48d')
  fruit(d,120,270,'leaf',20);fruit(d,135,340,'tomato',20);text(d,260,250,'主食',20);text(d,255,340,'蛋白質',18)
  rows=['蔬果合起來佔一半','另搭配主食與蛋白質','適量搭配乳品與油脂','依個人需求調整份量'] if s<3 else ['兒少蔬果吃不夠','原因：喜歡零食','原因：準備覺得麻煩','做法：先裝蔬菜']
  notebook(d,'餐盤示意' if s<3 else '主題與細節',rows)
 elif w==4:
  if s in (3,4):
   fruit(d,190,285,'grape',50);text(d,190,372,'花青素：紅紫水果',23)
   fruit(d,480,285,'beet',40);text(d,480,372,'甜菜色素：甜菜根',23)
   ellipse(d,(731,266,789,302),RED)
   for j in range(3):line(d,[(733,271+j*10),(713,258+j*18)]);line(d,[(787,271+j*10),(807,258+j*18)])
   text(d,770,372,'胭脂蟲紅：昆蟲',23)
   text(d,480,420,'天然來源，也可能是昆蟲',24)
   return
  for x,kind,label in [(190,'tomato','紅：番茄'),(480,'leaf','綠：菠菜'),(770,'grape','紫：葡萄')]:fruit(d,x,275,kind,50);text(d,x,369,label,26)
 elif w==5:
  for x,col,label in [(235,GOLD,'57 號：黃肉、粉'),(715,'#d69668','66 號：紅橘肉、軟')]:
   fruit(d,x,260,'sweet',65);ellipse(d,(x-30,230,x+70,300),col);text(d,x,350,label,27)
  if s in (4,5):text(d,480,192,'找證據：顏色？口感？做法？',27,RED)
  else:text(d,235,409,'烤',26);text(d,715,409,'蒸',26)
 elif w==10:
  ellipse(d,(80,228,290,333),'#ddc69e');text(d,185,377,'麵團',24)
  for j in range(8):ellipse(d,(135+j%4*23,250+j//4*22,143+j%4*23,258+j//4*22),'#faf6ef')
  arrow(d,(315,280),(530,280));ellipse(d,(560,194,870,355),'#ddc69e');text(d,715,391,'產生氣體，慢慢變大',25)
  if s in (4,5):text(d,480,187,'控制發酵 ≠ 食物腐敗',29,RED)
 elif w==11:
  xs=[140,370,600,825]
  for j,x in enumerate(xs):
   if j<3:
    if j>0:box(d,(x-83,222,x+83,327),'#d9e8e9')
    shrimp(d,x,267)
    if j==2:ellipse(d,(x-69,217,x+67,321),'#d9e8e9');shrimp(d,x,267)
   else:box(d,(x-75,240,x+70,310),'#d9e8e9');ellipse(d,(x-50,303,x-20,333),INK);ellipse(d,(x+25,303,x+55,333),INK)
   text(d,x,375,['處理','冷凍','薄冰衣','低溫運送'][j],23)
   if j<3:arrow(d,(x+90,275),(xs[j+1]-95,275))
  if s in (4,5):text(d,480,190,'圈動詞，找順序',28,RED)
 elif w==12:
  cup(d,200,275,'藻藍素',BLUE);arrow(d,(275,275),(435,275))
  d.polygon([(490,258),(610,258),(550,372)],fill=GOLD,outline=INK);ellipse(d,(482,200,618,284),BLUE);text(d,550,408,'冰淇淋',23)
  if s in (2,3,4,5):
   line(d,[(745,320),(745,220)],RED,6);ellipse(d,(728,310,762,344),RED);text(d,765,375,'怕熱、怕酸',23);text(d,480,192,'主要：顏色不穩定',27,RED)
 elif w==13:
  box(d,(70,170,350,422),'#e2cfa6');text(d,210,220,'花生糖',34);ellipse(d,(115,273,172,315),GOLD);ellipse(d,(170,273,228,315),GOLD);ellipse(d,(225,273,282,315),GOLD);text(d,210,374,'練習包裝示意',18)
  notebook(d,'閱讀標示', ['品名：花生糖','成分：花生、糖','日期：查看年／月／日','原產地：台灣（示例）'])
  if s in (3,4,5):text(d,480,443,'100% 台灣花生：說花生的來源',23,RED)
 elif w==14:
  stove(d,225,295,True);line(d,[(125,185),(320,372)],RED,5)
  notebook(d,'先讀重點，不只看標題', ['驗出：檢查時發現','超標：超過規定標準','要看攝取量與時間','依官方通知處理'])
 elif w==15:
  stall(d,200,300,'蚵仔煎','omelette');stall(d,750,300,'胡椒餅','bun');person(d,470,324)
  if s in (2,3,4):text(d,480,177,'抓大意：小吃也記錄生活故事',29,RED)
 elif w==16:
  if s in (2,4,5):
   stall(d,195,300,'市場觀察','leaf')
   notebook(d,'比較表：用觀察當證據', ['相同：都賣新鮮食材','台灣例子：讀課文','越南例子：自己的觀察','不同：查開市時間'])
   return
  stall(d,195,300,'環南市場','leaf');stall(d,765,300,'家鄉市場','tomato');text(d,195,190,'台灣例子',26);text(d,765,190,'越南例子',26)
 elif w==17:
  fruit(d,155,280,'leaf',45);cup(d,365,280,'白開水',BLUE);person(d,595,305);text(d,595,396,'每天走路',24)
  ellipse(d,(765,237,845,317));line(d,[(805,277),(805,250)]);line(d,[(805,277),(831,277)]);text(d,805,396,'早點睡',24)
  if s in (2,3,4):text(d,480,180,'從文章找證據，從生活選做法',28,RED)

def base_frame(data,i):
 im=Image.new('RGB',(960,540),PAPER)
 # restrained diffuse washes seen in originals, with ample paper space
 wash=Image.new('RGBA',im.size);q=ImageDraw.Draw(wash)
 for b,c in [((-110,-90,260,85),(190,120,94,26)),((620,-80,940,105),(127,160,133,30)),((745,380,1050,560),(125,166,180,30))]:q.ellipse(b,fill=c)
 im=Image.alpha_composite(im.convert('RGBA'),wash.filter(ImageFilter.GaussianBlur(26))).convert('RGB');d=ImageDraw.Draw(im)
 text(d,480,27,f"食品營養華語寫作 I  ·  W{data['number']:02}  ·  中文 A2",18,RED)
 text(d,480,71,data['title'],30)
 text(d,480,113,data['key_terms'][i%3],19,maxw=880)
 if i<6:
  text(d,480,150,data['scenes'][i]['focus'],24,RED,maxw=870)
  subject(d,data['number'],i)
 else:
  # A drawn notebook, plus a subject object, models the actual writing task.
  w=data['number']
  if w in (1,13):
   box(d,(105,190,275,370),'#e2cfa6');text(d,190,240,'砂糖' if w==1 else '花生糖',27)
   line(d,[(105,207),(275,207)]);text(d,190,324,'包裝示意',18)
  elif w in (3,2):bowl(d,190,280)
  elif w in (4,5):fruit(d,190,285,'tomato' if w==4 else 'sweet',55)
  elif w==10:ellipse(d,(100,220,285,340),'#ddc69e');text(d,190,380,'麵包',23)
  elif w==11:shrimp(d,190,285)
  elif w==12:cup(d,190,280,'藻藍素',BLUE)
  elif w==14:stove(d,190,285)
  elif w in (15,16):stall(d,190,300,'蚵仔煎' if w==15 else '市場','omelette' if w==15 else 'leaf')
  else:person(d,190,300)
  rows=wrap(data['scenes'][i]['focus'],25,420)
  notebook(d,'練習寫作' if i<8 else '換你寫',rows)
  text(d,615,437,'讀課文 → 找證據 → 寫自己的句子',19,RED)
 line(d,[(55,453),(905,453)],'#a8977d',1)
 caption=data['scenes'][i]['speech'];lines=wrap(caption,23,875)
 assert len(lines)<=3,(data['week'],i,lines)
 y=479-(len(lines)-1)*13
 for l in lines:text(d,480,y,l,23);y+=27
 # sentence progress dots like small numbered sequence cues in original clips
 for j in range(9):ellipse(d,(400+j*20,529,406+j*20,535),RED if j==i else '#ded5c8')
 return im.resize((1280,720),Image.Resampling.LANCZOS)

def animated_subject(im,w,i,t,progress):
 """Small object motions/attention cues track the taught process, not random ornaments."""
 if i>=6:return
 overlay=Image.new('RGBA',(960,540));d=ImageDraw.Draw(overlay);ink=(185,117,94,180)
 if w==10 and i<3:
  # Gas bubbles rise inside the larger dough as the narration explains expansion.
  for j in range(7):
   x=610+j*32;y=335-((t*18+j*19)%105);d.ellipse((x-4,y-4,x+4,y+4),outline=(81,70,61,150),width=1)
 elif w==11:
  x=140+min(1,progress)*685;d.ellipse((x-6,339,x+6,351),fill=(135,171,182,220))
 elif w==13:
  row=[0,1,2,3,3,0][i];y=262+row*45;d.line((422,y,832,y),fill=ink,width=2)
 elif w==14:
  for j in range(3):
   y=257-(t*14+j*12)%63;x=200+j*22;d.line([(x,y+11),(x+4,y),(x-2,y-8)],fill=(164,151,135,130),width=2)
 else:
  locations={1:[(200,305),(480,305),(760,305)],2:[(135,245),(475,245),(815,245)],3:[(190,298)],4:[(190,285),(480,285),(770,285)],5:[(235,270),(715,270)],12:[(200,275),(550,275),(745,285)],15:[(200,326),(750,326)],16:[(195,327),(765,327)],17:[(155,280),(365,280),(595,285),(805,277)]}
  if w not in locations:return
  if w==2 and i>=3:return
  if w==16 and i in (2,4,5):return
  ls=locations[w];x,y=ls[min(len(ls)-1,int(progress*len(ls)))];r=49+3*math.sin(t*2)
  d.arc((x-r,y-r,x+r,y+r),30,310,fill=ink,width=2)
 im.paste(overlay.resize(im.size,Image.Resampling.LANCZOS),(0,0),overlay.resize(im.size,Image.Resampling.LANCZOS))

def stamp(t,sep=','):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}{sep}{n%1000:03}'

def lesson(w):
 p=next((ROOT/'s1/semester1_lessons').glob(f'w{w:02}_*.html'));s=p.read_text();match=re.search(r'const WEEK\s*=([\s\S]*?)</script>',s);assert match;src=match.group(0).replace('</script>','')
 d=json.loads(subprocess.check_output(['node','-e',src+';console.log(JSON.stringify(WEEK))'],text=True));return p,d

def render(w):
 title,scenes=CONTENT[w];p,lessondata=lesson(w);slug=f'w{w:02}';out=ASSETS/slug;out.mkdir(parents=True,exist_ok=True);cache=out/'.render-cache';cache.mkdir(exist_ok=True)
 terms=lessondata['vocab'][:3]
 data={'number':w,'week':slug.upper(),'title':title,'key_terms':[v['w']+' | '+v['py']+' | '+v['vn'] for v in terms],'sources':[str(p.relative_to(ROOT))],'reading_skill':lessondata['rSkill'],'writing_goal':lessondata['write']['goal'],'style_reference':'Original YouTube W06 HrXwF8WgQSc / W07 PH1PZgDCTFs / W08 Vb88oe_c1Qs; see reports/food-animations/style-reference.md','voice':'Microsoft Hanhan Desktop, zh-TW, rate -1','simplification':'課文概念示意；研究非個人保證；包裝與流程圖非實際產品；語文教學不取代個人營養或食品安全建議','scenes':[{'speech':s,'focus':f,'illustration':'subject objects with pencil reveal' if i<6 else 'subject object and writing notebook'} for i,(s,f) in enumerate(scenes)]}
 (out/'storyboard.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 ps=subprocess.check_output(['wslpath','-w',str(ASSETS/'make_narration.ps1')],text=True).strip();folder=subprocess.check_output(['wslpath','-w',str(out)],text=True).strip()
 subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',ps,'-Folder',folder],check=True,capture_output=True)
 durations=[]
 with wave.open(str(cache/'speech-000.wav'),'rb') as f:params=f.getparams()
 with wave.open(str(cache/'narration.wav'),'wb') as f:
  f.setparams(params)
  for i in range(len(scenes)):
   with wave.open(str(cache/f'speech-{i:03}.wav'),'rb') as a:durations.append(a.getnframes()/a.getframerate());f.writeframes(a.readframes(a.getnframes()))
 cues=[];start=0
 for (s,focus),dur in zip(scenes,durations):cues.append({'start':start,'end':start+dur,'text':s});start+=dur
 total=math.ceil((start+2)*FPS)/FPS;assert 60<=total<=125,(w,total)
 data['timing']={'speech_seconds':start,'video_seconds':total,'cues':cues}
 (out/'storyboard.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 for ext,sep in [('srt',','),('vtt','.')]:
  lines=['WEBVTT',''] if ext=='vtt' else []
  for i,c in enumerate(cues,1):lines += [str(i),stamp(c['start'],sep)+' --> '+stamp(c['end'],sep),'\n'.join(wrap(c['text'],25,860)),'']
  (out/f'{slug}_animation.{ext}').write_text('\n'.join(lines)+'\n')
 bases=[base_frame(data,i) for i in range(len(scenes))];bases[0].save(out/'poster.jpg',quality=92)
 cmd=['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r',str(FPS),'-i','pipe:0','-i',str(cache/'narration.wav'),'-af','apad','-t',str(total),'-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(out/f'{slug}_animation.mp4')]
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE);assert proc.stdin;i=0
 try:
  for k in range(round(total*FPS)):
   t=k/FPS
   while i<len(cues)-1 and t>=cues[i]['end']:i+=1
   local=t-cues[i]['start'];im=bases[i].copy();d=ImageDraw.Draw(im)
   # progressive whiteboard-style left-to-right ink reveal, with moving pencil tip
   if local<1.6:
    edge=round(85+local/1.6*1110);d.rectangle((edge,205,1220,580),fill=PAPER)
    d.line([(edge-18,585),(edge,563)],fill=INK,width=4);d.line([(edge,563),(edge+15,551)],fill=GOLD,width=8)
   else:
    animated_subject(im,w,i,local,min(1,local/(cues[i]['end']-cues[i]['start'])))
    d=ImageDraw.Draw(im)
    x=85+int(min(1,local/(cues[i]['end']-cues[i]['start']))*1110);d.line([(75,606),(x,606)],fill=RED,width=3)
   proc.stdin.write(im.tobytes())
 finally:proc.stdin.close()
 assert proc.wait()==0
 result={'week':slug,'duration':total,'path':str(out.relative_to(ROOT))}
 (out/'render-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result),flush=True)
 return result
if __name__=='__main__':
 for w in (list(map(int,sys.argv[1:])) if len(sys.argv)>1 else CONTENT):render(w)
