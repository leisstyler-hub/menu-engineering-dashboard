import test from "node:test";
import assert from "node:assert/strict";
import {reviewText} from "../../src/features/ssmt/ssmtReviewText.js";
test("review presentation recovers known legacy words without mutating source",()=>{
 const item={description:"shrimp saut\uFFFDed with jalape\uFFFDos and pur\uFFFDe"};
 const original=JSON.stringify(item);assert.equal(reviewText(item.description),"shrimp saut\u00e9ed with jalape\u00f1os and pur\u00e9e");assert.equal(JSON.stringify(item),original);
 assert.equal(reviewText("unknown \uFFFD text"),"unknown [text needs correction] text");
 assert.equal(reviewText("saut\u00e9ed jalape\u00f1os 00042.10"),"saut\u00e9ed jalape\u00f1os 00042.10");
});
