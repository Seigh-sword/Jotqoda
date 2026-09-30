/** Starter content for new files in additional languages (keyed by JotQoda language id). */
export const MORE_FILE_TEMPLATES: Record<string, string> = {
  zig: 'const std = @import("std");\n\npub fn main() void {\n    std.debug.print("Hello, Zig!\\n", .{});\n}\n',
  nim: 'proc greet(name: string): string =\n  "Hello, " & name & "!"\n\necho greet("Nim")\n',
  crystal: 'def greet(name : String)\n  "Hello, #{name}!"\nend\n\nputs greet("Crystal")\n',
  d: 'import std.stdio;\n\nvoid main() {\n    writeln("Hello, D!");\n}\n',
  vlang: 'fn main() {\n\tprintln("Hello, V!")\n}\n',
  odin: 'package main\n\nimport "core:fmt"\n\nmain :: proc() {\n\tfmt.println("Hello, Odin!")\n}\n',
  haskell: 'module Main where\n\nmain :: IO ()\nmain = putStrLn "Hello, Haskell!"\n',
  ocaml: 'let () = print_endline "Hello, OCaml!"\n',
  fsharp: 'printfn "Hello, F#!"\n',
  erlang: '-module(hello).\n-export([main/0]).\n\nmain() ->\n    io:format("Hello, Erlang!~n").\n',
  clojure: '(ns hello)\n\n(defn -main []\n  (println "Hello, Clojure!"))\n\n(-main)\n',
  racket: '#lang racket\n\n(displayln "Hello, Racket!")\n',
  commonlisp: '(defun main ()\n  (format t "Hello, Common Lisp!~%"))\n\n(main)\n',
  scheme: '(define (greet name)\n  (string-append "Hello, " name "!"))\n\n(display (greet "Scheme"))\n(newline)\n',
  fortran: 'program hello\n  implicit none\n  print *, "Hello, Fortran!"\nend program hello\n',
  cobol: '       IDENTIFICATION DIVISION.\n       PROGRAM-ID. HELLO.\n       PROCEDURE DIVISION.\n           DISPLAY "Hello, COBOL!".\n           STOP RUN.\n',
  ada: 'with Ada.Text_IO; use Ada.Text_IO;\n\nprocedure Hello is\nbegin\n   Put_Line ("Hello, Ada!");\nend Hello;\n',
  pascal: 'program Hello;\nbegin\n  WriteLn(\'Hello, Pascal!\');\nend.\n',
  prolog: ':- initialization(main).\n\nmain :-\n    write(\'Hello, Prolog!\'), nl.\n',
  groovy: 'def greet(name) {\n    "Hello, ${name}!"\n}\n\nprintln greet("Groovy")\n',
  vb: 'Module Program\n    Sub Main()\n        Console.WriteLine("Hello, Visual Basic!")\n    End Sub\nEnd Module\n',
  powershell: 'function Get-Greeting([string]$Name) {\n    "Hello, $Name!"\n}\n\nGet-Greeting "PowerShell"\n',
  bat: '@echo off\necho Hello, Batch!\n',
  fish: 'function greet\n    echo "Hello, $argv!"\nend\n\ngreet Fish\n',
  awk: 'BEGIN { print "Hello, AWK!" }\n{ print NR ": " $0 }\n',
  tcl: 'proc greet {name} {\n    return "Hello, $name!"\n}\n\nputs [greet Tcl]\n',
  gleam: 'import gleam/io\n\npub fn main() {\n  io.println("Hello, Gleam!")\n}\n',
  elm: 'module Main exposing (main)\n\nimport Html exposing (text)\n\nmain =\n    text "Hello, Elm!"\n',
  purescript: 'module Main where\n\nimport Prelude\nimport Effect.Console (log)\n\nmain = log "Hello, PureScript!"\n',
  reason: 'let greet = name => "Hello, " ++ name ++ "!";\n\nJs.log(greet("Reason"));\n',
  rescript: 'let greet = name => `Hello, ${name}!`\n\nJs.log(greet("ReScript"))\n',
  sml: 'val () = print "Hello, Standard ML!\\n"\n',
  lean: 'def main : IO Unit :=\n  IO.println "Hello, Lean!"\n',
  matlab: 'function hello()\n    disp(\'Hello, MATLAB!\');\nend\n',
  coffeescript: 'greet = (name) -> "Hello, #{name}!"\nconsole.log greet "CoffeeScript"\n',
  vala: 'void main () {\n    print ("Hello, Vala!\\n");\n}\n',
  hack: '<?hh\n\n<<__EntryPoint>>\nfunction main(): void {\n  echo "Hello, Hack!\\n";\n}\n',
  raku: 'sub greet(Str $name) { "Hello, $name!" }\n\nsay greet("Raku");\n',
  gdscript: 'extends Node\n\nfunc _ready() -> void:\n\tprint("Hello, GDScript!")\n',
  cuda: '#include <cstdio>\n\n__global__ void hello() {\n    printf("Hello from thread %d\\n", threadIdx.x);\n}\n\nint main() {\n    hello<<<1, 4>>>();\n    cudaDeviceSynchronize();\n    return 0;\n}\n',
  glsl: '#version 300 es\nprecision highp float;\n\nout vec4 fragColor;\n\nvoid main() {\n    fragColor = vec4(0.4, 0.2, 0.9, 1.0);\n}\n',
  hlsl: 'float4 main(float4 pos : SV_Position) : SV_Target {\n    return float4(0.4, 0.2, 0.9, 1.0);\n}\n',
  wgsl: '@fragment\nfn main() -> @location(0) vec4<f32> {\n    return vec4<f32>(0.4, 0.2, 0.9, 1.0);\n}\n',
  vhdl: 'library ieee;\nuse ieee.std_logic_1164.all;\n\nentity blink is\n  port (clk : in std_logic; led : out std_logic);\nend entity;\n\narchitecture rtl of blink is\nbegin\n  led <= clk;\nend architecture;\n',
  verilog: 'module blink(input wire clk, output reg led);\n  always @(posedge clk) led <= ~led;\nendmodule\n',
  systemverilog: 'module top;\n  initial $display("Hello, SystemVerilog!");\nendmodule\n',
  nasm: 'section .data\n    msg db "Hello, NASM!", 10\n    len equ $ - msg\n\nsection .text\n    global _start\n_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, msg\n    mov rdx, len\n    syscall\n    mov rax, 60\n    xor rdi, rdi\n    syscall\n',
  gas: '    .globl main\n    .text\nmain:\n    movl $0, %eax\n    ret\n',
  riscv: '    .text\n    .globl main\nmain:\n    li a0, 42\n    ret\n',
  llvm: 'define i32 @main() {\n  ret i32 0\n}\n',
  wat: '(module\n  (import "env" "log" (func $log (param i32)))\n  (func (export "main") (result i32)\n    i32.const 42\n    call $log\n    i32.const 1))\n',
  brainfuck: '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.\n',
  lolcode: 'HAI 1.2\n  VISIBLE "HAI WORLD!"\nKTHXBYE\n',
  mermaid: 'flowchart LR\n    A[Idea] --> B{Works?}\n    B -->|Yes| C[Ship it]\n    B -->|No| D[Debug]\n    D --> B\n',
  dot: 'digraph G {\n    rankdir=LR;\n    node [shape=box, style=rounded];\n    idea -> prototype -> ship;\n    prototype -> idea [label="iterate"];\n}\n',
  plantuml: '@startuml\nAlice -> Bob: Hello\nBob --> Alice: Hi!\n@enduml\n',
  latex: '\\documentclass{article}\n\\begin{document}\nHello, \\LaTeX!\n\\end{document}\n',
  asciidoc: '= Document Title\n\n== Section\n\nHello, *AsciiDoc*!\n',
  org: '#+TITLE: Notes\n\n* Heading\n** TODO Write something\n',
  typst: '= Hello, Typst!\n\nThis is *bold* and _emphasis_.\n',
  toml: '[package]\nname = "example"\nversion = "0.1.0"\n',
  jinja: '<ul>\n{% for item in items %}\n  <li>{{ item | title }}</li>\n{% endfor %}\n</ul>\n',
  makefile: '.PHONY: all clean\n\nall:\n\t@echo "Hello, Make!"\n\nclean:\n\trm -rf build\n',
  cmake: 'cmake_minimum_required(VERSION 3.20)\nproject(hello CXX)\n\nadd_executable(hello main.cpp)\n',
  nix: '{ pkgs ? import <nixpkgs> {} }:\n\npkgs.mkShell {\n  buildInputs = [ pkgs.nodejs ];\n}\n',
  starlark: 'cc_binary(\n    name = "hello",\n    srcs = ["hello.cc"],\n)\n',
  protobuf: 'syntax = "proto3";\n\nmessage Greeting {\n  string text = 1;\n}\n',
  thrift: 'struct Greeting {\n  1: string text\n}\n\nservice Greeter {\n  Greeting greet(1: string name)\n}\n',
  vyper: '# @version ^0.3.10\n\ngreeting: public(String[32])\n\n@external\ndef __init__():\n    self.greeting = "Hello, Vyper!"\n',
  move: 'module 0x1::hello {\n    public fun greeting(): vector<u8> {\n        b"Hello, Move!"\n    }\n}\n',
  cairo: 'fn main() {\n    println!("Hello, Cairo!");\n}\n',
  http: '### Get a sample post\nGET https://jsonplaceholder.typicode.com/posts/1\nAccept: application/json\n',
  csv: 'name,language,stars\nAda,Ada,5\nGrace,COBOL,4\nLinus,C,5\n',
  tsv: 'name\tlanguage\tstars\nAda\tAda\t5\nGrace\tCOBOL\t4\n',
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <greeting>Hello, XML!</greeting>\n</root>\n',
  ini: '[section]\nkey = value\n',
  properties: 'app.name=Example\napp.version=1.0.0\n',
  dotenv: 'API_URL=https://api.example.com\nDEBUG=true\n',
  editorconfig: 'root = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ninsert_final_newline = true\n',
  ignore: 'node_modules/\ndist/\n.env\n*.log\n',
  vue: '<template>\n  <h1>{{ msg }}</h1>\n</template>\n\n<script setup>\nconst msg = "Hello, Vue!";\n</script>\n',
  svelte: '<script>\n  let name = "Svelte";\n</script>\n\n<h1>Hello, {name}!</h1>\n',
  astro: '---\nconst name = "Astro";\n---\n\n<h1>Hello, {name}!</h1>\n',
  sass: '$primary: #7c3aed\n\nbody\n  font-family: system-ui\n  color: $primary\n',
  stylus: 'primary = #7c3aed\n\nbody\n  font-family system-ui\n  color primary\n',
  haml: '%h1 Hello, Haml!\n%p= Time.now\n',
  gherkin: 'Feature: Greeting\n  Scenario: Say hello\n    Given a visitor\n    When they open the page\n    Then they see "Hello"\n',
  robot: '*** Test Cases ***\nSay Hello\n    Log    Hello, Robot Framework!\n',
  solidity: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract Hello {\n    string public greeting = "Hello, Solidity!";\n}\n',
  kotlin: 'fun main() {\n    println("Hello, Kotlin!")\n}\n',
};

