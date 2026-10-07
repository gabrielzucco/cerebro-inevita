#!/usr/bin/env node
// Local, explicit migration of platform routing. No requests or user data reads.
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const oldHost='https://peegicizxybjgvuutegc.supabase.co';
const newHost='https://inevitasociety.com/supabase';
const clients=['.agents/scripts/activate.mjs','.agents/scripts/ping.mjs','scripts/install-system.mjs','scripts/society-sync.mjs'];
const sha=value=>createHash('sha256').update(value).digest('hex');

export function migratePlatform(root,{apply=false}={}) {
  root=resolve(root);
  const safe=relative=>{
    let current=root;
    if(lstatSync(root).isSymbolicLink())throw Error('Use a regular installation directory');
    for(const part of relative.split('/')) {
      current=join(current,part);
      if(existsSync(current)&&lstatSync(current).isSymbolicLink())throw Error('Symbolic links are not supported');
    }
    return current;
  };
  if(!existsSync(safe('VERSION'))||!existsSync(safe('.cerebro'))||!existsSync(safe('.agents/scripts/ping.mjs')))throw Error('Expected an existing Cérebro installation');
  const changes=[];
  for(const file of clients) {
    const path=safe(file);if(!existsSync(path))continue;
    if(!lstatSync(path).isFile())throw Error('Expected regular client files');
    const before=readFileSync(path,'utf8'),after=before.replaceAll(oldHost,newHost);
    if(before!==after)changes.push({file,path,before,after,mode:lstatSync(path).mode&0o777});
  }
  const source=safe('.cerebro/source');
  if(existsSync(source)) {
    const before=readFileSync(source,'utf8');
    const after=before.replace(/^REPO=vinicius-leveron\/cerebro-inevita\s*$/m,'REPO=gabrielzucco/cerebro-inevita');
    if(after!==before)changes.push({file:'.cerebro/source',path:source,before,after,mode:lstatSync(source).mode&0o777});
  }
  if(!apply||!changes.length)return {applied:false,files:changes.map(c=>c.file)};
  const backup=safe('.cerebro/platform-migration-backup');mkdirSync(backup,{recursive:true,mode:0o700});
  for(const change of changes) {
    const copy=join(backup,sha(change.file)+'-'+sha(change.before)+'.bak');
    if(!existsSync(copy))writeFileSync(copy,change.before,{flag:'wx',mode:0o600});
  }
  // All paths and backups are checked before the first replacement. Each file
  // replacement is atomic, and retrying only touches the remaining old routes.
  for(const change of changes) {
    if(readFileSync(change.path,'utf8')!==change.before)throw Error('Client file changed during migration; retry');
    const temporary=join(dirname(change.path),'.platform-migration-'+randomUUID());
    writeFileSync(temporary,change.after,{flag:'wx',mode:change.mode});renameSync(temporary,change.path);
  }
  return {applied:true,files:changes.map(c=>c.file),backup:'.cerebro/platform-migration-backup'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {console.log(JSON.stringify(migratePlatform(process.cwd(),{apply:process.argv.includes('--apply')})));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
