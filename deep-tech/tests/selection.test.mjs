import test from 'node:test';
import assert from 'node:assert/strict';
import { items, stages, itemById, createSelection, addPackage, selectedIds, removeItem, packageQuote, selectionQuote } from '../offers.js';

test('published catalog reserves all prices and has distinct valid stage memberships',()=>{
  assert.ok(items.every(item=>item.priceCents===null));
  const members=stages.flatMap(stage=>stage.itemIds);
  assert.equal(new Set(members).size,members.length);
  assert.ok(members.every(id=>itemById[id]));
});
test('adding a complete package absorbs selected individual items without duplicates',()=>{
  const state=createSelection();state.individuals.add('photo-suite');state.individuals.add('scroller');
  addPackage(state,'credibility');addPackage(state,'credibility');
  assert.equal(state.packages.size,1);assert.equal(selectedIds(state).size,5);
  assert.deepEqual([...state.individuals],['scroller']);
});
test('removing one included item preserves the others as individual items',()=>{
  const state=createSelection();addPackage(state,'technology');addPackage(state,'credibility');
  removeItem(state,'short-explainer');
  assert.deepEqual([...state.packages],['credibility']);
  assert.equal(state.individuals.size,3);assert.equal(selectedIds(state).size,7);
  assert.ok(!selectedIds(state).has('short-explainer'));
});
test('complete package takes 10 percent from the combined member prices once',()=>{
  const catalog=Object.fromEntries(items.map(item=>[item.id,{...item,priceCents:10005}]));
  assert.deepEqual(packageQuote(stages[0],catalog),{subtotal:40020,saving:4002,total:36018});
  const state=createSelection();addPackage(state,'credibility');state.individuals.add('scroller');
  assert.deepEqual(selectionQuote(state,catalog),{knownTotal:46023,saving:4002,unpriced:0});
});
test('incomplete pricing never treats unpriced items or packages as free',()=>{
  const state=createSelection();addPackage(state,'credibility');state.individuals.add('scroller');
  const catalog={...itemById,scroller:{...itemById.scroller,priceCents:12500},'photo-suite':{...itemById['photo-suite'],priceCents:35000}};
  assert.equal(packageQuote(stages[0],catalog),null);
  assert.deepEqual(selectionQuote(state,catalog),{knownTotal:12500,saving:0,unpriced:1});
});
test('all packages total each individual item once; extras are undiscounted',()=>{
  const state=createSelection();stages.forEach(stage=>addPackage(state,stage.id));
  state.individuals.add('landing-page');
  const catalog=Object.fromEntries(items.map(item=>[item.id,{...item,priceCents:10000}]));
  assert.equal(selectedIds(state).size,13);
  assert.deepEqual(selectionQuote(state,catalog),{knownTotal:118000,saving:12000,unpriced:0});
});
