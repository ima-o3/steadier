// Use Git for Windows' existing GitHub login without printing/storing its token.
// Inspects runs/downloads artifacts; dispatch explicitly starts a manual build.
import { spawnSync } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';

const [command='status',runId,jobId]=process.argv.slice(2);
if(!['dispatch','cancel','status','jobs','logs','progress','download'].includes(command)||(command!=='dispatch'&&!/^\d+$/.test(runId||''))){
  console.error('Usage: node scripts/github-build.mjs dispatch | status|jobs|logs|progress|download RUN_ID [JOB_ID or ARTIFACT_NAME]');
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
  if(command==='cancel'){
    const response=await fetch(api+`/actions/runs/${runId}/cancel`,{method:'POST',headers});
    if(!response.ok)throw new Error(`GitHub cancellation failed (${response.status}).`);
    console.log(`Canceled superseded build ${runId}.`);
  }
  if(command==='dispatch'){
    if(runId && !['simulator','device'].includes(runId)) throw new Error('Use dispatch, dispatch simulator, or dispatch device.');
    const response=await fetch(api+'/actions/workflows/ios-sideload.yml/dispatches',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{simulator_only:runId==='simulator',skip_simulator:runId==='device'}})});
    if(!response.ok)throw new Error(`GitHub dispatch failed (${response.status}).`);
    console.log(runId==='device'?'Started device-only iPhone build on main; reusing prior simulator validation.':'Started manual iPhone build on main.');
    const result=await(await request('/actions/workflows/ios-sideload.yml/runs?per_page=3')).json();
    console.log(JSON.stringify(result.workflow_runs.map(r=>({id:r.id,status:r.status,head:r.head_sha,url:r.html_url})),null,2));
  }
  if(command==='status'){const r=await(await request(`/actions/runs/${runId}`)).json();console.log(JSON.stringify({id:r.id,status:r.status,conclusion:r.conclusion,url:r.html_url,head:r.head_sha},null,2));}
  if(command==='jobs'){const r=await(await request(`/actions/runs/${runId}/jobs`)).json();console.log(JSON.stringify(r.jobs.map(j=>({id:j.id,name:j.name,status:j.status,conclusion:j.conclusion,steps:j.steps.map(s=>({name:s.name,status:s.status,conclusion:s.conclusion}))})),null,2));}
  if(command==='logs'||command==='progress'){if(!/^\d+$/.test(jobId||''))throw new Error('Supply a numeric job ID.');const text=await(await request(`/actions/jobs/${jobId}/logs`)).text();await mkdir('build/logs',{recursive:true});await writeFile(`build/logs/cloud-${runId}-${jobId}.log`,text);const lines=text.split(/\r?\n/);const selected=command==='logs'?lines.slice(-160):lines.filter(line=>/error:|\*\* BUILD|Process completed|Refusing|Verified SQLCipher|SwiftCompile|CompileC |SwiftEmitModule|^.*Z (Ld |Touch |Validate |CreateUniversalBinary )/.test(line)).slice(-12).map(line=>{const target=line.match(/in target '([^']+)'/);return target?`${line.slice(0,28)} ${line.match(/SwiftCompile|CompileC|SwiftEmitModule|Ld |Touch |Validate |CreateUniversalBinary/)?.[0]||'Build'}: ${target[1]}`:line.slice(0,1200);});console.log(selected.join('\n'));}
  if(command==='download'){const r=await(await request(`/actions/runs/${runId}/artifacts`)).json();const name=jobId||'Steadier-unsigned-iphone';if(!['Steadier-unsigned-iphone','Steadier-simulator-startup','Steadier-build-diagnostics'].includes(name))throw new Error('Unknown build artifact name.');const artifact=r.artifacts.find(a=>a.name===name&&!a.expired);if(!artifact)throw new Error('No completed artifact is available yet.');const response=await request(`/actions/artifacts/${artifact.id}/zip`);const folder=path.resolve('build','downloads');await mkdir(folder,{recursive:true});const target=path.join(folder,`${name}-${runId}.zip`);await writeFile(target,new Uint8Array(await response.arrayBuffer()));console.log(target);}
}catch(error){console.error(error.message.replaceAll(token,'[redacted]'));process.exitCode=1;}
