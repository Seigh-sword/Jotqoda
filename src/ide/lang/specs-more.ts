import { C, H, HS, SQL, LISP, ASM, regs, markup } from './grammar';
import type { LangSpec } from './specs-code';

const X86_REGS = [
  'al ah ax eax rax bl bh bx ebx rbx cl ch cx ecx rcx dl dh dx edx rdx si esi rsi sil di edi rdi dil sp esp rsp spl bp ebp rbp bpl ip eip rip',
  regs('r', 8, 15, ['', 'd', 'w', 'b']), 'cs ds es fs gs ss', regs('xmm', 0, 15), regs('ymm', 0, 15), regs('zmm', 0, 31), regs('st', 0, 7), regs('mm', 0, 7), regs('cr', 0, 8), regs('dr', 0, 7), regs('k', 0, 7),
].join(' ');
const ARM_REGS = [regs('r', 0, 15), regs('x', 0, 30), regs('w', 0, 30), regs('v', 0, 31), regs('q', 0, 31), regs('d', 0, 31), regs('s', 0, 31), 'sp lr pc fp ip xzr wzr cpsr apsr spsr nzcv fpcr fpsr'].join(' ');
const RISCV_REGS = [regs('x', 0, 31), regs('f', 0, 31), 'zero ra sp gp tp fp pc', regs('t', 0, 6), regs('s', 0, 11), regs('a', 0, 7), regs('ft', 0, 11), regs('fs', 0, 11), regs('fa', 0, 7)].join(' ');
const X86_INS = 'mov movzx movsx movsxd lea push pop xchg add sub mul imul div idiv inc dec neg adc sbb and or xor not shl shr sal sar rol ror rcl rcr cmp test jmp je jne jz jnz jg jge jl jle ja jae jb jbe jo jno js jns jc jnc jp jnp jcxz jecxz loop loope loopne call ret retn retf leave enter int into iret syscall sysenter sysexit nop hlt cli sti cld std cmc clc stc cpuid rdtsc cbw cwd cdq cqo cwde cdqe movsb movsw movsd movsq stosb stosw stosd stosq lodsb lodsw lodsd scasb cmpsb rep repe repne repz repnz sete setne setg setl seta setb cmove cmovne cmovg cmovl bswap bt bts btr btc bsf bsr lock pushf popf pushad popad movaps movups movapd movss movsd addss addsd subss mulss divss sqrtss cvtsi2ss cvttss2si pxor paddd psubd pand por vmovaps vaddps vmulps vxorps';
const X86_DIR = 'section segment global globl extern bits use16 use32 use64 db dw dd dq dt ddq do dy dz resb resw resd resq rest times equ org align alignb struc endstruc istruc iend at incbin default rel abs proc endp macro endm end model code data stack ptr offset';
const SIZE_TYPES = 'byte word dword qword tword oword yword zword ptr near far short';

