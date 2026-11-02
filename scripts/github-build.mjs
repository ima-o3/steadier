// Use Git for Windows' existing GitHub login without printing/storing its token.
// This helper is read-only: it inspects runs and downloads their IPA artifacts.
import { spawnSync } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';

const [command='status',runId,jobId]=process.argv.slice(2);
if(!['status','jobs','logs','download'].includes(command)||!/^\d+$/.test(runId||'')){
  console.error('Usage: node scripts/github-build.mjs status|jobs|logs|download RUN_ID [JOB_OR_ARTIFACT_ID]');
  process.exit(1);
}
const credential=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});
if(credential.status!==0){console.error('Git for Windows has no available GitHub login. Sign in through Git Credential Manager first.');process.exit(1);}
const token=credential.stdout.split(/\r?\n/).find(line=>line.startsWith('password='))?.slice(9);
if(!token){console.error('No GitHub credential was returned.');process.exit(1);}
const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const api='https://api.github.com/repos/ima-o3/steadier';
async function request(endpoint){const response=await fetch(api+endpoint,{headers});if(!response.ok)throw new Error(`GitHub request failed (${response.status}).`);return response;}
try{
  if(command==='status'){const r=await(await request(`/actions/runs/${runId}`)).json();console.log(JSON.stringify({id:r.id,status:r.status,conclusion:r.conclusion,url:r.html_url,head:r.head_sha},null,2));}
  if(command==='jobs'){const r=await(await request(`/actions/runs/${runId}/jobs`)).json();console.log(JSON.stringify(r.jobs.map(j=>({id:j.id,name:j.name,status:j.status,conclusion:j.conclusion,steps:j.steps.map(s=>({name:s.name,status:s.status,conclusion:s.conclusion}))})),null,2));}
  if(command==='logs'){if(!/^\d+$/.test(jobId||''))throw new Error('Supply a numeric job ID.');const text=await(await request(`/actions/jobs/${jobId}/logs`)).text();console.log(text.split(/\r?\n/).slice(-160).join('\n'));}
  if(command==='download'){const r=await(await request(`/actions/runs/${runId}/artifacts`)).json();const artifact=r.artifacts.find(a=>a.name==='Steadier-unsigned-iphone'&&!a.expired);if(!artifact)throw new Error('No completed IPA artifact is available yet.');const response=await request(`/actions/artifacts/${artifact.id}/zip`);const folder=path.resolve('build','downloads');await mkdir(folder,{recursive:true});const target=path.join(folder,`Steadier-unsigned-iphone-${runId}.zip`);await writeFile(target,new Uint8Array(await response.arrayBuffer()));console.log(target);}
}catch(error){console.error(error.message.replaceAll(token,'[redacted]'));process.exitCode=1;}
