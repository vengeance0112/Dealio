const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/demo/lib/store.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
}).outputText;
const context = { exports: {}, require: () => ({ createContext: () => ({}) }) };
vm.runInNewContext(code, context);
const verify = context.exports.verify;
const milestone = { id:'sample', criteria:['Homepage','Mobile'], gaps:[1] };
const sub = { version:1, files:['home.png'], link:'' };
assert.equal(verify(milestone, sub).score, 50);
assert.equal(verify(milestone, sub).recommendation, 'Request revision');
assert.equal(verify(milestone, { ...sub, version:2 }).recommendation, 'Accept');
assert.equal(verify(milestone, { ...sub, files:[] }).results[0].verdict, 'CANNOT VERIFY');
assert.equal(verify(milestone, { ...sub, files:[] }).score, 0);
console.log('Demo verification scenarios: PASS (simulated verifier, not evidence inspection)');
