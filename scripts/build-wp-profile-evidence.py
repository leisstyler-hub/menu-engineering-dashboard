"""Extract a small, non-recipe candidate evidence index; never imports to Supabase."""
import csv, hashlib, io, json, sys
from pathlib import Path
source=Path(sys.argv[1])
raw=source.read_bytes()
expected='e09dde72cee28943e1093f4b78beca6a8bde963073525d45adf332ccca4e57b6'
assert hashlib.sha256(raw).hexdigest()==expected, 'Unexpected source revision'
rows=list(csv.reader(io.StringIO(raw.decode('cp1252'))))
headers=rows[0]
records=[]
for row in rows[1:]:
    if len(row)!=len(headers):continue
    r=dict(zip(headers,row))
    records.append({'mrn':r['Recipe Number'].removeprefix("'"),'rawMrn':r['Recipe Number'],
        'name':r['Recipe Name'],'menu':r['Menu Name'],'portion':r['Menu Portion Size'],
        'productionArea':r['Recipe Production Area.']})
target=Path(__file__).resolve().parents[1]/'src/data/wpProfileEvidence.json'
target.write_text(json.dumps({'sourceFile':source.name,'sourceSha256':expected,'status':'Candidate evidence; not imported','records':records},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(f'Extracted {len(records)} candidate memberships; no operational writes')
