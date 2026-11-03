import argparse,json,re,sys,hashlib
from pathlib import Path
parser=argparse.ArgumentParser(description='Build proposed service evidence from private validated packets. Never exports recipe methods.')
parser.add_argument('--source',required=True);parser.add_argument('--catalog',required=True);parser.add_argument('--pdf-runtime',required=True);parser.add_argument('--output',required=True);parser.add_argument('--audit',required=True);parser.add_argument('--ra-output',required=True)
a=parser.parse_args();sys.path.insert(0,a.pdf_runtime);import pymupdf
root=Path(a.source);catalog=json.loads(Path(a.catalog).read_text(encoding='utf-8-sig'))['rows']
def norm(v):return re.sub(r'\s+',' ',str(v or '').strip().lower())
def menu(v):
 v=re.sub(r'^amz(?:\+ra)?:\s*','',norm(v))
 return {'paninoteca':'paninioteca','harvest co.':'harvest co'}.get(v,v)
identities={(str(r.get('mrn','')),menu(r['menu']),norm(r.get('portion'))) for r in catalog}
records=[];ra=[];audit=[]
for path in sorted((root/'MANIFESTS').glob('*.json')):
 b=json.loads(path.read_text(encoding='utf-8-sig'))
 if '+RA' in b.get('menuRaw',''):ra.append(b['menu'])
 if not b.get('validated'):
  audit.extend(dict(menu=b['menuRaw'],mrn=r['mrn'],portion=r['portion'],status='Source validation pending') for r in b['recipes']);continue
 variants={r['variantKey']:r for r in b['recipes']}
 def leaves(r,seen=None):
  seen=set(seen or [])
  if r['variantKey'] in seen:return []
  seen.add(r['variantKey']);result=[]
  for i in r['ingredients']:
   if i['kind']=='ingredient':result.append(i['name'])
   elif i['kind']=='subrecipe':
    for k in i.get('childVariantKeys',[]):
     if k in variants:result+=leaves(variants[k],seen)
  return result
 pdf=root/'PDFS'/f'{path.stem}.pdf';doc=pymupdf.open(pdf)
 for r in b['recipes']:
  ingredients=leaves(r)
  text=' '.join(doc[p-1].get_text() for p in r['sourcePages'])
  # Explicit serving phrases only; generic cooking temperatures do not establish service placement.
  phrases=[]
  for match in re.finditer(r'\bserv(?:e|ed)\s+(?:it\s+|the\s+\w+\s+)?(hot|warm|cold|chilled)\b',text,re.I):
   context=re.split(r'[.!?]',text[max(0,match.start()-45):match.start()])[-1]
   if not re.search(r'\b(no|not|never)\b',context,re.I):
    phrases.append(match[1])
    alternative=re.match(r'\s*(?:or|/)\s*(hot|warm|cold|chilled)\b',text[match.end():],re.I)
    if alternative:phrases.append(alternative[1])
  placements=sorted(set('Hot' if t.lower() in ['hot','warm'] else 'Cold' for t in phrases))
  tcs=any(re.search(r'chicken|turkey|beef|pork|fish|salmon|shrimp|cream|cheese|yogurt|egg|rice|noodle|pasta|tofu|milk|melon|tomato|lettuce|spinach',n,re.I) for n in ingredients)
  linked=(r['mrn'],menu(b['menuRaw']),norm(r['portion'])) in identities
  audit.append(dict(menu=b['menuRaw'],mrn=r['mrn'],portion=r['portion'],sourceSha256=b['sha256'],sourcePages=r['sourcePages'],explicitPlacement=placements,temperatureControlCandidate=tcs,catalogExactLink=linked,status='Proposed; private recipe reviewed by extraction rules'))
  if linked:records.append(dict(mrn=r['mrn'],menu=b['menuRaw'],portion=r['portion'],sourceSha256=b['sha256'],temperatureControlled=tcs,placements=placements,ingredientKeys=sorted(set(hashlib.sha256(norm(n).encode()).hexdigest()[:20] for n in ingredients if not re.search(r'^(?:tap water|water|kosher salt|salt|granulated sugar|(?:ground |whole )?black pepper|(?:canola|vegetable|corn|soybean)(?: cooking| frying)? oil)(?:,|$)',n,re.I)))))
 doc.close()
Path(a.output).write_text(json.dumps({'records':records},separators=(',',':')),encoding='utf-8')
Path(a.ra_output).write_text(json.dumps(sorted(set(ra))),encoding='utf-8')
Path(a.audit).write_text(json.dumps({'recipeOccurrences':len(audit),'linkedEvidenceVariants':len(records),'catalogRows':len(catalog),'records':audit},indent=2),encoding='utf-8')
print(json.dumps({'recipeOccurrencesAudited':len(audit),'linkedEvidenceVariants':len(records),'catalogRows':len(catalog),'RAconcepts':len(set(ra))}))