export const MORE_SPECS: LangSpec[] = [
  // ------------------------------------------------------------ query languages
  {
    id: 'tsql', name: 'T-SQL (SQL Server)', ext: 'tsql', color: '#cc2927', label: 'TSQ', cat: 'Query', comment: '--', block: ['/*', '*/'],
    g: SQL({ sigil: '@#', extra: [[/\[[^\]]*\]/, 'identifier'], [/^\s*GO\b/i, 'keyword']], kw: 'add all alter and any as asc authorization backup begin between break browse bulk by cascade case catch check checkpoint close clustered coalesce collate column commit compute constraint contains containstable continue convert create cross current current_date current_time current_timestamp current_user cursor database dbcc deallocate declare default delete deny desc disk distinct distributed double drop dump else end errlvl escape except exec execute exists exit external fetch file fillfactor for foreign freetext freetexttable from full function goto grant group having holdlock identity identity_insert identitycol if in index inner insert intersect into is join key kill left like lineno load merge national nocheck nonclustered not null nullif of off offsets on open opendatasource openquery openrowset openxml option or order outer over percent pivot plan precision primary print proc procedure public raiserror read readtext reconfigure references replication restore restrict return revert revoke right rollback rowcount rowguidcol rule save schema securityaudit select semantickeyphrasetable session_user set setuser shutdown some statistics system_user table tablesample textsize then throw to top tran transaction trigger truncate try try_convert tsequal union unique unpivot update updatetext use user values varying view waitfor when where while with within writetext output inserted deleted nocount xact_abort go', builtins: 'getdate getutcdate dateadd datediff datepart year month day isnull len ltrim rtrim upper lower substring charindex replace cast convert count sum avg min max row_number rank dense_rank ntile lag lead newid scope_identity object_id db_name format iif choose string_agg string_split json_value openjson' }),
  },
  {
    id: 'plsql', name: 'PL/SQL (Oracle)', ext: 'pls plb pck pkb pks plsql bdy', color: '#dad8d8', label: 'PLS', cat: 'Query', comment: '--', block: ['/*', '*/'],
    g: SQL({ kw: 'accept access add all alter and any array as asc audit begin between binary_integer body bulk by case cast char check close cluster collect column comment commit compress connect constant constraint continue create current cursor declare default delete desc distinct do drop else elsif end exception exclusive execute exists exit external fetch for forall found from function goto grant group having identified if immediate in index insert intersect interval into is isopen join level like limit lock loop minus mode modify natural nocopy not notfound nowait null of on open option or order others out package pipelined pragma prior procedure raise range record ref release rename replace resource return returning reverse revoke rollback row rowcount rownum rowtype savepoint select separate set share size sql start subtype synonym sysdate table then to trigger type union unique update use using values view when where while with work', builtins: 'dbms_output put_line nvl nvl2 decode to_char to_date to_number trunc round sysdate systimestamp substr instr length upper lower trim replace lpad rpad concat count sum avg min max listagg regexp_like regexp_replace regexp_substr sqlerrm sqlcode raise_application_error', types: 'number varchar2 nvarchar2 char nchar date timestamp clob blob nclob raw long boolean pls_integer binary_integer integer float real rowid urowid xmltype' }),
  },
  {
    id: 'hiveql', name: 'HiveQL / Spark SQL', ext: 'hql hive sparksql', color: '#fdee21', label: 'HQL', cat: 'Query', comment: '--', aliases: 'spark hive',
    g: SQL({ kw: 'add after all alter analyze and array as asc between bucket buckets by cache cascade case cast change cluster clustered clusterstatus collection column columns comment compute concatenate create cross cube current database databases dbproperties defined delimited delete desc describe directory distinct distribute drop else end escaped exchange exists explain export extended external false fields fileformat first following for format formatted from full function functions grant group grouping having if ignore import in index inner inpath inputformat insert intersect into is items join keys lateral left like limit lines load local location lock locks macro map merge msck not null of offset on or order out outer outputformat over overwrite partition partitioned partitions percent preceding purge range reduce regexp rename repair replace restrict revoke right rlike role row rows schema schemas select semi serde serdeproperties set sets show skewed sort sorted stored stream table tables tablesample tblproperties temporary terminated then to transform trigger truncate unbounded union uniquejoin unlock unset update use using values view when where window with', builtins: 'count sum avg min max collect_list collect_set explode posexplode get_json_object from_unixtime unix_timestamp to_date date_add date_sub datediff year month day concat concat_ws split size coalesce nvl if row_number rank dense_rank lag lead percentile approx_count_distinct' }),
  },
  {
    id: 'cql', name: 'CQL (Cassandra)', ext: 'cql', color: '#1287b1', label: 'CQL', cat: 'Query', comment: '--',
    g: SQL({ line: ['--', '//'], kw: 'add aggregate all allow alter and apply as asc authorize batch begin by clustering columnfamily compact contains count create custom delete desc describe distinct drop entries execute exists filtering finalfunc from frozen full function functions grant if in index initcond input insert into is json key keys keyspace keyspaces language limit list login materialized modify nologin norecursive not null of on options or order partition password per permission permissions primary rename replace returns revoke role roles schema select set sfunc static storage stype superuser table tables text timestamp to token trigger truncate ttl tuple type unlogged update use user users using values view where with writetime', types: 'ascii bigint blob boolean counter date decimal double duration float inet int list map set smallint text time timestamp timeuuid tinyint tuple uuid varchar varint frozen' }),
  },
  {
    id: 'kusto', name: 'Kusto (KQL)', ext: 'kql csl kusto', color: '#0078d4', label: 'KQL', cat: 'Query',
    g: { line: ['//'], str: `"'`, kw: 'let set alias declare pattern restrict access to on by with where project project-away project-rename project-reorder extend summarize order sort top take limit count distinct join union lookup mv-expand parse evaluate render as and or not in has contains startswith endswith matches regex between asc desc kind inner outer leftouter rightouter fullouter leftanti rightanti leftsemi rightsemi', builtins: 'ago now datetime timespan bin floor ceiling strcat strlen substring tolower toupper tostring toint tolong todouble iff case isempty isnotempty isnull isnotnull dcount sum avg min max percentile make_list make_set arg_max arg_min countif sumif', consts: 'true false null' },
  },
  {
    id: 'promql', name: 'PromQL', ext: 'promql', color: '#e6522c', label: 'PQL', cat: 'Query',
    g: { line: ['#'], str: `"'\``, extra: [[/\[\d+[smhdwy](?::\d*[smhdwy]?)?\]/, 'number']], kw: 'by without on ignoring group_left group_right bool offset and or unless', builtins: 'sum min max avg group stddev stdvar count count_values bottomk topk quantile rate irate increase delta idelta deriv predict_linear histogram_quantile abs absent absent_over_time ceil changes clamp clamp_max clamp_min day_of_month day_of_week days_in_month exp floor hour label_join label_replace ln log2 log10 minute month resets round scalar sort sort_desc sqrt time timestamp vector year avg_over_time min_over_time max_over_time sum_over_time count_over_time quantile_over_time stddev_over_time last_over_time' },
  },
  {
    id: 'flux', name: 'Flux (InfluxDB)', ext: 'flux', color: '#22adf6', label: 'FLX', cat: 'Query',
    g: C({ block: [], ops: '|>=<!~+\\-*\\/%', kw: 'import package option builtin return if then else and or not exists', builtins: 'from range filter map aggregateWindow yield mean sum count group sort limit pivot join union window keep drop rename to', consts: 'true false' }),
  },
  {
    id: 'spl', name: 'Splunk SPL', ext: 'spl', color: '#65a637', label: 'SPL', cat: 'Query',
    g: { line: [], str: '"', ci: true, extra: [[/```[^`]*```/, 'comment']], kw: 'search where eval stats chart timechart table fields rename sort dedup head tail top rare rex lookup join append transaction bin bucket spath inputlookup outputlookup makeresults by as over and or not in like', builtins: 'count sum avg min max dc values list earliest latest if case len lower upper substr replace tostring tonumber strftime strptime now relative_time' },
  },
  {
    id: 'xquery', name: 'XQuery', ext: 'xq xql xqm xquery xqy xqws', color: '#5232e7', label: 'XQ', cat: 'Query',
    g: { block: [['(:', ':)']], nest: true, str: `"'`, esc: false, dbl: true, sigil: '$', ident: '[A-Za-z_][\\w.:-]*', extra: [[/<\/?[\w:.-]+/, 'tag'], [/\/?>/, 'tag']], kw: 'xquery version encoding module namespace import schema declare function variable option default element attribute document text comment processing-instruction for let where order by stable ascending descending group count return if then else some every satisfies in as at typeswitch switch case instance of treat castable cast to div idiv mod union intersect except and or eq ne lt le gt ge is try catch', builtins: 'doc collection count sum avg min max string concat contains substring string-length upper-case lower-case replace tokenize exists empty not data distinct-values' },
  },
  {
    id: 'gremlin', name: 'Gremlin', ext: 'gremlin', color: '#2b8cba', label: 'GRM', cat: 'Query',
    g: C({ kw: '', builtins: 'g V E addV addE property has hasLabel hasId hasNot out in both outE inE bothE outV inV bothV otherV values valueMap elementMap path select as by where filter not and or is within without count sum max min mean order limit range tail dedup group groupCount fold unfold repeat until emit times choose optional union coalesce constant identity next toList iterate drop', consts: 'true false null' }),
  },
  {
    id: 'edgeql', name: 'EdgeQL / Gel', ext: 'edgeql esdl gel', color: '#31b6b0', label: 'EQL', cat: 'Query',
    g: { line: ['#'], str: `"'\``, sigil: '$', kw: 'select insert update delete with filter order by limit offset for union if else group using module type abstract required multi single link property constraint index annotation scalar extending function create alter drop migration commit start transaction rollback describe set reset configure analyze introspect detached global exists distinct not and or like ilike in is asc desc empty first last', types: 'str bool int16 int32 int64 float32 float64 bigint decimal uuid json datetime duration bytes array tuple', consts: 'true false' },
  },
  {
    id: 'surrealql', name: 'SurrealQL', ext: 'surql surrealql', color: '#ff00a0', label: 'SQL', cat: 'Query',
    g: SQL({ sigil: '$', kw: 'select from where create update upsert delete relate insert into set content merge patch return define remove namespace database table field index event param function scope token analyzer user let begin commit cancel transaction if else then end for break continue throw live kill sleep use info fetch split group order by limit start timeout parallel explain type schemafull schemaless permissions assert value default and or not in contains inside only omit' }),
  },
  {
    id: 'prql', name: 'PRQL', ext: 'prql', color: '#4a5da8', label: 'PRQ', cat: 'Query',
    g: H({ str: `"'`, kw: 'from select filter derive group aggregate sort take join window append loop let func into case module prql std side', builtins: 'count sum average min max stddev concat_array row_number rank lag lead', consts: 'true false null' }),
  },
  {
    id: 'malloy', name: 'Malloy', ext: 'malloy malloysql malloynb', color: '#e1654b', label: 'MLY', cat: 'Query',
    g: C({ line: ['//', '--'], kw: 'source query run extend is from join_one join_many join_cross with on where group_by aggregate calculate select nest order_by limit having top dimension measure primary_key rename accept except declare import view index sample timezone pick when else and or not desc asc by', builtins: 'count sum avg min max table duckdb bigquery postgres', consts: 'true false null' }),
  },
  {
    id: 'lookml', name: 'LookML', ext: 'lkml lookml', color: '#652b81', label: 'LKM', cat: 'Query',
    g: { line: ['#'], str: '"', call: false, extra: [[/[A-Za-z_]\w*(?=\s*:)/, 'key'], [/\$\{[^}]*\}/, 'variable'], [/;;/, 'delimiter']], kw: 'view explore dimension dimension_group measure filter parameter model join sql sql_table_name derived_table type label description hidden primary_key timeframes value_format_name drill_fields relationship include connection datagroup access_filter always_filter', consts: 'yes no' },
  },
  // ------------------------------------------------------------ smart contracts
  {
    id: 'vyper', name: 'Vyper', ext: 'vy vyi', color: '#9f4cf2', label: 'VY', cat: 'Smart Contracts',
    g: H({ triple: true, indent: 'offside', anno: '@[A-Za-z_]\\w*', kw: 'def event struct interface enum flag implements import from as return if elif else for in range pass break continue assert raise log self public view pure payable nonpayable external internal deploy constant immutable indexed extcall staticcall uses initializes exports', types: 'address bool bytes32 bytes4 decimal int128 int256 uint8 uint256 String DynArray HashMap Bytes', consts: 'True False empty msg block tx chain', builtins: 'send raw_call create_minimal_proxy_to keccak256 sha256 ecrecover len concat convert min max abs sqrt' }),
  },
  {
    id: 'move', name: 'Move', ext: 'move', color: '#4a137a', label: 'MOV', cat: 'Smart Contracts',
    g: C({ anno: '#\\[[^\\]]*\\]', kw: 'module script fun public entry native struct has copy drop store key use as const let mut if else while loop break continue return abort spec acquires friend move borrow_global borrow_global_mut exists move_to move_from phantom macro enum match', types: 'u8 u16 u32 u64 u128 u256 bool address vector signer', consts: 'true false' }),
  },
  {
    id: 'cairo', name: 'Cairo', ext: 'cairo', color: '#ff4a48', label: 'CAI', cat: 'Smart Contracts',
    g: C({ block: [], anno: '#\\[[^\\]]*\\]', kw: 'as break const continue else enum extern fn if impl implicits let loop match mod mut nopanic of pub ref return self struct super trait type use while', types: 'felt252 u8 u16 u32 u64 u128 u256 usize bool ByteArray Array Span Option Result ContractAddress', consts: 'true false None Some Ok Err' }),
  },
  {
    id: 'clarity', name: 'Clarity', ext: 'clar', color: '#5546ff', label: 'CLR', cat: 'Smart Contracts',
    g: LISP({ defs: 'define-public define-private define-read-only define-constant define-data-var define-map define-fungible-token define-non-fungible-token define-trait', kw: 'define-public define-private define-read-only define-constant define-data-var define-map define-trait impl-trait use-trait let begin if match asserts! unwrap! unwrap-panic try! ok err some and or not is-eq', builtins: 'var-get var-set map-get? map-set map-insert map-delete stx-transfer? ft-mint? ft-transfer? nft-mint? get-block-info? contract-call? print tx-sender contract-caller block-height', consts: 'true false none' }),
  },
  {
    id: 'michelson', name: 'Michelson (Tezos)', ext: 'tz', color: '#2c7df7', label: 'TZ', cat: 'Smart Contracts',
    g: { line: ['#'], block: [['/*', '*/']], str: '"', kw: 'parameter storage code DROP DUP SWAP PUSH SOME NONE UNIT IF_NONE PAIR CAR CDR LEFT RIGHT IF_LEFT NIL CONS IF_CONS SIZE EMPTY_SET EMPTY_MAP MAP ITER MEM GET UPDATE IF LOOP LOOP_LEFT LAMBDA EXEC DIP FAILWITH CAST RENAME CONCAT SLICE PACK UNPACK ADD SUB MUL EDIV ABS NEG LSL LSR OR AND XOR NOT COMPARE EQ NEQ LT GT LE GE SELF CONTRACT TRANSFER_TOKENS SET_DELEGATE CREATE_CONTRACT IMPLICIT_ACCOUNT NOW AMOUNT BALANCE CHECK_SIGNATURE BLAKE2B SHA256 SHA512 HASH_KEY SOURCE SENDER ADDRESS CHAIN_ID', types: 'unit never bool int nat string chain_id bytes mutez key_hash key signature timestamp address option or pair list set operation contract ticket big_map map lambda', consts: 'True False Unit None Some Left Right Pair Elt' },
  },
  {
    id: 'yul', name: 'Yul', ext: 'yul', color: '#8c8c8c', label: 'YUL', cat: 'Smart Contracts',
    g: C({ kw: 'object code data function let if switch case default for break continue leave', builtins: 'add sub mul div sdiv mod smod exp not lt gt slt sgt eq iszero and or xor byte shl shr sar addmod mulmod signextend keccak256 pc pop mload mstore mstore8 sload sstore tload tstore msize gas address balance selfbalance caller callvalue calldataload calldatasize calldatacopy codesize codecopy extcodesize extcodecopy returndatasize returndatacopy extcodehash create create2 call callcode delegatecall staticcall return revert selfdestruct invalid log0 log1 log2 log3 log4 chainid basefee origin gasprice blockhash coinbase timestamp number prevrandao gaslimit datasize dataoffset datacopy', consts: 'true false' }),
  },
  {
    id: 'fe', name: 'Fe', ext: 'fe', color: '#1b1f24', label: 'FE', cat: 'Smart Contracts',
    g: C({ block: [], kw: 'contract pub fn let mut const struct enum impl trait use if else match for while return self Self emit event revert assert unsafe ingot', types: 'u8 u16 u32 u64 u128 u256 i8 i16 i32 i64 i128 i256 bool address String Map Array', consts: 'true false' }),
  },
  {
    id: 'sway', name: 'Sway (Fuel)', ext: 'sw', color: '#00f58c', label: 'SWY', cat: 'Smart Contracts',
    g: C({ anno: '#\\[[^\\]]*\\]', kw: 'abi as asm break configurable const continue contract deref else enum fn for if impl let library match mod mut predicate pub ref return script self Self storage str struct trait type use where while', types: 'u8 u16 u32 u64 u256 b256 bool str Address ContractId Identity Vec Option Result', consts: 'true false None Some Ok Err' }),
  },
  {
    id: 'aiken', name: 'Aiken (Cardano)', ext: 'ak', color: '#640ff8', label: 'AIK', cat: 'Smart Contracts',
    g: C({ block: [], caps: true, kw: 'and as const else expect fail fn if is let opaque or pub test todo trace type use validator when bench', types: 'Int ByteArray String Bool List Option Data Void Pair Dict', consts: 'True False None Some' }),
  },
  // ------------------------------------------------------------ shaders & GPU
  {
    id: 'glsl', name: 'GLSL', ext: 'glsl vert frag geom tesc tese comp fsh vshader fshader rgen rint rahit rchit rmiss rcall mesh task glslv glslf', color: '#5686a5', label: 'GLS', cat: 'Shaders & GPU',
    g: C({ pre: true, kw: 'attribute const uniform varying buffer shared coherent volatile restrict readonly writeonly layout centroid flat smooth noperspective patch sample break continue do for while switch case default if else subroutine in out inout invariant precise discard return lowp mediump highp precision struct', types: 'void bool int uint float double vec2 vec3 vec4 dvec2 dvec3 dvec4 bvec2 bvec3 bvec4 ivec2 ivec3 ivec4 uvec2 uvec3 uvec4 mat2 mat3 mat4 mat2x2 mat2x3 mat2x4 mat3x2 mat3x3 mat3x4 mat4x2 mat4x3 mat4x4 sampler1D sampler2D sampler3D samplerCube sampler2DShadow sampler2DArray image2D atomic_uint', builtins: 'gl_Position gl_FragCoord gl_FragColor gl_FragDepth gl_VertexID gl_InstanceID gl_PointSize gl_GlobalInvocationID gl_LocalInvocationID gl_WorkGroupID radians degrees sin cos tan asin acos atan pow exp log exp2 log2 sqrt inversesqrt abs sign floor ceil fract mod min max clamp mix step smoothstep length distance dot cross normalize reflect refract faceforward matrixCompMult transpose inverse determinant lessThan greaterThan equal notEqual any all not texture texture2D textureLod texelFetch dFdx dFdy fwidth EmitVertex EndPrimitive barrier', consts: 'true false' }),
  },
  {
    id: 'hlsl', name: 'HLSL', ext: 'hlsl fx fxh hlsli usf ush', color: '#aace60', label: 'HLS', cat: 'Shaders & GPU',
    g: C({ pre: true, kw: 'break case cbuffer centroid class const continue default discard do else export extern for groupshared if in inline inout interface linear namespace nointerpolation noperspective out packoffset register return sample sampler shared snorm static struct switch tbuffer technique technique10 technique11 pass typedef uniform unorm volatile while precise', types: 'bool int uint dword half float double min16float min10float min16int min12int min16uint float2 float3 float4 float2x2 float3x3 float4x4 float3x4 float4x3 int2 int3 int4 uint2 uint3 uint4 half2 half3 half4 bool2 bool3 bool4 matrix vector void Texture1D Texture2D Texture3D TextureCube Texture2DArray RWTexture2D Buffer RWBuffer StructuredBuffer RWStructuredBuffer ByteAddressBuffer RWByteAddressBuffer SamplerState SamplerComparisonState', builtins: 'SV_Position SV_Target SV_Depth SV_VertexID SV_InstanceID SV_DispatchThreadID SV_GroupID SV_GroupThreadID SV_GroupIndex POSITION NORMAL TEXCOORD0 TEXCOORD1 COLOR TANGENT mul dot cross normalize length lerp saturate clamp abs min max pow sqrt rsqrt sin cos tan frac floor ceil step smoothstep reflect refract ddx ddy tex2D Sample SampleLevel Load GroupMemoryBarrierWithGroupSync', consts: 'true false' }),
  },
  {
    id: 'metal', name: 'Metal Shading Language', ext: 'metal', color: '#8f14e9', label: 'MTL', cat: 'Shaders & GPU',
    g: C({ pre: true, anno: '\\[\\[[^\\]]*\\]\\]', kw: 'if else for while do switch case default break continue return struct class enum using namespace template typename constexpr static const kernel vertex fragment device constant threadgroup thread threadgroup_imageblock ray_data object_data visible stage_in', types: 'void bool char short int long float double half uchar ushort uint ulong size_t float2 float3 float4 half2 half3 half4 int2 int3 int4 uint2 uint3 uint4 float2x2 float3x3 float4x4 packed_float3 texture2d texture3d texturecube depth2d sampler atomic_int atomic_uint', builtins: 'metal position thread_position_in_grid threadgroup_position_in_grid thread_position_in_threadgroup vertex_id instance_id color buffer texture access sample read write dot cross normalize length mix clamp saturate', consts: 'true false nullptr' }),
  },
  {
    id: 'shaderlab', name: 'Unity ShaderLab', ext: 'shader', color: '#222c37', label: 'SHD', cat: 'Shaders & GPU',
    g: C({ pre: true, kw: 'Shader Properties SubShader Pass Tags LOD Cull ZWrite ZTest Blend BlendOp ColorMask Offset Stencil Name UsePass GrabPass Fallback CustomEditor Category Lighting Material SetTexture Combine Fog Off On Back Front Always Less LEqual Greater GEqual Equal NotEqual One Zero SrcAlpha OneMinusSrcAlpha CGPROGRAM ENDCG HLSLPROGRAM ENDHLSL CGINCLUDE HLSLINCLUDE', types: 'Float Range Color Vector 2D 3D Cube Int Integer fixed fixed2 fixed3 fixed4 half half2 half3 half4 float float2 float3 float4 float4x4 sampler2D', builtins: 'UnityObjectToClipPos tex2D TRANSFORM_TEX appdata_base v2f' }),
  },
  // ------------------------------------------------------------ hardware
  {
    id: 'vhdl', name: 'VHDL', ext: 'vhd vhdl vho vht', color: '#adb2cb', label: 'VHD', cat: 'Hardware',
    g: { line: ['--'], block: [['/*', '*/']], str: '"', esc: false, dbl: true, ci: true, indent: 'end', openers: 'entity architecture process if case for while loop begin function procedure package component generate block record', extra: [[/'.'/, 'string'], [/[xXbBoO]"[0-9a-fA-F_]*"/, 'number'], [/'[A-Za-z_]\w*/, 'annotation']], kw: 'abs access after alias all and architecture array assert assume attribute begin block body buffer bus case component configuration constant context cover default disconnect downto else elsif end entity exit fairness file for force function generate generic group guarded if impure in inertial inout is label library linkage literal loop map mod nand new next nor not null of on open or others out package parameter port postponed procedure process property protected pure range record register reject release rem report restrict return rol ror select sequence severity shared signal sla sll sra srl strong subtype then to transport type unaffected units until use variable wait when while with xnor xor', types: 'bit bit_vector boolean character integer natural positive real string time std_logic std_logic_vector std_ulogic std_ulogic_vector signed unsigned', consts: 'true false', builtins: 'rising_edge falling_edge to_integer to_unsigned to_signed resize ieee std_logic_1164 numeric_std work' },
  },
  {
    id: 'bluespec', name: 'Bluespec SystemVerilog', ext: 'bsv bs', color: '#12223c', label: 'BSV', cat: 'Hardware',
    g: C({ anno: '\\(\\*[^*]*\\*\\)', kw: 'package endpackage import export interface endinterface module endmodule method endmethod rule endrule function endfunction typedef struct enum union tagged deriving provisos let return if else case endcase matches begin end for while action endaction actionvalue endactionvalue rules endrules instance endinstance typeclass endtypeclass seq endseq par endpar', types: 'Bit Int UInt Bool Reg Wire FIFO Vector Maybe Tuple2 Action ActionValue Empty', consts: 'True False Valid Invalid' }),
  },
  {
    id: 'spice', name: 'SPICE Netlist', ext: 'sp spice cir ckt', color: '#3f5a8a', label: 'SPC', cat: 'Hardware', comment: '*',
    g: { line: [';'], ci: true, call: false, extra: [[/^\*.*$/, 'comment'], [/^\.[A-Za-z]+/, 'keyword'], [/^[RCLVIDQMXEFGHKJBSTWUZ][\w]*/, 'type.identifier'], [/\b\d+(?:\.\d+)?(?:meg|mil|[fpnumkgt])?\b/, 'number']], kw: '' },
  },
  // ------------------------------------------------------------ assembly
  {
    id: 'nasm', name: 'Assembly (x86 NASM/Intel)', ext: 'asm nasm yasm', color: '#6e4c13', label: 'ASM', cat: 'Assembly', aliases: 'x86 intel masm',
    g: ASM({ line: [';'], regs: X86_REGS, kw: `${X86_INS} ${X86_DIR}`, types: SIZE_TYPES }),
  },
  {
    id: 'gas', name: 'Assembly (GNU as / AT&T)', ext: 's sx', color: '#6e4c13', label: 'GAS', cat: 'Assembly', aliases: 'att gnu-as',
    g: ASM({ line: ['#', '//'], block: [['/*', '*/']], regs: `${X86_REGS} ${ARM_REGS} ${RISCV_REGS}`, kw: X86_INS }),
  },
  {
    id: 'armasm', name: 'Assembly (ARM / AArch64)', ext: 'arm armasm aarch64', color: '#0091bd', label: 'ARM', cat: 'Assembly',
    g: ASM({ line: ['@', '//', ';'], block: [['/*', '*/']], regs: ARM_REGS, kw: 'mov mvn add adds sub subs rsb mul mla umull smull sdiv udiv and orr eor bic lsl lsr asr ror cmp cmn tst teq b bl blx bx br blr ret beq bne bgt bge blt ble bhi bls bcs bcc bmi bpl cbz cbnz ldr ldrb ldrh ldrsb ldrsh str strb strh ldp stp ldm stm push pop adr adrp svc swi nop wfi wfe dmb dsb isb mrs msr csel cset' }),
  },
  {
    id: 'riscv', name: 'Assembly (RISC-V)', ext: 'riscv rv', color: '#fdb515', label: 'RV', cat: 'Assembly',
    g: ASM({ line: ['#'], regs: RISCV_REGS, kw: 'add addi sub lui auipc and andi or ori xor xori sll slli srl srli sra srai slt slti sltu sltiu beq bne blt bge bltu bgeu jal jalr lb lh lw ld lbu lhu lwu sb sh sw sd ecall ebreak fence mul mulh div divu rem remu li la mv not neg j jr ret call tail nop beqz bnez' }),
  },
  {
    id: 'avrasm', name: 'Assembly (AVR)', ext: 'avrasm', color: '#e0162b', label: 'AVR', cat: 'Assembly',
    g: ASM({ line: [';'], regs: `${regs('r', 0, 31)} x y z xl xh yl yh zl zh sreg sp`, kw: 'add adc adiw sub subi sbc sbci sbiw and andi or ori eor com neg sbr cbr inc dec tst clr ser mul muls mulsu rjmp ijmp jmp rcall icall call ret reti cpse cp cpc cpi sbrc sbrs sbic sbis brbs brbc breq brne brcs brcc brsh brlo brmi brpl brge brlt mov movw ldi lds ld ldd sts st std lpm spm in out push pop lsl lsr rol ror asr swap bset bclr sbi cbi bst bld sec clc sen cln sez clz sei cli nop sleep wdr' }),
  },
  {
    id: 'asm6502', name: 'Assembly (6502)', ext: '6502 a65', color: '#8b4513', label: '65', cat: 'Assembly',
    g: ASM({ line: [';'], regs: 'a x y', kw: 'adc and asl bcc bcs beq bit bmi bne bpl brk bvc bvs clc cld cli clv cmp cpx cpy dec dex dey eor inc inx iny jmp jsr lda ldx ldy lsr nop ora pha php pla plp rol ror rti rts sbc sec sed sei sta stx sty tax tay tsx txa txs tya' }),
  },
  {
    id: 'z80', name: 'Assembly (Z80)', ext: 'z80 z8a', color: '#4a4a8a', label: 'Z80', cat: 'Assembly',
    g: ASM({ line: [';'], regs: "a b c d e h l f i r ix iy ixh ixl iyh iyl sp pc af bc de hl af'", kw: 'adc add and bit call ccf cp cpd cpdr cpi cpir cpl daa dec di djnz ei ex exx halt im in inc ind indr ini inir jp jr ld ldd lddr ldi ldir neg nop or otdr otir out outd outi pop push res ret reti retn rl rla rlc rlca rld rr rra rrc rrca rrd rst sbc scf set sla sra sll srl sub xor' }),
  },
  {
    id: 'm68k', name: 'Assembly (Motorola 68k)', ext: '68k x68 m68k', color: '#9f4f00', label: '68K', cat: 'Assembly',
    g: ASM({ line: [';'], line0: ['*'], regs: `${regs('d', 0, 7)} ${regs('a', 0, 7)} sp pc sr ccr usp vbr`, kw: 'move movea movem moveq lea pea add adda addi addq addx sub suba subi subq subx muls mulu divs divu and andi or ori eor eori not neg clr cmp cmpa cmpi tst lsl lsr asl asr rol ror swap ext bra bsr beq bne bgt bge blt ble bhi bls bcc bcs bmi bpl dbra dbf jmp jsr rts rte rtr trap nop link unlk' }),
  },
  {
    id: 'llvm', name: 'LLVM IR', ext: 'll', color: '#185619', label: 'LL', cat: 'Assembly',
    g: { line: [';'], str: '"', sigil: '%@', ident: '[A-Za-z_.$][\\w.$]*', extra: [[/![\w.]+/, 'annotation'], [/#\d+/, 'annotation'], [/^[\w.$]+:/, 'type.identifier']], kw: 'define declare global constant private internal external linkonce weak common appending extern_weak linkonce_odr weak_odr dllimport dllexport hidden protected default thread_local unnamed_addr local_unnamed_addr align section gc prefix prologue personality attributes metadata type opaque ret br switch indirectbr invoke resume unreachable add fadd sub fsub mul fmul udiv sdiv fdiv urem srem frem shl lshr ashr and or xor extractelement insertelement shufflevector extractvalue insertvalue alloca load store fence cmpxchg atomicrmw getelementptr trunc zext sext fptrunc fpext fptoui fptosi uitofp sitofp ptrtoint inttoptr bitcast addrspacecast icmp fcmp phi select call tail musttail notail landingpad cleanup catch filter to nuw nsw exact inbounds volatile eq ne ugt uge ult ule sgt sge slt sle oeq ogt oge olt ole one ord ueq une uno nnan ninf nsz arcp fast', types: 'void i1 i8 i16 i32 i64 i128 half bfloat float double fp128 x86_fp80 ptr label token metadata', consts: 'true false null undef poison zeroinitializer none' },
  },
  {
    id: 'mlir', name: 'MLIR', ext: 'mlir', color: '#5ec4b6', label: 'MLR', cat: 'Assembly',
    g: C({ block: [], sigil: '%@^#!', kw: 'func module return br cond_br affine scf arith memref tensor linalg for if else yield to step iter_args loc attributes', types: 'index i1 i8 i16 i32 i64 f16 bf16 f32 f64 tensor memref vector none complex tuple' }),
  },
  {
    id: 'wat', name: 'WebAssembly Text', ext: 'wat wast', color: '#654ff0', label: 'WAT', cat: 'Assembly',
    g: { line: [';;'], block: [['(;', ';)']], nest: true, str: '"', sigil: '$', call: false, ident: '[A-Za-z_][\\w.]*', brackets: [['(', ')']], kw: 'module func param result local global memory table elem data type import export start mut offset block loop if then else end br br_if br_table return call call_indirect drop select unreachable nop i32.const i64.const f32.const f64.const local.get local.set local.tee global.get global.set i32.load i64.load f32.load f64.load i32.load8_s i32.load8_u i32.store i64.store f32.store f64.store i32.store8 memory.size memory.grow i32.add i32.sub i32.mul i32.div_s i32.div_u i32.rem_s i32.rem_u i32.and i32.or i32.xor i32.shl i32.shr_s i32.shr_u i32.eqz i32.eq i32.ne i32.lt_s i32.lt_u i32.gt_s i32.gt_u i32.le_s i32.le_u i32.ge_s i32.ge_u i64.add i64.sub i64.mul i64.div_s i64.eqz i64.eq f32.add f32.sub f32.mul f32.div f64.add f64.sub f64.mul f64.div f64.sqrt f64.eq f64.lt f64.gt', types: 'i32 i64 f32 f64 v128 funcref externref anyfunc' },
  },
  {
    id: 'ptx', name: 'NVIDIA PTX', ext: 'ptx', color: '#76b900', label: 'PTX', cat: 'Assembly',
    g: ASM({ line: ['//'], block: [['/*', '*/']], regs: '%tid %ntid %ctaid %nctaid %laneid %warpid %clock', kw: 'ld st mov add sub mul mad div rem abs neg min max setp selp bra ret exit call cvt cvta and or xor not shl shr bar atom red tex' }),
  },
  {
    id: 'cil', name: 'CIL / MSIL', ext: 'il', color: '#512bd4', label: 'IL', cat: '.NET',
    g: { line: ['//'], block: [['/*', '*/']], str: '"', ident: '[A-Za-z_][\\w.]*', extra: [[/^\s*\.[a-z]+/, 'keyword.directive']], kw: 'ldarg ldarg.0 ldarg.1 ldloc stloc ldc.i4 ldc.i4.0 ldc.i4.1 ldstr call callvirt newobj ret br brtrue brfalse beq bne.un bgt blt add sub mul div nop pop dup box unbox castclass isinst ldfld stfld ldsfld stsfld public private static instance void int32 int64 string object class extends cil managed hidebysig specialname rtspecialname' },
  },
  // ------------------------------------------------------------ quantum
  {
    id: 'openqasm', name: 'OpenQASM', ext: 'qasm', color: '#aa70ff', label: 'QSM', cat: 'Scientific',
    g: C({ kw: 'OPENQASM include qreg creg qubit bit input output gate opaque measure reset barrier if else for while in return def defcal cal box let const ctrl negctrl inv pow gphase delay stretch duration angle float int uint bool complex array end', builtins: 'U CX h x y z s sdg t tdg rx ry rz cx cy cz ch ccx swap cswap u1 u2 u3 id sx', consts: 'pi π tau τ euler true false' }),
  },
  {
    id: 'quil', name: 'Quil', ext: 'quil', color: '#3e8fb0', label: 'QIL', cat: 'Scientific',
    g: H({ sigil: '%', kw: 'DECLARE DEFGATE DEFCIRCUIT DEFFRAME DEFWAVEFORM DEFCAL MEASURE RESET HALT JUMP JUMP-WHEN JUMP-UNLESS LABEL WAIT NOP INCLUDE PRAGMA CONTROLLED DAGGER FORKED AS MATRIX PERMUTATION PAULI-SUM', builtins: 'I X Y Z H S T RX RY RZ PHASE CNOT CZ CCNOT SWAP ISWAP CPHASE' }),
  },
  // ------------------------------------------------------------ research / niche general purpose
  {
    id: 'koka', name: 'Koka', ext: 'kk kki', color: '#215166', label: 'KK', cat: 'Functional',
    g: C({ nest: true, caps: true, kw: 'fun fn val var if then else elif match return with handler handle effect ctl final raw mask override named scoped linear rec co type struct alias con import module pub abstract extern infix infixl infixr', types: 'int float64 string char bool list maybe either exn console div ndet io', consts: 'True False Nothing Just' }),
  },
  {
    id: 'unison', name: 'Unison', ext: 'u', color: '#8b7ac7', label: 'UNI', cat: 'Functional',
    g: HS({ kw: 'ability cases do else handle if let match namespace structural type unique use where with', types: 'Nat Int Float Text Boolean Char Bytes List Optional Request', consts: 'true false None Some' }),
  },
  {
    id: 'pyret', name: 'Pyret', ext: 'arr', color: '#ee1100', label: 'ARR', cat: 'Functional',
    g: H({ block: [['#|', '|#']], str: `"'\``, triple: true, kw: 'fun lam method var rec data cases check where examples if else when end block doc import include provide as from type newtype for and or not is raises satisfies spy table row sieve extend select order by ask then otherwise shadow ref letrec let', types: 'Number String Boolean Any List Option Nothing', consts: 'true false nothing none some' }),
  },
  {
    id: 'red', name: 'Red / Rebol', ext: 'red reds reb rebol r3', color: '#f50000', label: 'RED', cat: 'Scripting', sh: 'red rebol', aliases: 'rebol',
    g: { line: [';'], str: '"', call: false, ident: '[A-Za-z_?!*+\\-][\\w?!*+\\-~.]*', extra: [[/[A-Za-z_?!*+\-][\w?!*+\-~.]*:/, 'variable'], [/:[A-Za-z_][\w?!*+\-~.]*/, 'variable'], [/'[A-Za-z_][\w?!*+\-~.]*/, 'constant'], [/\/[A-Za-z_][\w-]*/, 'annotation'], [/#[\w-]+|%[\w./-]+/, 'string'], [/\{/, 'string', '@braceStr']], states: { braceStr: [[/\{/, 'string', '@push'], [/\}/, 'string', '@pop'], [/[^{}]+/, 'string']] }, kw: 'func function does has make if either unless while until loop repeat foreach forall case switch return exit break continue print prin probe do reduce compose copy append insert remove find select pick first last next back head tail not all any', consts: 'true false none on off yes no' },
  },
  {
    id: 'factor', name: 'Factor', ext: 'factor', color: '#636746', label: 'FAC', cat: 'Scripting',
    g: { line: ['!'], str: '"', ident: '[^\\s]+', call: false, extra: [[/(:)(\s+)(\S+)/, ['keyword', 'white', 'function']], [/\(\s[^)]*\)/, 'comment']], kw: ': ; :: USING: USE: IN: TUPLE: SYMBOL: CONSTANT: GENERIC: M: MACRO: PRIVATE> <PRIVATE if when unless each map reduce filter dup drop swap over rot nip keep bi tri dip call curry compose' },
  },
  {
    id: 'io', name: 'Io', ext: 'io', color: '#a9188d', label: 'IO', cat: 'Scripting', sh: 'io',
    g: C({ line: ['//', '#'], kw: 'block method if ifTrue ifFalse else then loop while for repeat break continue return yield clone setSlot getSlot newSlot updateSlot proto self call Object Lobby Protos', consts: 'true false nil' }),
  },
  {
    id: 'sentinel', name: 'Sentinel (HashiCorp)', ext: 'sentinel', color: '#1563ff', label: 'SNT', cat: 'Build & DevOps',
    g: C({ line: ['//', '#'], kw: 'import param rule main func return if else for in as all any filter map when case break continue contains matches is not and or xor', consts: 'true false null undefined' }),
  },
  // ------------------------------------------------------------ esoteric
  {
    id: 'brainfuck', name: 'Brainfuck', ext: 'bf b brainfuck', color: '#2f2530', label: 'BF', cat: 'Esoteric',
    g: markup([[/[+-]+/, 'keyword'], [/[<>]+/, 'operator'], [/[.,]/, 'function'], [/[\[\]]/, '@brackets'], [/[^+\-<>.,\[\]]+/, 'comment']], {}, { brackets: [['[', ']']] }),
  },
  {
    id: 'befunge', name: 'Befunge', ext: 'befunge b93 b98 bf93', color: '#c0a0c0', label: 'BFG', cat: 'Esoteric',
    g: markup([[/"[^"]*"/, 'string'], [/[0-9a-f]/, 'number'], [/[<>^v?#_|]/, 'keyword'], [/[+\-*\/%!`:\\$]/, 'operator'], [/[.,&~pg]/, 'function'], [/@/, 'annotation']]),
  },
  {
    id: 'lolcode', name: 'LOLCODE', ext: 'lol lols', color: '#cc9900', label: 'LOL', cat: 'Esoteric', comment: 'BTW', block: ['OBTW', 'TLDR'],
    g: { line: ['BTW'], block: [['OBTW', 'TLDR']], str: '"', call: false, kw: 'HAI KTHXBYE CAN HAS I HAS A ITZ R VISIBLE GIMMEH O RLY YA RLY NO WAI OIC MEBBE WTF OMG OMGWTF GTFO IM IN YR IM OUTTA YR UPPIN NERFIN TIL WILE HOW IZ IF U SAY SO FOUND YR AN MKAY SUM DIFF PRODUKT QUOSHUNT MOD BIGGR SMALLR OF BOTH SAEM DIFFRINT EITHER WON NOT ALL ANY SMOOSH MAEK IS NOW', types: 'NUMBR NUMBAR YARN TROOF NOOB BUKKIT', consts: 'WIN FAIL' },
  },
  {
    id: 'rockstar', name: 'Rockstar', ext: 'rock rockstar', color: '#ff0050', label: 'RCK', cat: 'Esoteric',
    g: { str: '"', ci: true, call: false, extra: [[/\([^)]*\)/, 'comment']], kw: 'is was are were says say put into let be takes taking give back return if else while until and or not nor build up knock down listen to shout whisper scream break continue rock roll with at split cast join turn round', consts: 'true false right yes ok wrong no lies nothing nowhere nobody gone mysterious empty silent silence' },
  },
  {
    id: 'arnoldc', name: 'ArnoldC', ext: 'arnoldc', color: '#8b0000', label: 'ARN', cat: 'Esoteric',
    g: markup([[/"[^"]*"/, 'string'], [/IT'S SHOWTIME|YOU HAVE BEEN TERMINATED|TALK TO THE HAND|GET TO THE CHOPPER|HERE IS MY INVITATION|ENOUGH TALK|GET UP|GET DOWN|YOU'RE FIRED|HE HAD TO SPLIT|I LET HIM GO|YOU ARE NOT YOU YOU ARE ME|LET OFF SOME STEAM BENNET|CONSIDER THAT A DIVORCE|KNOCK KNOCK|BECAUSE I'M GOING TO SAY PLEASE|BULLSHIT|YOU HAVE NO RESPECT FOR LOGIC|STICK AROUND|CHILL|LISTEN TO ME VERY CAREFULLY|GIVE THESE PEOPLE AIR|I NEED YOUR CLOTHES YOUR BOOTS AND YOUR MOTORCYCLE|HASTA LA VISTA, BABY|DO IT NOW|GET YOUR ASS TO MARS|HEY CHRISTMAS TREE|YOU SET US UP|I'LL BE BACK/, 'keyword'], [/@(?:I LIED|NO PROBLEMO)/, 'constant'], [/-?\d+/, 'number']]),
  },
  {
    id: 'ook', name: 'Ook!', ext: 'ook', color: '#b8860b', label: 'OOK', cat: 'Esoteric',
    g: markup([[/Ook[.?!]\s+Ook[.?!]/, 'keyword'], [/[^O]+/, 'comment']]),
  },
];
