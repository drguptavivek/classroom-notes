import { env } from '../../runtime';
import { getUser } from '../../auth';
import { questionsFor,validateQuestions,validateAnswers,answersFor,publicQuestion } from '../../model';
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const ownerActions=['list','create','update','close','reopen','activate','deactivate','reveal','hide','duplicate','delete','clear'];
const mutationActions=ownerActions.filter(a=>a!=='list'&&a!=='create');
export async function POST(req:Request){
try{
if(Number(req.headers.get('content-length')||0)>200000)return json({error:'Request is too large.'},413);
const b:any=await req.json(),user=await getUser(),db=env.DB,code=String(b.code||'').trim().toUpperCase(),owner=!!user;
if((ownerActions.includes(b.action)||b.manage)&&!owner)return json({error:'Sign in with Google to manage exercises.'},403);
if(b.action==='list'){
 const rows=(await db.prepare('SELECT e.*, (SELECT COUNT(*) FROM responses r WHERE r.code=e.code) AS count FROM exercises e WHERE e.owner_user_id=? ORDER BY created DESC').bind(user!.userId).all()).results;
 return json({exercises:rows.map((e:any)=>({code:e.code,title:e.title,open:!!e.open,active:!!e.active,revealed:!!e.revealed,created:e.created,count:e.count,questionCount:questionsFor(e).length}))});
}
if(b.action==='create'){
 const title=String(b.title||'').trim();if(!title||title.length>120)return json({error:'Enter an exercise title (up to 120 characters).'},400);
 const qs=validateQuestions(b.questions||[{id:'legacy',text:b.prompt,type:'text',required:true,options:[]}]);const newCode=crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),active=b.active!==false;
 await db.prepare('INSERT INTO exercises (code,title,prompt,admin_hash,open,revealed,created,questions,active,revision,owner_user_id) VALUES (?,?,?,?,?,0,?,?,?,1,?)').bind(newCode,title,qs[0].text,'',active?1:0,new Date().toISOString(),JSON.stringify(qs),active?1:0,user!.userId).run();return json({code:newCode});
}
const e:any=await db.prepare('SELECT * FROM exercises WHERE code=?').bind(code).first();if(!e)return json({error:'Exercise not found. Check the entry code.'},404);
const isExerciseOwner=!!user&&e.owner_user_id===user.userId,isAdmin=isExerciseOwner&&b.manage===true,qs=questionsFor(e);
if(mutationActions.includes(b.action)&&!isExerciseOwner)return json({error:'Only the teacher who created this exercise can manage it.'},403);
if(b.action==='update'){
 const title=String(b.title||'').trim();if(!title||title.length>120)return json({error:'Enter an exercise title (up to 120 characters).'},400);const next=validateQuestions(b.questions);
 const r=await db.prepare('UPDATE exercises SET title=?,prompt=?,questions=?,revision=revision+1,revealed=0 WHERE code=? AND open=0 AND NOT EXISTS (SELECT 1 FROM responses WHERE code=?)').bind(title,next[0].text,JSON.stringify(next),code,code).run();
 if(!r.meta.changes)return json({error:'Close submissions and clear responses before editing questions, or duplicate the exercise.'},409);return json({ok:true});
}
if(b.action==='duplicate'){
 const newCode=crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();await db.prepare('INSERT INTO exercises (code,title,prompt,admin_hash,open,revealed,created,questions,active,revision,owner_user_id) VALUES (?,?,?,?,0,0,?,?,0,1,?)').bind(newCode,(e.title+' (copy)').slice(0,120),e.prompt,'',new Date().toISOString(),JSON.stringify(qs),user!.userId).run();return json({code:newCode});
}
if(b.action==='delete'||b.action==='clear'){
 if(b.confirm!==code)return json({error:'Confirm the exercise code before deleting data.'},400);
 if(b.action==='delete')await db.batch([db.prepare('DELETE FROM responses WHERE code=?').bind(code),db.prepare('DELETE FROM exercises WHERE code=?').bind(code),db.prepare('DELETE FROM settings WHERE key=?').bind('analysis:'+code)]);
 else await db.batch([db.prepare('DELETE FROM responses WHERE code=?').bind(code),db.prepare('UPDATE exercises SET revision=revision+1,open=0,revealed=0 WHERE code=?').bind(code),db.prepare('DELETE FROM settings WHERE key=?').bind('analysis:'+code)]);
 return json({ok:true});
}
if(['close','reopen','activate','deactivate','reveal','hide'].includes(b.action)){
 const statements:Record<string,string>={close:'UPDATE exercises SET open=0 WHERE code=?',reopen:'UPDATE exercises SET open=1,active=1,revealed=0 WHERE code=?',activate:'UPDATE exercises SET active=1,open=1,revealed=0 WHERE code=?',deactivate:'UPDATE exercises SET active=0,open=0,revealed=0 WHERE code=?',reveal:'UPDATE exercises SET revealed=1 WHERE code=? AND open=0 AND active=1',hide:'UPDATE exercises SET revealed=0 WHERE code=?'};
 const r=await db.prepare(statements[b.action]).bind(code).run();if(b.action==='reveal'&&!r.meta.changes)return json({error:'Activate the exercise and close submissions before revealing responses.'},400);return json({ok:true});
}
if(!e.active&&!isAdmin)return json({error:'This exercise is inactive. Please wait for your teacher to activate it.'},403);
if(b.action==='submit'){
 const id=String(b.id||'');if(!/^[a-f0-9-]{36}$/.test(id))return json({error:'Invalid submission identifier.'},400);
 if(b.revision!==e.revision)return json({error:'This exercise has changed. Reload it before submitting.'},409);
 const answers=validateAnswers(qs,b.answers||(qs[0].id==='legacy'?{legacy:b.body}:null));
 const r=await db.prepare('INSERT OR IGNORE INTO responses (id,code,body,created,answers) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM exercises WHERE code=? AND open=1 AND active=1 AND revision=?)').bind(id,code,qs[0].id==='legacy'?String(answers.legacy||''):'',new Date().toISOString(),JSON.stringify(answers),code,e.revision).run();
 if(!r.meta.changes){const prior:any=await db.prepare('SELECT code FROM responses WHERE id=?').bind(id).first();if(prior?.code===code)return json({ok:true});return json({error:'Submissions are closed or the exercise has changed.'},409);}return json({ok:true});
}
if(b.action&&b.action!=='get')return json({error:'Unsupported action.'},400);
const count:any=await db.prepare('SELECT COUNT(*) AS n FROM responses WHERE code=?').bind(code).first();
const revealed=!!e.revealed&&!e.open;const rows=isAdmin||revealed?(await db.prepare('SELECT id,body,answers,created FROM responses WHERE code=? ORDER BY created,id').bind(code).all()).results:[];
return json({exercise:{code,title:e.title,prompt:e.prompt,open:!!e.open,active:!!e.active,revealed,revision:e.revision,questions:qs.map(q=>publicQuestion(q,isAdmin||revealed)),created:e.created},count:count.n,responses:rows.map((r:any)=>({id:r.id,created:r.created,answers:answersFor(r)})),isAdmin});
}catch(err){return json({error:err instanceof Error&&!(err.message.includes('D1')||err.message.includes('SQL'))?err.message:'Unable to complete the request. Please try again.'},400);}
}
