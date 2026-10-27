import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const grammarPath = resolve(process.env.ASS_GRAMMAR_PATH || join(root, "../tree-sitter-ass"));
const require = createRequire(join(grammarPath, "package.json"));
const Parser = require("tree-sitter");
const language = require(grammarPath);
const queries = Object.fromEntries(["highlights", "brackets", "outline", "textobjects"].map(name =>
  [name, new Parser.Query(language, readFileSync(join(root, `languages/ass/${name}.scm`), "utf8"))]));

function parse(source) {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse(source);
  assert.equal(tree.rootNode.hasError, false, tree.rootNode.toString());
  return tree;
}

function highlights(node) {
  let document = node;
  while (document.parent) document = document.parent;
  return queries.highlights.captures(document).filter(c =>
    c.node.startIndex >= node.startIndex && c.node.endIndex <= node.endIndex);
}

function columns(node) {
  return highlights(node).filter(c => c.name.startsWith("ass.column."));
}

test("all integration samples parse and all Zed queries execute", () => {
  for (const filename of ["full.ass", "legacy.ssa", "ass2.ass", "custom_formats.ass", "script_info_only.ass"]) {
    const tree = parse(readFileSync(join(root, "examples", filename), "utf8"));
    for (const query of Object.values(queries)) {
      assert.ok(query.captures(tree.rootNode).length > 0, filename);
      assert.equal(query.didExceedMatchLimit(), false);
    }
  }
});

test("column colors repeat, include empty fields, and have explicit Zed fallbacks", () => {
  const names = Array.from({ length: 29 }, (_, i) => `Custom${i}`);
  const values = names.map((_, i) => i % 3 ? `value${i}` : "");
  const tree = parse(`[V4+ Styles]\nFormat:${names.join(",")}\nStyle:${values.join(",")}\n`);
  for (const record of tree.rootNode.descendantsOfType("key_value_pair")) {
    const captures = columns(record);
    assert.equal(captures.length, 29);
    captures.forEach((capture, i) => assert.equal(capture.name, `ass.column.${i % 6 + 1}`));
  }
  for (const match of queries.highlights.matches(tree.rootNode)) {
    for (const [index, capture] of match.captures.entries()) {
      if (capture.name.startsWith("ass.column.")) {
        const palette = ["variable", "type", "string", "constant", "function", "keyword"];
        const column = Number(capture.name.split(".").at(-1));
        assert.equal(match.captures[index - 1].name, palette[column - 1]);
        assert.equal(match.captures[index - 1].node.id, capture.node.id);
      }
    }
  }
});

test("event metadata follows reordered formats while Text retains syntax", () => {
  for (const key of ["Dialogue", "Picture", "Sound", "Movie", "Command"]) {
    const tree = parse(`[Events]\nFormat:End,Start,Layer,Text\n${key}:0:00:02.00,0:00:01.00,0,{\\t(0,500,\\fs30)\\clip(m 0 0 l 10 10)\\p1}m 0 0 l 10 10{\\p0}Hello, world\\Nnext\n`);
    const [format, event] = tree.rootNode.descendantsOfType("key_value_pair");
    assert.equal(columns(event).length, 3);
    assert.deepEqual(columns(event).map(c => c.name), columns(format).slice(0, -1).map(c => c.name));
    const text = event.lastNamedChild.lastNamedChild;
    assert.ok(columns(event).every(c => c.node.endIndex <= text.startIndex));
    const captures = highlights(text);
    for (const name of ["function.builtin", "number", "string.escape", "punctuation.bracket", "punctuation.special"]) {
      assert.ok(captures.some(c => c.name === name), `${key}: ${name}`);
    }
    // Metadata scalar children must not override the enclosing palette in Zed.
    assert.ok(highlights(event).filter(c => c.name === "number")
      .every(c => c.node.startIndex >= text.startIndex));
  }
});

test("Comment events have no competing leaf highlights or column colors", () => {
  const tree = parse("[Events]\nFormat:Layer,Start,End,Effect,Text\nComment:0,0:00:01.00,0:00:02.00,Banner;20;0;10,{\\pos($x,$y)}template, text\n");
  const event = tree.rootNode.descendantsOfType("key_value_pair").at(-1);
  assert.deepEqual(columns(event), []);
  const captures = highlights(event);
  assert.ok(!captures.some(c => ["number", "constant", "function.builtin"].includes(c.name)));
  for (const capture of captures.filter(c => c.name !== "comment")) {
    assert.ok(captures.some(c => c.name === "comment" && c.node.id === capture.node.id), capture.name);
  }
});

test("ordinary metadata and encoded attachments have no column captures", () => {
  const tree = parse("[Script Info]\nTitle:Example, title\nFormat:Example, title\nStyle:Example, title\n[Fonts]\nfontname:example.ttf\n!!!!\n[AAAA]\n");
  assert.deepEqual(columns(tree.rootNode), []);
  assert.ok(queries.highlights.captures(tree.rootNode).some(c => c.name === "string" && c.node.text === "[AAAA]"));
  assert.deepEqual(queries.brackets.captures(tree.rootNode).map(c => c.node.text), ["[", "]", "[", "]"]);
});

test("outline includes sections, reordered style names, and attachment names", () => {
  const tree = parse("[V4+ Styles]\nFormat:Fontname,Name\nStyle:Arial,Default\n[Fonts]\nfontname:example.ttf\n!!!!\n[Graphics]\nfilename:example.bmp\n!!!!\n");
  const names = queries.outline.captures(tree.rootNode).filter(c => c.name === "name").map(c => c.node.text);
  assert.deepEqual(names, ["V4+ Styles", "Default", "Fonts", "example.ttf", "Graphics", "example.bmp"]);
});

test("incremental format edits update column captures like a fresh parse", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const source = "[V4+ Styles]\nFormat:Name,Extra,Extra2\nStyle:Default,Arial\n";
  const tree = parser.parse(source);
  const index = source.indexOf("Arial");
  tree.edit({ startIndex: index, oldEndIndex: index, newEndIndex: index + 1,
    startPosition: { row: 2, column: 14 }, oldEndPosition: { row: 2, column: 14 },
    newEndPosition: { row: 2, column: 15 } });
  const updated = source.slice(0, index) + "," + source.slice(index);
  const incremental = parser.parse(updated, tree);
  const fresh = parse(updated);
  assert.equal(incremental.rootNode.hasError, false);
  const ranges = tree => columns(tree.rootNode).map(c => [c.name, c.node.startIndex, c.node.endIndex]);
  assert.deepEqual(ranges(incremental), ranges(fresh));
});

test("malformed records expose an error highlight and recover at following records", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse("[Events]\nFormat:Start,End,Text\nDialogue:bad,0:00:02.00,broken\nDialogue:0:00:02.00,0:00:03.00,valid\\Ntext\n");
  assert.equal(tree.rootNode.hasError, true);
  const captures = queries.highlights.captures(tree.rootNode);
  assert.ok(captures.some(c => c.name === "error"));
  assert.ok(captures.some(c => c.name === "string.escape" && c.node.text === "\\N"));
});
