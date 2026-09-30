import { C, H, type Grammar } from './grammar';

export type Category =
  | 'Web' | 'Systems' | 'Application' | 'JVM' | '.NET' | 'Mobile' | 'Scripting' | 'Functional' | 'Lisp' | 'Logic'
  | 'Scientific' | 'Data & Config' | 'Markup & Docs' | 'Templating' | 'Query' | 'Shell' | 'Build & DevOps'
  | 'Shaders & GPU' | 'Hardware' | 'Assembly' | 'Smart Contracts' | 'Game Dev' | 'Legacy' | 'Esoteric' | 'Diagrams' | 'Other';

export interface LangSpec {
  id: string;
  name: string;
  /** space separated extensions (may contain dots, e.g. "blade.php") */
  ext: string;
  color: string;
  label: string;
  cat: Category;
  /** grammar for a JotQoda tokenizer — omit when `monaco` is given */
  g?: Grammar;
  /** reuse an existing Monaco tokenizer */
  monaco?: string;
  /** exact file names (case-insensitive, space separated) */
  files?: string;
  /** shebang interpreters (space separated) */
  sh?: string;
  aliases?: string;
  comment?: string;
  block?: [string, string];
}

const CKW = 'if else for while do switch case default break continue return goto sizeof typedef struct union enum static extern const volatile register inline restrict auto';
const CPPKW = `${CKW} class namespace template typename public private protected virtual override final friend operator new delete this try catch throw using constexpr consteval constinit noexcept nullptr decltype explicit mutable static_assert thread_local co_await co_return co_yield concept requires export import module`;
const CTYPES = 'void char short int long float double signed unsigned bool size_t ssize_t ptrdiff_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t intptr_t uintptr_t wchar_t char16_t char32_t';

