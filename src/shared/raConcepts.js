import {canonicalConceptName} from './conceptPillars.js';
import concepts from '../data/raConcepts.json' with {type:'json'};
const names=new Set(concepts.map(canonicalConceptName));
// Recipe packet menu headers establish RA membership even when display names omit the prefix.
export const isRaConcept=name=>/^AMZ\+RA:/i.test(String(name))||names.has(canonicalConceptName(name));