/** Polyglot workspace: one runnable example per in-browser runtime. */
export const POLYGLOT_FILES: Record<string, string> = {
  'README.md': `# Polyglot Runtimes

Every file here runs **inside your browser** (WebAssembly / Web Workers) — press **F5**.

| File | Runtime |
|---|---|
| \`lua/hello.lua\` | Lua 5.4 (wasmoon) — with \`require\` of a workspace module |
| \`ruby/hello.rb\` | CRuby 3.4 (ruby.wasm, ~30 MB on first run) |
| \`php/hello.php\` | PHP 8.4 (php-wasm, ~15 MB on first run) |
| \`scheme/hello.scm\` | BiwaScheme |
| \`prolog/family.pro\` | Tau Prolog (\`?-\` queries are answered) |
| \`coffee/hello.coffee\` | CoffeeScript → JavaScript worker |
| \`clojure/hello.cljs\` | ClojureScript via Scittle (SCI) |
| \`wasm/add.wat\` | WebAssembly text (wabt.js) |
| \`bf/hello.bf\` | Brainfuck interpreter |
| \`diagrams/flow.mmd\` | Mermaid preview |
| \`diagrams/graph.dot\` | Graphviz preview |
| \`data/people.csv\` | Sortable table preview |
`,
  'lua/hello.lua': `local util = require("util")

local function fib(n)
  if n < 2 then return n end
  return fib(n - 1) + fib(n - 2)
end

local t = {}
for i = 1, 10 do t[#t + 1] = fib(i) end
print(_VERSION .. " fib: " .. table.concat(t, ", "))
print(util.shout("hello from a workspace module"))
io.write("done", "\\n")
`,
  'lua/util.lua': `local M = {}

function M.shout(s)
  return s:upper() .. "!"
end

return M
`,
  'ruby/hello.rb': `class Greeter
  def initialize(name)
    @name = name
  end

  def greet
    "Hello, #{@name}!"
  end
end

puts Greeter.new("Ruby #{RUBY_VERSION}").greet
puts "Sum of squares: #{(1..5).map { |i| i * i }.sum}"
`,
  'php/hello.php': `<?php
function fact(int $n): int {
    return $n <= 1 ? 1 : $n * fact($n - 1);
}

echo "PHP " . PHP_VERSION . "\\n";
foreach ([3, 5, 7] as $n) {
    printf("%d! = %d\\n", $n, fact($n));
}
`,
  'scheme/hello.scm': `(define (fact n)
  (if (= n 0) 1 (* n (fact (- n 1)))))

(display "10! = ")
(display (fact 10))
(newline)
(map (lambda (x) (* x x)) '(1 2 3 4))
`,
  'prolog/family.pro': `parent(tom, bob).
parent(bob, ann).
parent(bob, pat).

grandparent(X, Z) :- parent(X, Y), parent(Y, Z).

:- initialization(main).
main :- findall(G, grandparent(tom, G), Gs), write(grandchildren(Gs)), nl.

?- grandparent(tom, Who).
`,
  'coffee/hello.coffee': `square = (x) -> x * x
console.log "CoffeeScript squares:", (square n for n in [1..5])
`,
  'clojure/hello.cljs': `(defn fib [n]
  (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2)))))

(println "ClojureScript (SCI):" (map fib (range 10)))
(reduce + (range 101))
`,
  'wasm/add.wat': `(module
  (import "env" "log" (func $log (param i32)))
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)
  (func (export "main") (result i32)
    i32.const 42
    call $log
    i32.const 7
    i32.const 35
    call $add))
`,
  'bf/hello.bf': `Hello World in Brainfuck
++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.
`,
  'diagrams/flow.mmd': MORE_FILE_TEMPLATES.mermaid,
  'diagrams/graph.dot': MORE_FILE_TEMPLATES.dot,
  'data/people.csv': `name,role,language,commits
Ada,Engineer,Ada,1843
Grace,Admiral,COBOL,1959
Linus,Maintainer,C,1991
Guido,BDFL,Python,1991
Brendan,Creator,JavaScript,1995
Yukihiro,Creator,Ruby,1995
`,
};