export const CODE_SPECS: LangSpec[] = [
  // ------------------------------------------------------------ systems
  {
    id: 'zig', name: 'Zig', ext: 'zig zon', color: '#ec915c', label: 'ZIG', cat: 'Systems',
    g: C({
      block: [], str: `"'`,
      kw: 'addrspace align allowzero and anyframe anytype asm async await break callconv catch comptime const continue defer else enum errdefer error export extern fn for if inline linksection noalias noinline nosuspend opaque or orelse packed pub resume return struct suspend switch test threadlocal try union unreachable usingnamespace var volatile while',
      types: 'i8 u8 i16 u16 i32 u32 i64 u64 i128 u128 isize usize f16 f32 f64 f80 f128 bool void noreturn type anyerror comptime_int comptime_float c_char c_short c_ushort c_int c_uint c_long c_ulong c_longlong c_ulonglong c_longdouble anyopaque',
      consts: 'true false null undefined',
      anno: '@[A-Za-z_]\\w*',
      extra: [[/\\\\.*$/, 'string']],
    }),
  },
  {
    id: 'nim', name: 'Nim', ext: 'nim nims nimble', color: '#ffc200', label: 'NIM', cat: 'Systems', sh: 'nim',
    g: H({
      block: [['#[', ']#']], nest: true, triple: true, indent: 'offside',
      kw: 'addr and as asm bind block break case cast concept const continue converter defer discard distinct div do elif else end enum except export finally for from func if import in include interface is isnot iterator let macro method mixin mod nil not notin object of or out proc ptr raise ref return shl shr static template try tuple type using var when while xor yield',
      types: 'int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 float float32 float64 bool char string cstring pointer seq array set openArray varargs void auto any untyped typed Natural Positive Table HashSet Option Result',
      consts: 'true false nil',
      builtins: 'echo len high low inc dec add del ord chr repr new newSeq assert doAssert quit readLine stdin stdout stderr writeLine',
      anno: '\\{\\.[^}]*\\.?\\}',
    }),
  },
  {
    id: 'odin', name: 'Odin', ext: 'odin', color: '#60affe', label: 'ODN', cat: 'Systems',
    g: C({
      nest: true, str: `"'\``,
      kw: 'asm auto_cast bit_set break case cast context continue defer distinct do dynamic else enum fallthrough for foreign if import in map matrix not_in or_else or_return or_break or_continue package proc return struct switch transmute typeid union using when where',
      types: 'int i8 i16 i32 i64 i128 uint u8 u16 u32 u64 u128 uintptr f16 f32 f64 complex64 complex128 quaternion128 quaternion256 bool b8 b16 b32 b64 rune string cstring rawptr any typeid',
      consts: 'true false nil',
      builtins: 'len cap size_of align_of offset_of type_of type_info_of min max abs clamp make new free delete append',
      anno: '[@#][A-Za-z_]\\w*',
    }),
  },
  {
    id: 'vlang', name: 'V', ext: 'vsh vv', color: '#4f87c4', label: 'V', cat: 'Systems', sh: 'v',
    g: C({
      str: `"'\``, interp: '${',
      kw: 'as asm assert atomic break const continue defer else enum fn for go goto if import in interface is isreftype lock match module mut none or pub return rlock select shared sizeof spawn static struct type typeof union unsafe volatile',
      types: 'bool string i8 i16 int i64 i128 u8 u16 u32 u64 u128 rune f32 f64 isize usize voidptr any map chan thread',
      consts: 'true false nil',
      builtins: 'println print eprintln eprint exit panic dump',
      anno: '@\\[[^\\]]*\\]|\\[[a-z_]+\\]',
    }),
  },
  {
    id: 'd', name: 'D', ext: 'd di', color: '#ba595e', label: 'D', cat: 'Systems', sh: 'rdmd dmd',
    g: C({
      block: [['/*', '*/'], ['/+', '+/']], nest: true, str: `"'\``,
      kw: 'abstract alias align asm assert auto body break case cast catch class const continue debug default delegate delete deprecated do else enum export extern final finally for foreach foreach_reverse function goto if immutable import in inout interface invariant is lazy macro mixin module new nothrow out override package pragma private protected public pure ref return scope shared static struct super switch synchronized template this throw try typeid typeof union unittest version while with __gshared __traits __vector __parameters',
      types: 'bool byte ubyte short ushort int uint long ulong cent ucent char wchar dchar float double real ifloat idouble ireal cfloat cdouble creal void string wstring dstring size_t ptrdiff_t',
      consts: 'true false null',
      anno: '@[A-Za-z_]\\w*',
    }),
  },
  {
    id: 'vala', name: 'Vala', ext: 'vala vapi', color: '#a56de2', label: 'VAL', cat: 'Systems',
    g: C({
      triple: true, interp: '$', caps: true,
      kw: 'abstract as async base break case catch class const construct continue default delegate delete do dynamic else ensures enum errordomain extern finally for foreach get if in inline interface internal is lock namespace new out override owned private protected public ref requires return set signal sizeof static struct switch this throw throws try typeof unowned using var virtual weak while yield',
      types: 'bool char uchar int uint short ushort long ulong int8 uint8 int16 uint16 int32 uint32 int64 uint64 float double size_t ssize_t string unichar void',
      consts: 'true false null',
      anno: '\\[[A-Z][^\\]]*\\]',
    }),
  },
  {
    id: 'carbon', name: 'Carbon', ext: 'carbon', color: '#222222', label: 'CRB', cat: 'Systems',
    g: C({
      block: [], caps: true,
      kw: 'abstract adapt addr alias and api as auto base break case choice class constraint continue default destructor else extend final fn for forall friend if impl impls import in interface let library like match namespace not observe or override package partial private protected return returned Self self template then type var virtual where while',
      types: 'bool i8 i16 i32 i64 i128 u8 u16 u32 u64 u128 f16 f32 f64 f128 String StringView',
      consts: 'true false',
      builtins: 'Print',
    }),
  },
  {
    id: 'hare', name: 'Hare', ext: 'ha', color: '#9d7424', label: 'HA', cat: 'Systems',
    g: C({
      block: [],
      kw: 'abort alloc append as assert break case const continue def defer delete else enum export fn for free if insert is len let match nullable offset return static struct switch type union use vaarg vaend vastart yield',
      types: 'bool done f32 f64 i8 i16 i32 i64 int never opaque rune size str u8 u16 u32 u64 uint uintptr valist void',
      consts: 'true false null',
      anno: '@[A-Za-z_]\\w*',
    }),
  },
  {
    id: 'c3', name: 'C3', ext: 'c3 c3i', color: '#2563eb', label: 'C3', cat: 'Systems',
    g: C({
      pre: false, anno: '[@$][A-Za-z_]\\w*', caps: true,
      kw: 'alias asm assert attrdef bitstruct break case catch const continue def default defer distinct do else enum extern fault false fn for foreach foreach_r if import inline interface macro module nextcase null private return static struct switch tlocal true try union var while',
      types: 'void bool char ichar short ushort int uint long ulong int128 uint128 iptr uptr isz usz float16 float double float128 any typeid anyfault String ZString',
      consts: 'true false null',
    }),
  },
  {
    id: 'jai', name: 'Jai', ext: 'jai', color: '#ab8b4b', label: 'JAI', cat: 'Systems',
    g: C({
      nest: true, anno: '#[A-Za-z_]\\w*',
      kw: 'if ifx then else case for while break continue return defer using cast xx struct enum enum_flags union inline no_inline push_context remove size_of type_of type_info is_constant operator interface',
      types: 'bool int u8 u16 u32 u64 s8 s16 s32 s64 float float32 float64 string void Type Any',
      consts: 'true false null it it_index',
      builtins: 'print assert free alloc New array_add sprint',
    }),
  },
  {
    id: 'cuda', name: 'CUDA', ext: 'cu cuh', color: '#3a4e3a', label: 'CU', cat: 'Shaders & GPU',
    g: C({
      pre: true,
      kw: `${CPPKW} __global__ __device__ __host__ __shared__ __constant__ __managed__ __restrict__ __noinline__ __forceinline__ __launch_bounds__`,
      types: `${CTYPES} dim3 float2 float3 float4 int2 int3 int4 uint2 uint3 uint4 double2 half half2 cudaError_t cudaStream_t cudaEvent_t`,
      consts: 'true false nullptr NULL',
      builtins: 'threadIdx blockIdx blockDim gridDim warpSize __syncthreads __syncwarp atomicAdd atomicSub atomicMax atomicMin atomicCAS cudaMalloc cudaFree cudaMemcpy cudaMemset cudaDeviceSynchronize cudaGetLastError cudaGetErrorString cudaMemcpyHostToDevice cudaMemcpyDeviceToHost printf',
    }),
  },
  {
    id: 'opencl', name: 'OpenCL', ext: 'cl opencl', color: '#ed2e2d', label: 'OCL', cat: 'Shaders & GPU',
    g: C({
      pre: true,
      kw: `${CKW} __kernel kernel __global global __local local __constant constant __private private __read_only read_only __write_only write_only __attribute__`,
      types: `${CTYPES} half uchar ushort uint ulong float2 float3 float4 float8 float16 int2 int3 int4 int8 int16 uint2 uint4 char4 uchar4 image2d_t image3d_t sampler_t event_t`,
      consts: 'true false NULL CLK_LOCAL_MEM_FENCE CLK_GLOBAL_MEM_FENCE',
      builtins: 'get_global_id get_local_id get_group_id get_global_size get_local_size get_num_groups barrier mem_fence atomic_add atomic_inc read_imagef write_imagef mad fma clamp mix dot cross normalize length sqrt rsqrt native_sin native_cos',
    }),
  },
  {
    id: 'ispc', name: 'ISPC', ext: 'ispc isph', color: '#2d68b1', label: 'ISP', cat: 'Shaders & GPU',
    g: C({ pre: true, kw: `${CKW} export uniform varying foreach foreach_tiled foreach_active foreach_unique programIndex programCount task launch sync cif cwhile cdo cfor soa`, types: CTYPES, consts: 'true false NULL' }),
  },
  // ------------------------------------------------------------ application / general purpose
  {
    id: 'groovy', name: 'Groovy', ext: 'groovy gvy gy gsh gradle', color: '#4298b8', label: 'GRV', cat: 'JVM', files: 'jenkinsfile', sh: 'groovy',
    g: C({
      str: `"'`, triple: true, interp: '$', caps: true, anno: '@[A-Za-z_][\\w.]*',
      kw: 'abstract as assert break case catch class const continue def default do else enum extends final finally for goto if implements import in instanceof interface native new package private protected public return static strictfp super switch synchronized this threadsafe throw throws trait transient try var void volatile while pipeline agent stages stage steps sh echo environment post always success failure node',
      types: 'boolean byte char short int long float double String Object List Map Set Integer Closure BigDecimal',
      consts: 'true false null it',
      builtins: 'println print each collect find findAll inject with sleep',
    }),
  },
  {
    id: 'crystal', name: 'Crystal', ext: 'cr', color: '#000100', label: 'CR', cat: 'Application', sh: 'crystal',
    g: H({
      interp: '#{', sym: true, caps: true, sigil: '@', indent: 'end', openers: 'def class module struct if unless while until case begin do lib enum macro annotation union',
      kw: 'abstract alias annotation as as? asm begin break case class def do else elsif end ensure enum extend for fun if in include instance_sizeof is_a? lib macro module next nil? of offsetof out pointerof private protected require rescue responds_to? return select self sizeof struct super then type typeof uninitialized union unless until when while with yield',
      types: 'Int8 Int16 Int32 Int64 Int128 UInt8 UInt16 UInt32 UInt64 Float32 Float64 String Char Bool Symbol Array Hash Tuple NamedTuple Nil Proc Range Regex Set Pointer Slice',
      consts: 'true false nil',
      builtins: 'puts print p pp gets raise loop spawn sleep getter setter property',
    }),
  },
  {
    id: 'pony', name: 'Pony', ext: 'pony', color: '#1d1c1c', label: 'PNY', cat: 'Application',
    g: C({
      nest: true, triple: true, caps: true,
      kw: 'actor addressof and as be break class compile_error compile_intrinsic consume continue digestof do else elseif embed end error for fun if ifdef iftype in interface is isnt lambda let match new not object or primitive recover repeat return struct then this trait try type until use var where while with xor iso trn ref val box tag',
      types: 'Bool I8 I16 I32 I64 I128 ILong ISize U8 U16 U32 U64 U128 ULong USize F32 F64 String Array Env None',
      consts: 'true false',
    }),
  },
  {
    id: 'chapel', name: 'Chapel', ext: 'chpl', color: '#8dc63f', label: 'CHP', cat: 'Scientific',
    g: C({
      kw: 'align as atomic begin borrowed break by catch class cobegin coforall config const continue defer delete dmapped do domain else enum except export extern for forall foreach forwarding if import in index inline inout iter label lambda let lifetime local locale manage module new noinit on only operator otherwise out override owned param private proc prototype public record reduce ref require return scan select serial shared single sparse subdomain sync then this throw throws try type union unmanaged use var when where while with yield zip',
      types: 'bool int uint real imag complex string bytes range nothing void',
      consts: 'true false nil here',
      builtins: 'writeln write writef read readln',
    }),
  },
  {
    id: 'mojo', name: 'Mojo', ext: 'mojo 🔥', color: '#ff4c1f', label: 'MOJ', cat: 'Scientific', sh: 'mojo',
    g: H({
      triple: true, indent: 'offside', caps: true, anno: '@[A-Za-z_][\\w.]*',
      kw: 'and as assert async await break class continue def del elif else except finally fn for from global if import in is lambda nonlocal not or pass raise return struct trait try var while with yield alias let inout owned borrowed mut ref raises capturing',
      types: 'Int Int8 Int16 Int32 Int64 UInt8 UInt16 UInt32 UInt64 Float16 Float32 Float64 Bool String StringLiteral SIMD DType List Dict Optional Tuple Pointer UnsafePointer AnyType',
      consts: 'True False None',
      builtins: 'print len range int str abs min max',
    }),
  },
  {
    id: 'gleam', name: 'Gleam', ext: 'gleam', color: '#ffaff3', label: 'GLM', cat: 'Functional',
    g: C({
      block: [], str: '"', caps: true, anno: '@[A-Za-z_]\\w*',
      kw: 'as assert auto case const delegate derive echo else fn if implement import let macro opaque panic pub test todo type use',
      types: 'Int Float String Bool List Result Option Nil BitArray Dict',
      consts: 'True False Nil Ok Error',
    }),
  },
  {
    id: 'roc', name: 'Roc', ext: 'roc', color: '#7c38f5', label: 'ROC', cat: 'Functional',
    g: H({
      str: `"'`, triple: true, interp: '\\(', caps: true,
      kw: 'app as dbg crash else expect expect-fx exposes generates if implements import imports interface is module packages platform provides requires then to when where with',
      types: 'Str Num I8 I16 I32 I64 I128 U8 U16 U32 U64 U128 F32 F64 Dec Bool List Dict Set Result Task',
      consts: 'Bool.true Bool.false Ok Err',
    }),
  },
  {
    id: 'grain', name: 'Grain', ext: 'gr', color: '#ff7f50', label: 'GR', cat: 'Functional',
    g: C({
      caps: true, anno: '@[A-Za-z_]\\w*',
      kw: 'module include from use provide abstract let mut rec type enum record if else match while for continue break return assert throw fail exception foreign wasm and or',
      types: 'Number Int32 Int64 Float32 Float64 Rational BigInt String Char Bool Void List Array Option Result',
      consts: 'true false void Some None Ok Err',
    }),
  },
  {
    id: 'motoko', name: 'Motoko', ext: 'motoko', color: '#fbb03b', label: 'MO', cat: 'Smart Contracts',
    g: C({
      nest: true, caps: true,
      kw: 'actor and assert async async* await await* break case catch class composite continue debug debug_show do else finally flexible for func if ignore import in label let loop module not object or persistent private public query return shared stable switch system throw to_candid from_candid transient try type var while with',
      types: 'Bool Char Text Nat Nat8 Nat16 Nat32 Nat64 Int Int8 Int16 Int32 Int64 Float Blob Principal Error None Any',
      consts: 'true false null',
    }),
  },
  {
    id: 'ballerina', name: 'Ballerina', ext: 'bal', color: '#ff5000', label: 'BAL', cat: 'Application',
    g: C({
      block: [], str: '"`', anno: '@[A-Za-z_][\\w:]*',
      kw: 'import as public private external final service resource function object record annotation parameter transformer worker listener remote xmlns returns version channel abstract client const typeof source on field if else match foreach while continue break fork join from where let select order by ascending descending limit check checkpanic panic trap return transaction abort retry rollback commit lock new start flush wait do type var is in',
      types: 'int float decimal boolean string byte map json xml table stream any anydata never error future typedesc handle readonly',
      consts: 'true false null',
    }),
  },
  {
    id: 'haxe', name: 'Haxe', ext: 'hx hxsl', color: '#df7900', label: 'HX', cat: 'Application',
    g: C({
      caps: true, pre: true, interp: '${', anno: '@:?[A-Za-z_]\\w*',
      kw: 'abstract break case cast catch class continue default do dynamic else enum extends extern final for function if implements import in inline interface macro new operator overload override package private public return static switch this throw try typedef untyped using var while',
      types: 'Int Float String Bool Void Dynamic Array Map Null Any',
      consts: 'true false null',
      builtins: 'trace Std Math',
    }),
  },
  {
    id: 'hxml', name: 'Haxe Build (hxml)', ext: 'hxml', color: '#df7900', label: 'HXM', cat: 'Build & DevOps',
    g: H({ str: '"', kw: '', extra: [[/^\s*-{1,2}[\w-]+/, 'keyword']] }),
  },
  {
    id: 'actionscript', name: 'ActionScript', ext: 'as', color: '#882b0f', label: 'AS', cat: 'Application',
    g: C({
      caps: true,
      kw: 'as break case catch class const continue default delete do dynamic each else extends false final finally for function get if implements import in include instanceof interface internal is namespace native new null override package private protected public return set static super switch this throw true try typeof use var void while with',
      types: 'Array Boolean Class Date Error Function int Number Object RegExp String uint Vector XML XMLList void',
      consts: 'true false null undefined NaN Infinity',
      builtins: 'trace',
    }),
  },
  {
    id: 'ceylon', name: 'Ceylon', ext: 'ceylon', color: '#dfa535', label: 'CEY', cat: 'JVM',
    g: C({ nest: true, caps: true, str: `"'\``, kw: 'assembly module package import alias class interface object given value assign void function new of extends satisfies abstracts in out return break continue throw assert dynamic if else switch case for while try catch finally then let this outer super is exists nonempty shared abstract formal default actual variable late native deprecated final sealed annotation suppressWarnings small', consts: 'true false null' }),
  },
  {
    id: 'fantom', name: 'Fantom', ext: 'fan fwt', color: '#14253c', label: 'FAN', cat: 'JVM',
    g: C({ line: ['//', '**'], caps: true, str: `"'\``, kw: 'abstract as assert break case catch class const continue default do else enum facet final finally for foreach if internal is isnot it mixin native new once override private protected public readonly return static super switch this throw try using virtual volatile void while', consts: 'true false null' }),
  },
  {
    id: 'xtend', name: 'Xtend', ext: 'xtend', color: '#24255d', label: 'XT', cat: 'JVM',
    g: C({ str: `"'`, triple: false, caps: true, anno: '@[A-Za-z_][\\w.]*', kw: 'abstract annotation as case catch class create def default dispatch do else enum extends extension final finally for if implements import instanceof interface native new override package private protected public return static super switch synchronized throw try typeof val var while', consts: 'true false null it this' }),
  },
  {
    id: 'wren', name: 'Wren', ext: 'wren', color: '#383838', label: 'WRN', cat: 'Game Dev',
    g: C({ nest: true, str: '"', interp: '\\(', caps: true, kw: 'as break class construct continue else false for foreign if import in is null return static super this true var while', consts: 'true false null', builtins: 'System Fiber Fn List Map Num Object Range String' }),
  },
  {
    id: 'squirrel', name: 'Squirrel', ext: 'nut', color: '#800000', label: 'NUT', cat: 'Game Dev',
    g: C({ line: ['//', '#'], kw: 'base break case catch class clone continue const default delete else enum extends for foreach function if in instanceof local resume return static switch this throw try typeof while yield constructor rawcall', consts: 'true false null', builtins: 'print array seterrorhandler getroottable' }),
  },
  {
    id: 'angelscript', name: 'AngelScript', ext: 'angelscript', color: '#c7d7dc', label: 'ANG', cat: 'Game Dev',
    g: C({ pre: true, kw: 'and abstract auto break case cast catch class const continue default do else enum explicit external final for from funcdef function get if import in inout interface is mixin namespace not or out override private property protected return set shared super switch this try typedef while xor', types: 'void bool int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 float double string array dictionary', consts: 'true false null' }),
  },
  {
    id: 'gdscript', name: 'GDScript', ext: 'gd', color: '#355570', label: 'GD', cat: 'Game Dev',
    g: H({
      triple: true, indent: 'offside', caps: true, anno: '@[A-Za-z_]\\w*', sigil: '$',
      kw: 'if elif else for while match break continue pass return class class_name extends is in as self signal func static const enum var breakpoint preload await yield assert void and or not super tool onready export setget remote master puppet',
      types: 'bool int float String StringName NodePath Vector2 Vector2i Vector3 Vector3i Vector4 Color Rect2 Transform2D Transform3D Basis Quaternion Plane AABB RID Object Array Dictionary Callable Signal PackedByteArray PackedStringArray Node Node2D Node3D',
      consts: 'true false null PI TAU INF NAN',
      builtins: 'print print_debug push_error push_warning len range randi randf abs clamp lerp min max str int float load get_node queue_free',
    }),
  },
  {
    id: 'gml', name: 'GameMaker Language', ext: 'gml', color: '#71b417', label: 'GML', cat: 'Game Dev',
    g: C({ pre: false, kw: 'if else while do for switch case default break continue return exit with repeat until var globalvar function constructor new delete static try catch finally throw enum and or not xor div mod', consts: 'true false noone self other all global undefined pi', builtins: 'show_debug_message instance_create_layer instance_destroy draw_text draw_sprite irandom random keyboard_check mouse_check_button array_length string_length real string' }),
  },
  {
    id: 'papyrus', name: 'Papyrus', ext: 'psc', color: '#6600cc', label: 'PAP', cat: 'Game Dev',
    g: { line: [';'], block: [[';/', '/;']], str: '"', ci: true, extra: [[/\{[^}]*\}/, 'comment']], indent: 'end', openers: 'if while function event state', kw: 'scriptname extends import if elseif else endif while endwhile function endfunction event endevent state endstate auto property endproperty return new as global native hidden conditional', types: 'bool int float string var', consts: 'true false none self parent' },
  },
  {
    id: 'unrealscript', name: 'UnrealScript', ext: 'uc', color: '#a54c4d', label: 'UC', cat: 'Game Dev',
    g: C({ ci: true, pre: true, kw: 'abstract array assert auto break case class config const continue default defaultproperties delegate do else enum event exec extends final for foreach function global goto if ignores implements import interface latent local native noexport optional out private protected public reliable replication return simulated singular state static struct super switch until var while', types: 'bool byte float int name string vector rotator object actor', consts: 'true false none self' }),
  },
  {
    id: 'pawn', name: 'Pawn', ext: 'pwn sma', color: '#dbb284', label: 'PWN', cat: 'Game Dev',
    g: C({ pre: true, kw: 'assert break case char const continue default defined do else enum exit for forward goto if native new operator public return sizeof sleep state static stock switch tagof while', consts: 'true false cellmin cellmax' }),
  },
  {
    id: 'qml', name: 'QML', ext: 'qml qmlproject', color: '#44a51c', label: 'QML', cat: 'Application',
    g: C({ caps: true, str: `"'\``, kw: 'import as property readonly required default signal alias function var let const if else for while do switch case return break continue new delete typeof instanceof in of on pragma component enum', types: 'bool int real double string url color list var date point rect size font vector3d', consts: 'true false null undefined', builtins: 'console Qt parent anchors width height id' }),
  },
  // ------------------------------------------------------------ JS / web adjacent
  {
    id: 'livescript', name: 'LiveScript', ext: 'ls', color: '#499886', label: 'LS', cat: 'Web',
    g: H({ block: [['/*', '*/']], triple: true, interp: '#{', indent: 'offside', kw: 'if else unless for own in of from to til by while until loop switch case default fallthrough break continue return then when try catch finally throw class extends implements new delete typeof instanceof is isnt and or not xor let const var function do export import require yield async await it that this super', consts: 'true false yes no on off null void undefined' }),
  },
  {
    id: 'imba', name: 'Imba', ext: 'imba', color: '#16cec6', label: 'IMB', cat: 'Web',
    g: H({ block: [['###', '###']], triple: true, interp: '{', indent: 'offside', kw: 'and await begin break by case catch class const continue css def do elif else export extend extern finally for global if import in instanceof is isa isnt let loop new not of or prop require return self static super switch tag then this throw try typeof undefined unless until var when while yield attr', consts: 'true false null undefined yes no' }),
  },
  {
    id: 'civet', name: 'Civet', ext: 'civet', color: '#b0a1ff', label: 'CVT', cat: 'Web',
    g: C({ line: ['//', '#'], str: `"'\``, triple: true, interp: '${', indent: 'offside', kw: 'if else unless for of in while until loop do switch when case default break continue return try catch finally throw class extends new delete typeof instanceof is not and or let const var function async await yield import export from as type interface enum declare', consts: 'true false null undefined yes no' }),
  },
  // ------------------------------------------------------------ Python / Ruby / Lua / PHP / Perl family
  {
    id: 'cython', name: 'Cython', ext: 'pyx pxd pxi', color: '#fedf5b', label: 'CYX', cat: 'Scientific',
    g: H({ triple: true, indent: 'offside', anno: '@[A-Za-z_][\\w.]*', kw: 'and as assert async await break cdef cpdef ctypedef cimport class continue def del elif else except extern finally for from gil global if import in include inline is lambda nogil nonlocal not or pass print property public raise readonly return struct try union while with yield enum fused', types: 'int long float double char bint size_t Py_ssize_t object list dict tuple str bytes unsigned signed', consts: 'True False None NULL', builtins: 'print len range sizeof malloc free' }),
  },
  {
    id: 'rbs', name: 'RBS (Ruby Signature)', ext: 'rbs', color: '#701516', label: 'RBS', cat: 'Scripting',
    g: H({ caps: true, sym: true, kw: 'class module interface type def attr_reader attr_writer attr_accessor include extend prepend alias self instance singleton end void untyped top bot nil bool public private out in unchecked', consts: 'true false nil' }),
  },
  {
    id: 'luau', name: 'Luau', ext: 'luau', color: '#00a2ff', label: 'LUU', cat: 'Game Dev',
    g: { line: ['--'], block: [['--[[', ']]']], str: `"'\``, interp: '{', indent: 'end', openers: 'function if for while do repeat', kw: 'and break continue do else elseif end export for function if in local not or repeat return then type typeof until while', types: 'any boolean number string nil never unknown thread userdata buffer vector', consts: 'true false nil', builtins: 'print warn error assert pcall xpcall require typeof tostring tonumber ipairs pairs next select setmetatable getmetatable rawget rawset table string math task game workspace script Instance Vector3 CFrame' },
  },
  {
    id: 'moonscript', name: 'MoonScript', ext: 'moon', color: '#ff4585', label: 'MN', cat: 'Scripting', sh: 'moon',
    g: { line: ['--'], str: `"'`, interp: '#{', indent: 'offside', sigil: '@', kw: 'and break class continue do else elseif export extends for from if import in local not or return switch then unless using when while with super', consts: 'true false nil self', builtins: 'print pairs ipairs table string math require' },
  },
  {
    id: 'teal', name: 'Teal', ext: 'tl', color: '#00b1bc', label: 'TL', cat: 'Scripting',
    g: { line: ['--'], block: [['--[[', ']]']], str: `"'`, indent: 'end', openers: 'function if for while do repeat record enum', kw: 'and break do else elseif end enum for function global goto if in local not or record repeat return then type until while interface where', types: 'any boolean integer number string nil thread table', consts: 'true false nil', builtins: 'print pairs ipairs require tostring tonumber setmetatable' },
  },
  {
    id: 'fennel', name: 'Fennel', ext: 'fnl', color: '#fff3d7', label: 'FNL', cat: 'Lisp', sh: 'fennel',
    g: { mode: 'lisp', defs: 'fn lambda λ macro local var global', kw: 'fn lambda λ let local var global set tset if when unless do while for each icollect collect accumulate match case values and or not import-macros macros require-macros include length', builtins: 'print pairs ipairs table.insert string.format require tostring', consts: 'true false nil' },
  },
  {
    id: 'hack', name: 'Hack', ext: 'hack hhi', color: '#878787', label: 'HCK', cat: 'Web', sh: 'hhvm',
    g: C({ line: ['//', '#'], sigil: '$', anno: '<<[^>]*>>', kw: 'abstract as async await break case catch class classname concurrent const continue default do echo else elseif enum extends final finally for foreach function if implements include inout instanceof insteadof interface invariant is list namespace new newtype noreturn private protected public require return shape static super switch throw trait try tuple type use using where while yield', types: 'arraykey bool dict dynamic float int keyset mixed nonnull noreturn num string vec void', consts: 'true false null' }),
  },
  {
    id: 'raku', name: 'Raku', ext: 'raku rakumod rakutest rakudoc p6 pm6 pl6 t6', color: '#0000fb', label: 'RAK', cat: 'Scripting', sh: 'raku perl6 rakudo',
    g: H({
      interp: '{', sigil: '$@%&', caps: true,
      kw: 'my our has state constant let temp sub method submethod multi proto only class role grammar module package unit use need require import export is does but if elsif else unless with orwith without for loop while until repeat given when default return last next redo proceed succeed fail die try catch CATCH CONTROL LEAVE KEEP UNDO BEGIN END INIT ENTER gather take start await react whenever supply and or not xor so where token rule regex',
      types: 'Int Num Rat Str Bool Array Hash List Seq Map Set Bag Any Mu Cool Pair Range Promise Supply Channel IO',
      consts: 'True False Nil Empty self',
      builtins: 'say print put note dd printf sprintf chomp lines words split join map grep sort reverse elems keys values kv pairs sum min max abs sqrt',
    }),
  },
  // ------------------------------------------------------------ BASIC & friends
  {
    id: 'qbasic', name: 'BASIC (QBasic/FreeBASIC)', ext: 'bas bi qb64', color: '#ff0000', label: 'BAS', cat: 'Legacy', aliases: 'basic freebasic qb64 gwbasic',
    g: { line: ["'", 'rem'], str: '"', esc: false, ci: true, indent: 'end', openers: 'sub function if for do while select type', kw: 'and as beep call case cls color common const data declare def defint defsng defdbl deflng defstr dim do else elseif end endif erase exit for function gosub goto if input is let line locate loop mod next not on open option or print randomize read redim rem restore resume return screen select shared sleep step stop sub swap system then to type until wend while width write xor byval byref static public private namespace scope using extends class property constructor destructor operator this', types: 'integer long single double string boolean byte ubyte short ushort uinteger ulong longint ulongint any ptr zstring', consts: 'true false null', builtins: 'abs asc atn chr$ cint clng cos csng cdbl date$ exp fix hex$ instr int lcase$ left$ len log ltrim$ mid$ oct$ right$ rnd rtrim$ sgn sin space$ sqr str$ string$ tan time$ timer ucase$ val inkey$ peek poke' },
  },
  {
    id: 'purebasic', name: 'PureBasic', ext: 'pb pbi', color: '#5a6986', label: 'PB', cat: 'Legacy',
    g: { line: [';'], str: '"', esc: false, ci: true, indent: 'end', openers: 'procedure if for foreach while repeat select structure macro module', kw: 'and break case compilerif compilerelse compilerendif continue data datasection declare declaremodule default define deftype dim else elseif end enddatasection enddeclaremodule endenumeration endif endimport endinterface endmacro endmodule endprocedure endselect endstructure endwith enumeration extends fakereturn for foreach forever global gosub goto if import includefile interface macro module newlist next not or procedure procedurereturn protected prototype read repeat restore return select shared static step structure swap then to until wend while with xor', consts: '#true #false #null' },
  },
  {
    id: 'blitzmax', name: 'BlitzMax', ext: 'bmx', color: '#cd6400', label: 'BMX', cat: 'Legacy',
    g: { line: ["'"], str: '"', esc: false, ci: true, indent: 'end', openers: 'function method type if for while repeat select', kw: 'strict superstrict framework import module include local global const field function endfunction method endmethod type endtype extends abstract final return if then else elseif endif for to step next eachin while wend endwhile repeat until forever select case default endselect exit continue new release and or not shl shr sar mod try catch endtry throw', types: 'int long float double byte short string object', consts: 'true false null self super pi' },
  },
  {
    id: 'autoit', name: 'AutoIt', ext: 'au3', color: '#1c3552', label: 'AU3', cat: 'Scripting',
    g: { line: [';'], block: [['#cs', '#ce']], str: `"'`, esc: false, ci: true, sigil: '$@', indent: 'end', openers: 'func if for while do select switch with', kw: 'and byref case const continueloop continuecase default dim do else elseif endfunc endif endselect endswitch endwith enum exit exitloop false for func global if in local next not null or redim return select static step switch then to true until volatile wend while with', builtins: 'msgbox consolewrite run send sleep winwait winactivate controlclick filereadline stringsplit stringreplace', anno: '#[A-Za-z-]+' },
  },
  {
    id: 'autohotkey', name: 'AutoHotkey', ext: 'ahk ah2', color: '#6594b9', label: 'AHK', cat: 'Scripting',
    g: { line: [';'], block: [['/*', '*/']], str: `"'`, esc: false, ci: true, anno: '#[A-Za-z]+', kw: 'if else loop while until for in break continue return goto gosub try catch finally throw switch case default class extends static global local new super this and or not is', builtins: 'msgbox send sendinput sleep run winactivate winwait inputbox tooltip settimer hotkey exitapp reload fileappend fileread regexmatch regexreplace strlen substr instr', consts: 'true false a_index a_scriptdir a_now clipboard' },
  },
  {
    id: 'applescript', name: 'AppleScript', ext: 'applescript scpt', color: '#101f1f', label: 'APS', cat: 'Scripting', sh: 'osascript',
    g: { line: ['--', '#'], block: [['(*', '*)']], nest: true, str: '"', ci: true, indent: 'end', openers: 'tell if repeat on try considering ignoring using with', kw: 'about above after against and apart around as aside at back before beginning behind below beneath beside between but by considering contain contains continue copy div does eighth else end equal equals error every exit false fifth first for fourth from front get given global if ignoring in instead into is it its last local me middle mod my ninth not of on onto or out over prop property put ref reference repeat return returning script second set seventh since sixth some tell tenth that the then third through thru timeout times to transaction true try until where while whose with without', builtins: 'display dialog notification activate quit open close delay say beep log', consts: 'true false missing value' },
  },
  // ------------------------------------------------------------ Legacy / classic
  {
    id: 'fortran', name: 'Fortran', ext: 'f90 f95 f03 f08 f18', color: '#4d41b1', label: 'F90', cat: 'Scientific',
    g: { line: ['!'], str: `"'`, esc: false, dbl: true, ci: true, indent: 'end', openers: 'program module subroutine function do if select type interface block where forall associate', kw: 'allocatable allocate assign associate asynchronous backspace bind block call case class close codimension common contains contiguous continue critical cycle data deallocate default deferred dimension do elemental else elseif elsewhere end endblock enddo endfile endif endinterface endmodule endprogram endselect endsubroutine endfunction endtype entry enum enumerator equivalence exit extends external final flush forall format function generic goto if implicit import impure in inout include inquire intent interface intrinsic kind len module namelist none non_overridable nopass nullify only open operator optional out parameter pass pause pointer print private procedure program protected public pure read recursive result return rewind save select sequence stop submodule subroutine sync target then type use value volatile wait where while write', types: 'integer real double precision complex character logical', consts: '.true. .false.', builtins: 'abs acos aimag aint allocated anint asin atan atan2 ceiling char cmplx conjg cos cosh count cshift dble digits dim dot_product dprod eoshift epsilon exp exponent floor fraction huge iachar ichar index int kind lbound len len_trim log log10 matmul max maxval merge min minval mod modulo nint norm2 pack present product random_number real repeat reshape scan shape sign sin sinh size spread sqrt sum tan tanh tiny transpose trim ubound unpack verify' },
  },
  {
    id: 'fortran-fixed', name: 'Fortran (Fixed Form)', ext: 'f for f77 ftn fpp', color: '#4d41b1', label: 'F77', cat: 'Scientific',
    g: { line: ['!'], line0: ['C', 'c', '*', '!'], str: `"'`, esc: false, dbl: true, ci: true, indent: 'end', openers: 'program module subroutine function do if select type interface block where forall associate', kw: 'allocatable allocate assign associate asynchronous backspace bind block call case class close codimension common contains contiguous continue critical cycle data deallocate default deferred dimension do elemental else elseif elsewhere end endblock enddo endfile endif endinterface endmodule endprogram endselect endsubroutine endfunction endtype entry enum enumerator equivalence exit extends external final flush forall format function generic goto if implicit import impure in inout include inquire intent interface intrinsic kind len module namelist none non_overridable nopass nullify only open operator optional out parameter pass pause pointer print private procedure program protected public pure read recursive result return rewind save select sequence stop submodule subroutine sync target then type use value volatile wait where while write', types: 'integer real double precision complex character logical', consts: '.true. .false.', builtins: 'abs acos aimag aint allocated anint asin atan atan2 ceiling char cmplx conjg cos cosh count cshift dble digits dim dot_product dprod eoshift epsilon exp exponent floor fraction huge iachar ichar index int kind lbound len len_trim log log10 matmul max maxval merge min minval mod modulo nint norm2 pack present product random_number real repeat reshape scan shape sign sin sinh size spread sqrt sum tan tanh tiny transpose trim ubound unpack verify' },
  },
  {
    id: 'cobol', name: 'COBOL', ext: 'cob cbl cpy cobol', color: '#005ca5', label: 'COB', cat: 'Legacy',
    g: { line: ['*>'], extra: [[/^.{6}[*\/].*$/, 'comment']], str: `"'`, esc: false, dbl: true, ci: true, ident: '[A-Za-z_][\\w-]*', call: false, kw: 'accept access add advancing after all alphabetic alphanumeric also alter alternate and any are area areas ascending assign at author before binary blank block bottom by call cancel cd cf ch character characters class close code collating column comma common communication comp computational compute configuration contains content continue control converting copy corr corresponding count currency data date day debugging decimal-point declaratives delete delimited delimiter depending descending destination detail disable display divide division down duplicates dynamic else enable end end-if end-perform end-read end-evaluate end-compute end-call end-string end-write environment equal error evaluate every exception exit extend fd file file-control filler final first footing for from function generate giving global go greater group heading high-value high-values identification if in index indexed initial initialize input input-output inspect installation into invalid is just justified key label last leading left length less limit line linkage lock low-value low-values memory merge message mode move multiply native negative next no not number numeric object-computer occurs of off omitted on open optional or order organization other output overflow packed-decimal padding page paragraph perform pic picture pointer position positive procedure program program-id purge queue quote quotes random read receive record records redefines reel reference relative release remainder removal renames replace replacing report reserve reset return rewind rewrite right rounded run same screen sd search section security segment select send sentence separate sequence sequential set sign size sort source space spaces special-names standard start status stop string subtract sum suppress symbolic sync synchronized table tallying tape terminal test text than then through thru time times to top trailing type unit unstring until up upon usage use using value values varying when with working-storage write zero zeros zeroes' },
  },
  {
    id: 'ada', name: 'Ada', ext: 'adb ads ada', color: '#02f88c', label: 'ADA', cat: 'Systems',
    g: { line: ['--'], str: '"', esc: false, dbl: true, ci: true, indent: 'end', openers: 'procedure function package task protected if loop case declare begin record select accept', extra: [[/'(?:.)'/, 'string'], [/'[A-Za-z_]\w*/, 'annotation']], kw: 'abort abs abstract accept access aliased all and array at begin body case constant declare delay delta digits do else elsif end entry exception exit for function generic goto if in interface is limited loop mod new not null of or others out overriding package pragma private procedure protected raise range record rem renames requeue return reverse select separate some subtype synchronized tagged task terminate then type until use when while with xor', types: 'Boolean Integer Natural Positive Float Long_Float Character String Wide_String Duration', consts: 'True False null', builtins: 'Put_Line Put Get Get_Line New_Line Ada Text_IO Integer_IO' },
  },
  {
    id: 'pli', name: 'PL/I', ext: 'pli pl1', color: '#6d3b9f', label: 'PLI', cat: 'Legacy',
    g: { block: [['/*', '*/']], str: `'"`, esc: false, dbl: true, ci: true, kw: 'alloc allocate begin by call char character close dcl declare do else end entry exit fixed float format free get go goto if init initial label leave on open options otherwise output print proc procedure put read recursive return returns revert select signal skip static stop then to until varying when while write bin binary dec decimal based pointer ptr', consts: '' },
  },
  {
    id: 'rpgle', name: 'RPG (ILE)', ext: 'rpgle sqlrpgle rpg', color: '#2bde21', label: 'RPG', cat: 'Legacy',
    g: { line: ['//'], str: "'", esc: false, dbl: true, ci: true, kw: 'ctl-opt dcl-s dcl-c dcl-ds end-ds dcl-f dcl-pr end-pr dcl-pi end-pi dcl-proc end-proc if elseif else endif dow enddo dou for endfor select when other endsl monitor on-error endmon return leave iter exsr begsr endsr eval callp chain read reade setll write update delete exfmt close open clear reset dsply inz const value options likeds qualified dim template extproc export', types: 'char varchar int uns packed zoned bindec float date time timestamp ind pointer', consts: '*on *off *blanks *zeros *null *hival *loval *inlr' },
  },
  {
    id: 'modula2', name: 'Modula-2', ext: 'mod def mi', color: '#10253f', label: 'M2', cat: 'Legacy',
    g: { block: [['(*', '*)']], nest: true, str: `"'`, esc: false, kw: 'AND ARRAY BEGIN BY CASE CONST DEFINITION DIV DO ELSE ELSIF END EXCEPT EXIT EXPORT FINALLY FOR FORWARD FROM IF IMPLEMENTATION IMPORT IN LOOP MOD MODULE NOT OF OR PACKEDSET POINTER PROCEDURE QUALIFIED RECORD REM REPEAT RETRY RETURN SET THEN TO TYPE UNTIL VAR WHILE WITH', types: 'BOOLEAN CHAR INTEGER CARDINAL REAL LONGREAL LONGINT BITSET PROC', consts: 'TRUE FALSE NIL', builtins: 'ABS CAP CHR DEC EXCL FLOAT HALT HIGH INC INCL MAX MIN ODD ORD SIZE TRUNC VAL WriteString WriteLn WriteInt' },
  },
  {
    id: 'oberon', name: 'Oberon', ext: 'ob ob2 obn', color: '#b5a0e6', label: 'OBN', cat: 'Legacy',
    g: { block: [['(*', '*)']], nest: true, str: `"'`, esc: false, kw: 'ARRAY BEGIN BY CASE CONST DIV DO ELSE ELSIF END EXIT FOR IF IMPORT IN IS LOOP MOD MODULE NIL OF OR POINTER PROCEDURE RECORD REPEAT RETURN THEN TO TYPE UNTIL VAR WHILE WITH', types: 'BOOLEAN CHAR INTEGER LONGINT REAL LONGREAL SET BYTE', consts: 'TRUE FALSE NIL' },
  },
  {
    id: 'eiffel', name: 'Eiffel', ext: 'e', color: '#4d6977', label: 'EIF', cat: 'Legacy',
    g: { line: ['--'], str: `"'`, esc: false, caps: true, indent: 'end', openers: 'class feature do if from inspect loop check once', kw: 'across agent alias all and as assign attached attribute check class convert create debug deferred detachable do else elseif end ensure expanded export external feature from frozen if implies inherit inspect invariant like local loop not note obsolete old once only or precursor redefine rename require rescue retry select separate some then undefine until variant when xor', types: 'INTEGER REAL DOUBLE BOOLEAN CHARACTER STRING ANY NONE ARRAY LIST', consts: 'True False Void Current Result' },
  },
  {
    id: 'smalltalk', name: 'Smalltalk', ext: 'smalltalk squeak sources', color: '#596706', label: 'STK', cat: 'Legacy',
    g: { block: [['"', '"']], str: "'", esc: false, dbl: true, extra: [ [/#[A-Za-z_][\w:]*/, 'constant'], [/\$./, 'string'], [/[A-Za-z_]\w*:/, 'function']], kw: 'self super thisContext', consts: 'true false nil', caps: true, call: false },
  },
  {
    id: 'forth', name: 'Forth', ext: 'fth 4th forth frt', color: '#341708', label: 'FTH', cat: 'Legacy', sh: 'gforth',
    g: { line: ['\\'], str: '"', ci: true, ident: '[^\\s]+', call: false, extra: [[/\(\s[^)]*\)/, 'comment'], [/[.sS]"\s[^"]*"/, 'string'], [/:\s+\S+/, 'function']], kw: ': ; if else then do loop +loop begin until while repeat again case of endof endcase variable constant value to create does> allot cells cell+ here , c, immediate recurse exit leave i j', builtins: 'dup drop swap over rot nip tuck pick roll . .s emit cr type key @ ! +! c@ c! and or xor invert negate abs min max mod /mod */ = < > 0= 0< words see' },
  },
  {
    id: 'postscript', name: 'PostScript', ext: 'ps eps', color: '#da291c', label: 'PS', cat: 'Legacy',
    g: { line: ['%'], str: '', call: false, ident: '[A-Za-z_][\\w.\\-]*', extra: [[/\((?:[^()\\]|\\.)*\)/, 'string'], [/<[0-9A-Fa-f\s]*>/, 'string'], [/\/[^\s/(){}<>\[\]%]+/, 'constant']], kw: 'def begin end if ifelse for forall repeat loop exit stop exec bind', builtins: 'moveto lineto rmoveto rlineto curveto closepath newpath stroke fill show showpage setgray setrgbcolor setlinewidth findfont scalefont setfont translate rotate scale gsave grestore arc arcn dup pop exch add sub mul div idiv mod neg copy index roll print', consts: 'true false null' },
  },
  {
    id: 'xbase', name: 'xBase / Clipper', ext: 'prg ch', color: '#403a40', label: 'PRG', cat: 'Legacy',
    g: { line: ['//', '&&', '*'], block: [['/*', '*/']], str: `"'`, esc: false, ci: true, pre: true, indent: 'end', openers: 'function procedure if do while for case class method', kw: 'function procedure return local static private public parameters if else elseif endif do while enddo for next to step case otherwise endcase exit loop begin sequence end recover class endclass method data inherit from use select go skip seek replace append blank delete recall pack zap index on set say get read clear', consts: '.t. .f. nil' },
  },
  {
    id: 'rexx', name: 'REXX', ext: 'rexx rex rexxj', color: '#d90e09', label: 'RXX', cat: 'Legacy', sh: 'rexx regina',
    g: { block: [['/*', '*/']], nest: true, str: `"'`, esc: false, dbl: true, ci: true, kw: 'address arg by call do drop else end exit expose forever if interpret iterate leave nop numeric otherwise parse procedure pull push queue return say select signal then to trace until upper value var when while with', builtins: 'abbrev abs bitand center compare copies datatype date delstr delword digits format insert lastpos left length linein lineout max min overlay pos queued random reverse right sign space strip substr subword symbol time translate trunc verify word wordindex wordlength words' },
  },
  {
    id: 'jcl', name: 'JCL', ext: 'jcl', color: '#d90e09', label: 'JCL', cat: 'Legacy',
    g: { line0: ['//*'], str: "'", esc: false, ci: true, call: false, extra: [[/^\/\/[A-Za-z0-9@#$]*/, 'type.identifier']], kw: 'job exec dd proc pend include jcllib set if then else endif output cntl endcntl', builtins: 'pgm class msgclass msglevel notify region time cond disp dsn dsname unit space vol volume dcb recfm lrecl blksize sysout' },
  },
  {
    id: 'logo', name: 'Logo', ext: 'logo lgo', color: '#ffc0cb', label: 'LGO', cat: 'Legacy',
    g: { line: [';'], str: '"', ci: true, call: false, kw: 'to end repeat if ifelse make local output stop wait while forever for foreach run', builtins: 'forward fd back bk left lt right rt penup pu pendown pd home clearscreen cs setxy setheading seth hideturtle ht showturtle st print show type setpencolor setpc random sum difference product quotient list first last butfirst bf butlast bl item word sentence', consts: 'true false' },
  },
  {
    id: 'icon', name: 'Icon / Unicon', ext: 'icn', color: '#d0db00', label: 'ICN', cat: 'Legacy',
    g: H({ kw: 'break by case create default do else end every fail global if initial invocable link local next not of procedure record repeat return static suspend then to until while class method import package', builtins: 'write writes read find upto many move tab match any bal char repl reverse map sort table list set', consts: '&null &fail' }),
  },
  {
    id: 'boo', name: 'Boo', ext: 'boo', color: '#d4bec1', label: 'BOO', cat: '.NET',
    g: H({ block: [['/*', '*/']], line: ['#', '//'], triple: true, indent: 'offside', kw: 'abstract and as break callable cast class constructor continue def destructor do elif else ensure enum event except failure final for from get given goto if import in interface internal is isa macro namespace not of or otherwise override pass private protected public raise ref return self set static struct super then transient try typeof unless virtual when while yield', types: 'bool byte char date decimal double int long object single string void', consts: 'true false null' }),
  },
  {
    id: 'nemerle', name: 'Nemerle', ext: 'n', color: '#3d3c6e', label: 'N', cat: '.NET',
    g: C({ caps: true, kw: 'abstract and base catch class def delegate do else enum event extern false finally for foreach fun if implements in interface internal lock macro match module mutable namespace new null out override params partial private protected public ref sealed static struct syntax this throw true try type typeof unless using variant virtual void volatile when where while with', consts: 'true false null' }),
  },
  // ------------------------------------------------------------ mobile / platform
  {
    id: 'smali', name: 'Smali', ext: 'smali', color: '#3ddc84', label: 'SML', cat: 'Mobile',
    g: { line: ['#'], str: '"', call: false, extra: [[/^\s*\.[a-z-]+/, 'keyword.directive'], [/L[\w/$]+;/, 'type'], [/[vp]\d+/, 'variable.predefined'], [/:[\w]+/, 'type.identifier']], kw: 'invoke-virtual invoke-direct invoke-static invoke-super invoke-interface move move-result move-result-object return return-void return-object const const-string const/4 const/16 new-instance new-array iget iput sget sput if-eq if-ne if-lt if-ge if-gt if-le if-eqz if-nez goto check-cast instance-of throw public private protected static final abstract constructor synthetic', ident: '[A-Za-z_][\\w\\-/]*' },
  },
  {
    id: 'aidl', name: 'AIDL', ext: 'aidl', color: '#34a853', label: 'AID', cat: 'Mobile',
    g: C({ caps: true, anno: '@[A-Za-z_]\\w*', kw: 'package import interface parcelable enum union in out inout oneway const', types: 'void boolean byte char int long float double String CharSequence List Map IBinder', consts: 'true false null' }),
  },
];

/** Hash comment helper for simple configuration-like languages. */
export const hashConf = (kw = '', extra: Partial<Grammar> = {}): Grammar => H({ kw, call: false, ...extra });
