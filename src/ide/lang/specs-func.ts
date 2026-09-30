import { C, H, HS, ML, LISP } from './grammar';
import type { LangSpec } from './specs-code';

export const FUNC_SPECS: LangSpec[] = [
  // ------------------------------------------------------------ Haskell family
  {
    id: 'haskell', name: 'Haskell', ext: 'hs lhs hs-boot hsig', color: '#5e5086', label: 'HS', cat: 'Functional', sh: 'runhaskell runghc stack',
    g: HS({
      kw: 'as case class data default deriving do else family forall foreign hiding if import in infix infixl infixr instance let mdo module newtype of pattern proc qualified rec then type where',
      types: 'Int Integer Float Double Rational Char String Bool Maybe Either IO Ordering Word Functor Monad Applicative Foldable Traversable Show Read Eq Ord Num Enum Bounded Semigroup Monoid',
      consts: 'True False Nothing Just Left Right LT EQ GT otherwise undefined',
      builtins: 'map filter foldr foldl foldl\' sum product length head tail init last null reverse concat concatMap zip zipWith unzip lookup elem notElem take drop splitAt span break lines unlines words unwords show read print putStr putStrLn getLine getContents interact return pure fmap mapM mapM_ sequence sequence_ fst snd id const flip error seq max min abs signum negate div mod quot rem even odd',
    }),
  },
  {
    id: 'purescript', name: 'PureScript', ext: 'purs', color: '#1d222d', label: 'PRS', cat: 'Functional',
    g: HS({ str: `"'`, triple: true, kw: 'ado as case class data derive do else false forall foreign hiding if import in infix infixl infixr instance let module newtype of then true type where', types: 'Int Number String Char Boolean Array Maybe Either Effect Unit Aff Record', consts: 'true false Nothing Just Left Right unit', builtins: 'map pure bind log show discard' }),
  },
  {
    id: 'elm', name: 'Elm', ext: 'elm', color: '#60b5cc', label: 'ELM', cat: 'Functional',
    g: HS({ triple: true, kw: 'as case else exposing if import in infix let module of port then type alias where effect command subscription', types: 'Int Float String Char Bool List Maybe Result Cmd Sub Html Msg Model Program Dict Set Array Task Never', consts: 'True False Nothing Just Ok Err', builtins: 'map filter foldl foldr text div button span identity always toString' }),
  },
  {
    id: 'idris', name: 'Idris', ext: 'idr lidr', color: '#b30000', label: 'IDR', cat: 'Functional',
    g: HS({ kw: 'module where import namespace data record interface implementation using parameters mutual total partial covering public export private if then else case of let in do with rewrite auto impossible infix infixl infixr syntax dsl proof tactics', types: 'Nat Int Integer Double String Char Bool List Vect Maybe Either IO Type', consts: 'True False Nothing Just Z S' }),
  },
  {
    id: 'agda', name: 'Agda', ext: 'agda lagda', color: '#315665', label: 'AGD', cat: 'Functional',
    g: HS({ ident: "[^\\s(){};.\"@]+", caps: false, kw: 'abstract codata coinductive constructor data do eta-equality field forall hiding import in inductive infix infixl infixr instance interleaved let macro module mutual no-eta-equality open overlap pattern postulate primitive private public quote quoteTerm record renaming rewrite syntax tactic to unquote unquoteDecl unquoteDef using variable where with', types: 'Set Prop Nat Bool List' }),
  },
  {
    id: 'lean', name: 'Lean 4', ext: 'lean', color: '#5a67d8', label: 'LN', cat: 'Functional',
    g: { line: ['--'], block: [['/-', '-/']], nest: true, str: '"', caps: true, ident: "[A-Za-z_α-ωΑ-Ω][\\w'.!?]*", anno: '@\\[[^\\]]*\\]|#[a-z]+', kw: 'abbrev axiom by calc class deriving do else example export extends fun have if import in inductive infix infixl infixr instance let local macro match mutual namespace noncomputable notation open opaque partial prefix private protected section set_option show structure syntax termination_by then theorem universe unsafe variable where with lemma def return for unless try catch finally mut', types: 'Nat Int Float String Char Bool Prop Type Sort List Array Option IO Unit Fin', consts: 'true false none some rfl sorry', builtins: 'simp rw exact intro apply cases induction rfl omega decide norm_num linarith ring' },
  },
  {
    id: 'isabelle', name: 'Isabelle', ext: 'thy', color: '#fefe00', label: 'ISA', cat: 'Functional',
    g: { block: [['(*', '*)']], nest: true, str: '"`', kw: 'theory imports begin end lemma theorem corollary proof qed by apply done fix assume show have thus hence obtain where fun function primrec definition datatype type_synonym record locale context sorry oops using unfolding from with then moreover ultimately also finally next case induction simp auto blast force fastforce metis' },
  },
  // ------------------------------------------------------------ ML family
  {
    id: 'ocaml', name: 'OCaml', ext: 'ml mli mll mly eliom', color: '#ef7a08', label: 'ML', cat: 'Functional', sh: 'ocaml',
    g: ML({
      kw: 'and as assert asr begin class constraint do done downto else end exception external for fun function functor if in include inherit initializer land lazy let lor lsl lsr lxor match method mod module mutable new nonrec object of open or private rec sig struct then to try type val virtual when while with',
      types: 'int float bool char string unit list array option ref exn bytes format int32 int64 nativeint',
      consts: 'true false None Some Ok Error',
      builtins: 'print_string print_endline print_int print_float print_newline printf sprintf failwith invalid_arg raise ignore fst snd not List Array String Printf Hashtbl Map Set Option',
      anno: '\\[@{1,3}[^\\]]*\\]',
    }),
  },
  {
    id: 'reason', name: 'Reason', ext: 're rei', color: '#ff5847', label: 'RE', cat: 'Functional',
    g: C({ nest: true, caps: true, str: '"', extra: [[/'[a-z_]\w*/, 'type']], kw: 'and as assert begin class constraint do done downto else end exception external for fun function functor if in include inherit initializer lazy let module mutable new nonrec object of open or private rec sig struct switch then to try type val virtual when while with', types: 'int float bool char string unit list array option', consts: 'true false None Some' }),
  },
  {
    id: 'rescript', name: 'ReScript', ext: 'res resi', color: '#ed5051', label: 'RES', cat: 'Functional',
    g: C({ nest: true, caps: true, str: '"`', interp: '${', anno: '@[A-Za-z_][\\w.]*', kw: 'and as assert async await catch constraint else exception external false for if in include lazy let module mutable of open private rec switch true try type when while with', types: 'int float bool char string unit list array option promise dict', consts: 'true false None Some Ok Error' }),
  },
  {
    id: 'sml', name: 'Standard ML', ext: 'sml sig fun', color: '#dc566d', label: 'SML', cat: 'Functional',
    g: ML({ kw: 'abstype and andalso as case datatype do else end eqtype exception fn fun functor handle if in include infix infixr let local nonfix of op open orelse raise rec sharing sig signature struct structure then type val where while with withtype', types: 'int real string char bool unit list option exn word', consts: 'true false nil NONE SOME', builtins: 'print map foldl foldr length rev hd tl null app' }),
  },
  // ------------------------------------------------------------ BEAM
  {
    id: 'erlang', name: 'Erlang', ext: 'erl hrl escript app.src', color: '#b83998', label: 'ERL', cat: 'Functional', sh: 'escript', files: 'rebar.config sys.config',
    g: { line: ['%'], str: '"', caps: true, anno: '-[a-z_]+(?=\\s*\\()', extra: [[/\$\\?./, 'string'], [/'[^']*'/, 'constant'], [/\?[A-Za-z_]\w*/, 'annotation']], kw: 'after and andalso band begin bnot bor bsl bsr bxor case catch cond div end fun if let not of or orelse receive rem try when xor maybe else', builtins: 'spawn spawn_link self send exit throw error apply length hd tl element setelement tuple_size size abs round trunc float integer_to_list list_to_integer atom_to_list list_to_atom is_atom is_list is_integer is_binary io format lists maps gen_server supervisor', consts: 'true false undefined ok error', indent: 'none' },
  },
  {
    id: 'lfe', name: 'LFE (Lisp Flavoured Erlang)', ext: 'lfe', color: '#4c3023', label: 'LFE', cat: 'Lisp',
    g: LISP({ defs: 'defun defmacro defmodule defrecord defsyntax', kw: 'defun defmacro defmodule defrecord defsyntax lambda match-lambda let let* flet fletrec cond case if when unless receive after try catch progn export import from', builtins: 'io:format lists:map lists:foldl spawn self !', consts: 'true false' }),
  },
  // ------------------------------------------------------------ Lisp family
  {
    id: 'racket', name: 'Racket', ext: 'rkt rktl rktd scrbl', color: '#3c5caa', label: 'RKT', cat: 'Lisp', sh: 'racket',
    g: LISP({ block: [['#|', '|#']], defs: 'define define-syntax define-values define-struct struct define-syntax-rule define/contract define-type define-values/invoke-unit', extra: [[/#lang\s+\S+/, 'metatag']], kw: 'define define-syntax define-values define-struct struct lambda λ let let* letrec let-values if cond case when unless and or not begin set! quote quasiquote unquote require provide module for for/list for/fold for/vector for/hash match match-define with-handlers parameterize else =>', builtins: 'display displayln printf format print write newline car cdr cons list list? null? empty? first rest append map filter foldl foldr apply length reverse add1 sub1 string-append number->string string->number vector hash hash-ref hash-set! equal? eq? eqv? zero? error raise', consts: '#t #f #true #false null empty' }),
  },
  {
    id: 'commonlisp', name: 'Common Lisp', ext: 'lisp lsp asd', color: '#3fb68b', label: 'CL', cat: 'Lisp', sh: 'sbcl clisp ecl', aliases: 'cl lisp',
    g: LISP({ block: [['#|', '|#']], defs: 'defun defmacro defgeneric defmethod defvar defparameter defconstant defstruct defclass deftype defpackage define-condition', kw: 'defun defmacro defgeneric defmethod defvar defparameter defconstant defstruct defclass deftype defpackage in-package lambda let let* flet labels macrolet if when unless cond case typecase etypecase and or not progn prog1 prog2 block return return-from loop do dolist dotimes tagbody go handler-case handler-bind unwind-protect multiple-value-bind destructuring-bind setf setq incf decf push pop declare the function quote', builtins: 'format print princ prin1 terpri car cdr cons list append mapcar mapc reduce remove-if remove-if-not find position length reverse nth first second rest last apply funcall eq eql equal null listp numberp stringp make-instance slot-value error signal gethash make-hash-table', consts: 't nil' }),
  },
  {
    id: 'elisp', name: 'Emacs Lisp', ext: 'el emacs', color: '#c065db', label: 'EL', cat: 'Lisp', files: '.emacs _emacs .spacemacs .abbrev_defs', aliases: 'emacs-lisp',
    g: LISP({ defs: 'defun defmacro defvar defcustom defconst defgroup defface define-minor-mode define-derived-mode cl-defun', extra: [[/\?\\?./, 'string']], kw: 'defun defmacro defvar defcustom defconst defgroup defface lambda let let* if when unless cond and or not progn prog1 while dolist dotimes save-excursion save-restriction with-current-buffer condition-case unwind-protect interactive setq setq-local require provide use-package', builtins: 'message insert buffer-name current-buffer point goto-char forward-line search-forward re-search-forward replace-match car cdr cons list append mapcar funcall apply format concat string-to-number number-to-string add-hook global-set-key define-key kbd', consts: 't nil' }),
  },
  {
    id: 'janet', name: 'Janet', ext: 'janet jdn', color: '#0886a5', label: 'JAN', cat: 'Lisp', sh: 'janet',
    g: LISP({ line: ['#'], defs: 'defn defn- defmacro defmacro- def def- var var-', kw: 'def var defn defmacro fn do if when unless cond case match let loop for each while break set try error quote quasiquote unquote splice import use', builtins: 'print printf pp string length map filter reduce keys values get put array table struct tuple buffer', consts: 'true false nil' }),
  },
  {
    id: 'hy', name: 'Hy', ext: 'hy', color: '#7790b2', label: 'HY', cat: 'Lisp', sh: 'hy',
    g: LISP({ defs: 'defn defmacro defclass setv', kw: 'defn defmacro defclass setv fn if when unless cond do let for while break continue import require try except finally raise with return yield await and or not', builtins: 'print len range str int float list dict map filter', consts: 'True False None' }),
  },
  {
    id: 'guile', name: 'Guile Scheme', ext: 'guile', color: '#1e4aec', label: 'GUI', cat: 'Lisp', sh: 'guile',
    g: LISP({ block: [['#|', '|#']], defs: 'define define-syntax define-module define-record-type define*', kw: 'define define-syntax define-module use-modules lambda let let* letrec if cond case when unless and or begin set! quote do', builtins: 'display newline car cdr cons list map for-each append length reverse', consts: '#t #f' }),
  },
  // ------------------------------------------------------------ logic
  {
    id: 'prolog', name: 'Prolog', ext: 'pro prolog', color: '#74283c', label: 'PRO', cat: 'Logic', sh: 'swipl gprolog',
    g: { line: ['%'], block: [['/*', '*/']], str: `"'\``, caps: true, extra: [[/0'./, 'number']], after: [[/[A-Z_][\w]*/, 'variable']], kw: 'is mod rem xor div rdiv divmod not fail true false halt catch throw findall bagof setof forall between succ plus length append member memberchk nth0 nth1 msort sort predsort last reverse assert asserta assertz retract abolish dynamic discontiguous initialization module use_module ensure_loaded', builtins: 'write writeln print nl format read atom number var nonvar atomic compound callable is_list atom_codes atom_chars char_code atom_length atom_concat sub_atom number_codes atom_number functor arg copy_term call', ops: ':\\-?=<>!+*\\/\\\\^@#&$~|' },
  },
  {
    id: 'mercury', name: 'Mercury', ext: 'mercury', color: '#ff2b2b', label: 'MER', cat: 'Logic',
    g: { line: ['%'], block: [['/*', '*/']], str: `"'`, caps: true, kw: 'module interface implementation import_module use_module include_module end_module pred func type mode inst typeclass instance is det semidet multi nondet cc_multi cc_nondet erroneous failure if then else not some all pragma initialise finalise mutable where', types: 'int float string char bool list io' },
  },
  {
    id: 'datalog', name: 'Datalog / Soufflé', ext: 'dl datalog', color: '#6a44a7', label: 'DL', cat: 'Logic',
    g: C({ caps: true, pre: true, anno: '\\.[a-z]+', kw: 'input output printsize type decl comp init override functor plan choice-domain inline magic no_magic no_inline brie btree eqrel', types: 'number unsigned float symbol', consts: 'true false nil' }),
  },
  {
    id: 'logtalk', name: 'Logtalk', ext: 'lgt logtalk', color: '#295b9a', label: 'LGT', cat: 'Logic',
    g: { line: ['%'], block: [['/*', '*/']], str: `"'`, caps: true, anno: ':-\\s*[a-z_]+', kw: 'object end_object protocol end_protocol category end_category public protected private initialization dynamic info uses alias implements imports extends instantiates specializes complements self this sender parameter' },
  },
  {
    id: 'minizinc', name: 'MiniZinc', ext: 'mzn dzn', color: '#06a9e6', label: 'MZN', cat: 'Logic',
    g: { line: ['%'], block: [['/*', '*/']], str: '"', kw: 'ann annotation any array bool case constraint diff else elseif endif enum false float function if in include int intersect let list maximize minimize of op opt output par predicate record satisfy set solve string subset superset symdiff test then true tuple type union var where xor', builtins: 'forall exists sum product min max abs alldifferent all_different show fix' },
  },
  // ------------------------------------------------------------ array languages
  {
    id: 'apl', name: 'APL', ext: 'apl dyalog aplf apln aplc', color: '#5a8164', label: 'APL', cat: 'Scientific',
    g: { line: ['⍝'], str: `'`, esc: false, dbl: true, call: false, extra: [[/[⍺⍵∇]/, 'variable'], [/[⎕][A-Za-z]*/, 'predefined'], [/[:][A-Za-z]+/, 'keyword'], [/[+\-×÷⌈⌊|⍳⍴,⍪⌽⊖⍉↑↓⊂⊃⊆⌷⍋⍒∊⍷∪∩~∨∧⍱⍲<≤=≥>≠≡≢⊣⊢⍎⍕⊥⊤○!?⌹⍸]/, 'operator'], [/[/\\⌿⍀¨⍨⍣.∘⍤⍥@⌸⌺⍠]/, 'keyword']], kw: '' },
  },
  {
    id: 'j', name: 'J', ext: 'ijs ijt', color: '#9eedff', label: 'J', cat: 'Scientific',
    g: { line: ['NB.'], str: `'`, esc: false, dbl: true, call: false, extra: [[/[=][.:]/, 'operator'], [/\b(if|do|else|elseif|end|while|whilst|for|select|case|fcase|try|catch|return|break|continue|assert)\./, 'keyword'], [/\b[xymnuv]\b/, 'variable'], [/[<>+*\-%^$~|.:,;#!/\\\[\]{}"`@&?]+/, 'operator']], kw: '' },
  },
  {
    id: 'k', name: 'K', ext: 'k', color: '#28430a', label: 'K', cat: 'Scientific',
    g: { line: ['/ '], str: '"', call: false, extra: [[/^\/.*$/, 'comment'], [/`[\w.]*/, 'constant'], [/[+\-*%!&|<>=~,^#_$?@.:']+/, 'operator']], kw: 'if do while', builtins: 'abs bin by count delete exec exit first flip floor group in insert inter key last like lower max min neg not null prev rand reverse select show string sum til update upper where' },
  },
  {
    id: 'q', name: 'q / kdb+', ext: 'q', color: '#0040cd', label: 'Q', cat: 'Query',
    g: { line: ['/ '], str: '"', call: false, extra: [[/^\/.*$/, 'comment'], [/`[\w.:/]*/, 'constant'], [/\b\d{4}\.\d{2}\.\d{2}(?:D[\d:.]+)?/, 'number']], kw: 'select exec update delete from where by insert upsert if do while each peach over scan prior', builtins: 'abs aj all any asc avg avgs ceiling cols count cross cut deltas desc dev differ distinct div enlist except exit fills first fkeys flip floor get group gtime hclose hcount hdel hopen hsym iasc idesc in inter inv key keys last like lj load log lower max maxs md5 med meta min mins mmax mmin mmu mod neg next not null or over parse prd prds prev rand rank ratios raze read0 read1 reciprocal reverse rload rotate rsave save set show signum sin sqrt ssr string sublist sum sums sv system tables tan til trim type ungroup union upper value var view views wavg where within wj wsum xasc xbar xcol xcols xdesc xexp xgroup xkey xlog xprev xrank' },
  },
  {
    id: 'bqn', name: 'BQN', ext: 'bqn', color: '#2b7067', label: 'BQN', cat: 'Scientific',
    g: { line: ['#'], str: '"', call: false, extra: [[/'.'/, 'string'], [/[𝕨𝕩𝕗𝕘𝕤𝕎𝕏𝔽𝔾𝕊]/, 'variable'], [/•[A-Za-z_]\w*/, 'predefined'], [/[+\-×÷⋆√⌊⌈|¬∧∨<>≠=≤≥≡≢⊣⊢⥊∾≍⋈↑↓↕«»⌽⍉/⍋⍒⊏⊑⊐⊒∊⍷⊔!]/, 'operator'], [/[˙˜˘¨⌜⁼´˝`∘○⊸⟜⌾⊘◶⎉⚇⍟⎊]/, 'keyword']], kw: '' },
  },
  {
    id: 'uiua', name: 'Uiua', ext: 'ua', color: '#8a52ff', label: 'UIA', cat: 'Scientific',
    g: { line: ['#'], str: '"', call: false, extra: [[/@./, 'string'], [/[.,:;∘⊙⋅⟜⊸⤙⤚◡⍜⍥⊃⊓⍢⬚⨬⍣]/, 'keyword'], [/[¬±¯`⌵√○⌊⌈⁅=≠<≤>≥+\-×*÷%◿ⁿₙ↧↥∠ℂ⧻△⇡⊢⇌♭¤⋯⍉⍆⍏⍖⊚⊛◴◰□⋕≍⊟⊂⊏⊡↯☇↙↘↻⤸▽⌕⦷∊⊗/∧\\∵≡⍚⊞⧅⧈⍩]/, 'operator']], kw: '' },
  },
  // ------------------------------------------------------------ scientific / math
  {
    id: 'matlab', name: 'MATLAB / Octave', ext: 'matlab mlx oct', color: '#e16737', label: 'MAT', cat: 'Scientific', sh: 'octave', aliases: 'octave m',
    g: { line: ['%', '#'], block: [['%{', '%}']], str: `"'`, esc: false, dbl: true, indent: 'end', openers: 'function if for while switch try parfor classdef properties methods events', kw: 'break case catch classdef continue else elseif end endfunction endif endfor endwhile endswitch for function global if methods otherwise parfor persistent properties return spmd switch try while events enumeration arguments', builtins: 'disp fprintf sprintf printf zeros ones eye rand randn size length numel reshape linspace plot figure hold xlabel ylabel title legend grid subplot sum mean max min abs sqrt exp log sin cos tan find sort any all isempty num2str str2num strcat strsplit cellfun arrayfun error warning input fopen fclose', consts: 'true false pi inf Inf nan NaN eps' },
  },
  {
    id: 'scilab', name: 'Scilab', ext: 'sci sce tst', color: '#ca0f21', label: 'SCI', cat: 'Scientific',
    g: { line: ['//'], block: [['/*', '*/']], str: `"'`, esc: false, dbl: true, indent: 'end', openers: 'function if for while select try', kw: 'if then else elseif end for while do select case try catch function endfunction return break continue global', builtins: 'disp mprintf printf zeros ones rand size length plot sum mean max min abs sqrt exp', consts: '%t %f %pi %e %i %inf %nan' },
  },
  {
    id: 'wolfram', name: 'Wolfram Language', ext: 'wl wls nb mt wlt', color: '#dd1100', label: 'WL', cat: 'Scientific', sh: 'wolframscript', aliases: 'mathematica',
    g: { block: [['(*', '*)']], nest: true, str: '"', caps: true, ident: '[A-Za-z$][\\w$`]*', extra: [[/[A-Za-z$][\w$]*_+[A-Za-z]*/, 'variable'], [/#\d*|##/, 'variable']], kw: 'If Which Switch Do For While Table Module Block With Function Return Break Continue Throw Catch Map Apply Select Cases Nest NestList Fold FoldList', builtins: 'Print Plot Plot3D ListPlot Integrate D Solve NSolve Simplify FullSimplify Expand Factor Sum Product Limit Series Length First Last Rest Most Range Sort Reverse Join Append Prepend Total Mean Median StringJoin ToString ToExpression N Sqrt Sin Cos Exp Log Abs Max Min Graphics Show Manipulate Dynamic Import Export', consts: 'True False Null None All Automatic Pi E I Infinity' },
  },
  {
    id: 'maxima', name: 'Maxima', ext: 'mac wxm max', color: '#d11c24', label: 'MAX', cat: 'Scientific',
    g: { block: [['/*', '*/']], str: '"', kw: 'if then else elseif for from step thru while unless do in return block lambda and or not', builtins: 'diff integrate solve expand factor simplify ratsimp trigsimp limit taylor sum product plot2d plot3d display print makelist length first last rest append map apply subst ev float numer', consts: 'true false %pi %e %i inf minf' },
  },
  {
    id: 'gnuplot', name: 'Gnuplot', ext: 'gp gnuplot gnu plt plot', color: '#f0a9f0', label: 'GNU', cat: 'Scientific', sh: 'gnuplot',
    g: H({ kw: 'set unset plot splot replot fit load save call print pause reset show cd pwd do for in if else while exit quit using with title notitle lines points linespoints boxes impulses dots steps histograms errorbars smooth every index axes terminal output xlabel ylabel zlabel xrange yrange zrange key grid style', builtins: 'sin cos tan exp log sqrt abs int rand column stringcolumn sprintf strlen', consts: 'pi NaN' }),
  },
  {
    id: 'sas', name: 'SAS', ext: 'sas', color: '#b34936', label: 'SAS', cat: 'Scientific',
    g: { line: [], block: [['/*', '*/']], str: `"'`, esc: false, dbl: true, ci: true, sigil: '&%', extra: [[/^\s*\*[^;]*;/, 'comment']], kw: 'data set merge by if then else do end output run quit proc retain keep drop rename length format informat label array where select when otherwise delete return stop infile input cards datalines libname filename options title footnote ods macro mend let put include and or not in eq ne lt le gt ge', builtins: 'means freq print sort sql reg glm logistic univariate transpose contents import export sum mean min max n nmiss substr upcase lowcase trim compress scan index put input intck intnx today mdy year month day' },
  },
  {
    id: 'stata', name: 'Stata', ext: 'do ado doh ihlp mata matah sthlp', color: '#1a5f91', label: 'STA', cat: 'Scientific',
    g: { line: ['//', '*'], block: [['/*', '*/']], str: '"', extra: [[/`[^']*'/, 'variable'], [/\$[A-Za-z_]\w*/, 'variable']], kw: 'if in else foreach forvalues while by bysort quietly noisily capture program end local global tempvar tempname tempfile scalar matrix args syntax return ereturn version set use save clear generate gen replace drop keep sort merge append reshape collapse egen summarize sum tabulate tab regress reg logit probit list display di describe count', builtins: 'abs exp ln log sqrt round floor ceil max min sum mean strlen substr upper lower trim real string missing' },
  },
  {
    id: 'spss', name: 'SPSS Syntax', ext: 'sps spss', color: '#cc0000', label: 'SPS', cat: 'Scientific',
    g: { line0: ['*'], str: `"'`, esc: false, ci: true, kw: 'compute recode if do repeat end loop execute exe frequencies descriptives crosstabs regression t-test oneway anova correlations get file save outfile data list begin variables value labels missing values select filter by sort cases aggregate match files add files weight define enddefine' },
  },
  {
    id: 'gams', name: 'GAMS', ext: 'gms', color: '#f49a22', label: 'GMS', cat: 'Scientific',
    g: { line0: ['*'], block: [['$ontext', '$offtext']], str: `"'`, ci: true, kw: 'set sets parameter parameters table scalar scalars variable variables positive negative binary integer free equation equations model models solve using minimizing maximizing display option loop if else elseif while for repeat until abort alias', builtins: 'sum prod smin smax ord card abs exp log sqrt power', consts: 'yes no inf eps na' },
  },
  {
    id: 'ampl', name: 'AMPL', ext: 'ampl', color: '#e6efbb', label: 'AMP', cat: 'Scientific',
    g: H({ block: [['/*', '*/']], kw: 'set param var arc minimize maximize subject to s.t. node objective data model solve option display printf let fix unfix drop restore reset if then else for repeat while break continue in within by integer binary default', builtins: 'sum prod min max abs ceil floor exp log sqrt card ord first last member' }),
  },
  {
    id: 'modelica', name: 'Modelica', ext: 'mo', color: '#de1d31', label: 'MO', cat: 'Scientific',
    g: C({ caps: true, kw: 'algorithm and annotation block break class connect connector constant constrainedby der discrete each else elseif elsewhen encapsulated end enumeration equation expandable extends external final flow for function if import impure in initial inner input loop model not operator or outer output package parameter partial protected public pure record redeclare replaceable return stream then type when while within', types: 'Real Integer Boolean String', consts: 'true false time' }),
  },
  {
    id: 'julia-markdown', name: 'Weave / Pluto notebook', ext: 'jmd', color: '#a270ba', label: 'JMD', cat: 'Scientific', monaco: 'markdown',
  },
  // ------------------------------------------------------------ Shells
  {
    id: 'fish', name: 'Fish', ext: 'fish', color: '#4aae47', label: 'FSH', cat: 'Shell', sh: 'fish', files: 'config.fish',
    g: H({ sigil: '$', indent: 'end', openers: 'function if for while switch begin', kw: 'and argparse begin break builtin case command continue else end exec for function if in not or return set set_color source status switch test while', builtins: 'echo printf cd pwd ls cat string math contains count read abbr alias bind complete functions history jobs fg bg type', consts: 'true false' }),
  },
  {
    id: 'nushell', name: 'Nushell', ext: 'nu', color: '#4e9906', label: 'NU', cat: 'Shell', sh: 'nu',
    g: H({ sigil: '$', kw: 'alias def def-env export export-env extern for if else let let-env loop match module mut overlay return source source-env use where while break continue try catch const hide', builtins: 'echo print ls cd open save get select where sort-by group-by each par-each reduce filter first last skip take length describe to from str math http', consts: 'true false null' }),
  },
  {
    id: 'elvish', name: 'Elvish', ext: 'elv', color: '#55bb55', label: 'ELV', cat: 'Shell', sh: 'elvish',
    g: H({ sigil: '$', kw: 'var set tmp del fn if elif else while for try catch finally break continue return use and or coalesce', builtins: 'echo put print pprint each peach range count keys has-key has-value str re path' , consts: '$true $false $nil' }),
  },
  {
    id: 'xonsh', name: 'Xonsh', ext: 'xsh xonshrc', color: '#285eef', label: 'XSH', cat: 'Shell', sh: 'xonsh', files: '.xonshrc',
    g: H({ triple: true, indent: 'offside', sigil: '$', kw: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield aliases', consts: 'True False None', builtins: 'print len range open echo' }),
  },
  {
    id: 'tcsh', name: 'C Shell (csh/tcsh)', ext: 'csh tcsh', color: '#2a8a2a', label: 'CSH', cat: 'Shell', sh: 'csh tcsh', files: '.cshrc .tcshrc .login',
    g: H({ sigil: '$', kw: 'if then else endif foreach end while switch case breaksw default endsw goto set setenv unset unsetenv alias unalias source exit break continue', builtins: 'echo cd ls pwd printf' }),
  },
  {
    id: 'awk', name: 'AWK', ext: 'awk gawk mawk nawk', color: '#c30e9b', label: 'AWK', cat: 'Shell', sh: 'awk gawk mawk nawk',
    g: H({ str: '"', sigil: '$', extra: [[/\/(?:[^/\\\n]|\\.)+\/(?=\s*[,;)~]|\s*$)/, 'regexp']], kw: 'BEGIN END BEGINFILE ENDFILE if else while for do break continue next nextfile exit return delete in function func getline print printf', builtins: 'length substr index split sub gsub match sprintf tolower toupper sin cos atan2 exp log sqrt int rand srand system close fflush strftime systime gensub asort asorti', consts: 'NR NF FS OFS RS ORS FILENAME FNR SUBSEP RSTART RLENGTH ENVIRON ARGC ARGV CONVFMT OFMT' }),
  },
  {
    id: 'sed', name: 'sed', ext: 'sed', color: '#64b970', label: 'SED', cat: 'Shell', sh: 'sed',
    g: H({ str: '', call: false, extra: [[/s(.)(?:[^\\]|\\.)*?\1(?:[^\\]|\\.)*?\1[gipmwe0-9]*/, 'regexp'], [/\/(?:[^/\\]|\\.)*\//, 'regexp'], [/[aicdDgGhHlnNpPqQrRwWxyz=]/, 'keyword']], kw: '' }),
  },
  {
    id: 'jq', name: 'jq', ext: 'jq', color: '#c7254e', label: 'JQ', cat: 'Shell', sh: 'jq',
    g: H({ str: '"', interp: '\\(', sigil: '$', extra: [[/\.[A-Za-z_]\w*/, 'key']], kw: 'def if then elif else end as reduce foreach try catch label import include and or not __loc__', builtins: 'length utf8bytelength keys keys_unsorted values has in map map_values path del getpath setpath delpaths to_entries from_entries with_entries select empty error halt halt_error add any all flatten range floor sqrt pow log tostring tonumber type infinite nan sort sort_by group_by min max min_by max_by unique unique_by reverse contains inside startswith endswith split join ascii_downcase ascii_upcase test match capture scan sub gsub splits recurse env input inputs debug stderr input_filename tojson fromjson todate fromdate now first last limit until while repeat', consts: 'true false null' }),
  },
  {
    id: 'vimscript', name: 'Vim Script', ext: 'vim vimrc gvimrc nvim', color: '#199f4b', label: 'VIM', cat: 'Shell', files: '.vimrc _vimrc .gvimrc _gvimrc .exrc .nvimrc', aliases: 'viml vim',
    g: { line: ['"'], str: "'", esc: false, sigil: '&@', extra: [[/^\s*".*$/, 'comment'], [/"(?:[^"\\]|\\.)*"/, 'string'], [/\b[gsbwtlav]:[A-Za-z_]\w*/, 'variable'], [/<[A-Za-z-]+>/, 'constant']], indent: 'end', openers: 'function if for while try augroup', kw: 'function endfunction func endfunc if elseif else endif for endfor while endwhile try catch finally endtry return let unlet const call execute exe echo echom echomsg echoerr set setlocal map nmap vmap imap noremap nnoremap vnoremap inoremap xnoremap onoremap autocmd augroup command syntax highlight hi colorscheme filetype source runtime silent normal abort range dict closure', builtins: 'exists has len empty get add remove join split map filter sort reverse copy deepcopy type string expand fnamemodify getline setline line col search substitute matchstr printf strftime', consts: 'v:true v:false v:null' },
  },
  {
    id: 'expect', name: 'Expect', ext: 'exp', color: '#e4cc98', label: 'EXP', cat: 'Shell', sh: 'expect', monaco: 'tcl',
  },
  {
    id: 'ksh', name: 'KornShell', ext: 'ksh mksh', color: '#89e051', label: 'KSH', cat: 'Shell', sh: 'ksh mksh pdksh', monaco: 'shell', comment: '#',
  },
  {
    id: 'zsh', name: 'Zsh', ext: 'zsh zsh-theme', color: '#89e051', label: 'ZSH', cat: 'Shell', sh: 'zsh', files: '.zshrc .zshenv .zprofile .zlogin .zlogout', monaco: 'shell', comment: '#',
  },
];

