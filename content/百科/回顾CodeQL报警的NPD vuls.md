This document record the analysis of vuls reported by CodeQL's checker `MissingNullTest.ql`
CodeQL version: `2.23.9.` CodeQL's cpp-queries version: `1.5.8`

## apps/ca.c#do_body#1898#pktmp
FP: If 条件中已经隐含null check了 非Path Sensitive
![[Pasted image 20260228140830.png]]

## apps/ca.c#ca_main#1048#outdir
FP: 几百行之前已经有逻辑判断outdir是否为Null, 若为null 则不会进入该代码段，依旧非Path Sensitive
![[Pasted image 20260228142406.png]]
before:
![[Pasted image 20260228142432.png]]

## apps/ca.c#ca_main#1230#crlnumber
FP: 同样在之前已经有逻辑来判断该变量是否为null, 该例子由两个互相关联的变量`crlnumberfile`和`crlnumber`组成，也是由于非Path Sensitive
![[Pasted image 20260228142808.png]]
![[Pasted image 20260228142748.png]]

## apps/ca.c#ca_main#1247#crlnumber
FP: 同样在之前已经有逻辑来判断该变量是否为null, 该例子由两个互相关联的变量`crlnumberfile`和`crlnumber`组成，也是由于非Path Sensitive
![[Pasted image 20260228143014.png]]
![[Pasted image 20260228142748.png]]

## apps/cmp.c#print_keyspec#3268#alg
FP? 基线里面标的TP: 
the atav maybe null `OSSL_CMP_ATAV_get0_type(atav /* may be NULL */);` 
-> type = null if atav is null 
-> nid = NID_undef 
-> will not reach this switch case. 所以是FP
![[case5.png]]

## apps/cmp.c#cms_main#671#key_param
FP: 依旧是由于非Path Sensitive分析的问题：
往前翻（Line 307）可以看到这里key_first一定是NULL，所以else分支不会被触发
![[case6.png]]

## apps/cmp.c#cms_main#1008#pctx
FP? 基线里面标的TP，这次是也是path insensitive的问题
![[case7.png]]
但其实pctx会依赖ri->type，但ri->type经过CMS_add1_recipient初始化只有这两种可能，不会有其他可能：
![[case7_ass.png]]

## apps/cmp.c#cms_main#1059#cms
FP: 依然是path insensitive的问题
当前分支需要operation = SMIME_SIGN_RECEIPT, 而若为该值，则923行就会成功对cms进行初始化而不会为NULL
![[case8.png]]

## apps/cmp.c#cms_main#1120#cms
FP: operation这里一定会等于SMIME_SIGN，所以cms一定不为空
![[case9.png]]
##apps/cmp.c#cms_main#1140#cms&&apps/cmp.c#cms_main#1143#cms
两个都是FP: 同样当operation == SMIME_SIGN时cms一定是被初始化过的
![[case1011.png]]

## apps/cmp.c#cms_main#1228#rcms
FP: 依旧是path insensitive
![[case12.png]]
可以看到当rctfile（来自用户参数）一定不为空， rcms也一定不为空
![[case12_ass.png]]

## apps/dsa.c#dsa_main#272#ectx
FP: 可以在报警位置之前已经有if分支判断ectx是否为空了
![[case13.png]]

## apps/dsa.c#dsa_main#291#ectx
FP: 同样，在之前已经有if分支判断了
![[cse13.png]]

## apps/ec.c#ec_main#261#ectx && apps/ec.c#ec_main#268#ectx
FP: 被调用函数内已经有null-check了

![[case14.png]]
不过没有直接在一层的依赖里面: 在与if-condition有依赖的语句中
![[case14_ass1.png]]![[case14_ass2.png]]

## apps/ecparam.c#ecparam_main#311#ectx_params
FP: 同样，在被调用函数中已经有了null-check的逻辑，同样也不是直接作用在if条件中
![[case16.png]]

## apps/ecparam.c#ecparam_main#329#gctx_key && apps/ecparam.c#ecparam_main#337#ectx_key
两个都是FP: 同样，被调用函数中已经有了null-check的逻辑，同样也不是直接作用在if条件中，且逻辑比较复杂，设计多个goto之间的调用逻辑
![[case17.png]]
示例：
keygen_init的返回值：
![[case17_ass.png]]

## apps/engine.c#engine_main#392#id

FP: 同样path insensitive, if条件已经确保id不会为NULL
![[case19-1.png]]

## apps/engine.c#engine_main#392#strcmp(ENGINE_get_id(e), id)
FP: 同样path insensitive, if条件已经确保id不会为NULL

## apps/engine.c#util_do_cmds#262#cmd
FP: 同样，之前已经有条件判断确保cmd不为空
![[case21.png]]

## apps/lib/app_rand.c#app_RAND_load#72#p
FP: 同理，path insensitive导致的，for循环条件约束了当进入循环体后randfiles必然不为空，p也必不会为NULL
![[case22.png]]

## apps/lib/app.c#load_crl_crldp#2459#dp
FP: 同样，for循环条件已经暗含了语义
此外，这些例子很多语义是存在于macros中，需要谨慎处理
![[case23.png]]

## apps/lib/app.c#next_protos_parse#2184#out

FP: 该例子是数据依赖，同样，out的值若为空则app直接shutdown，这个例子相比之前所考虑的结构更加复杂
![[case24.png]]

## apps/lib/tlssrp_depr.c#srp_Verify_N_and_g#43#bn_ctx
FP: 被调函数中直接存在null check
![[case25.png]]
![[case25_ass.png]]


## apps/ocsp.c#make_ocsp_response#1094#bs
5个TP均由此而来: bs内存分配失败需要判断
![[case26.png]]

## apps/ocsp.c#ocsp_main#701#req
FP: 依旧是忽略了部分条件，路径不敏感
可以看到之前已经对req是否为Null进行了判断，在当前分支不可能为空
![[case31.png]]
![[case31_ass.png]]
## apps/ocsp.c#ocsp_main#724#req && apps/ocsp.c#ocsp_main#724#rsigner
2FP: 同样之前有很多条件约束了该情况：

![[case32.png]]
约束req:
![[case32_ass.png]]
约束rsigner:
![[case32_ass2.png]]

## apps/openssl.c#main#282#prog
FP: 同样可以发现在比较近的地方已经有if条件判断prog了
![[case35.png]]

## apps/passwd.c#passwd_main#263#passwds
FP: 很显然
![[case36.png]]

## apps/passwd.c#passwd_main#286#passwds
FP: 很显然
![[case37.png]]
## apps/pkeyutl.c#pkeyutl_main#324#mctx
FP: 被调函数中解引用的部分依旧需要rawin需要满足约束，所以不可能为NULL
![[case_38.png]]
![[case38_ass.png]]

## apps/req.c#req_main#908#pkey
FP: 这个例子比较复杂，涉及多个同函数内的if-条件的互相作用
![[case39.png]]
首先该语句执行必须满足newreq == true的前置条件
![[case39_ass.png]]
然后这个if-块确保如果pkey为空则必须给初始化成功
![[case39_ass2.png]]

## apps/req.c#req_main#939#req
FP: 类似的，与多个if-条件相关
![[case40.png]]
## apps/req.c#req_main#974#new_x509&&apps/req.c#req_main#976#req
2个FP: 类似的，new_x509和之前的if条件保证不为空，req传入的函数则存在空检查。
![[case42.png]]

## apps/rsa.c#rsa_main#379#ectx&&396#ectx
FP: 同样因为路径不敏感，同函数前段有对应的检查逻辑
![[case43.png]]
![[case43_ass.png]]

## apps/s_client.c#s_client_main#2172#host
FP: 目前没有找到对应的代码约束其是否为空，应该是使用规范
![[case45.png]]

## apps/s_server.c#s_server_main#2338#host&&port
两个FP: 同样，用户只有在提供ipv4/6地址时host和port才会为空，而这两种情况下都不会对二者进行解引用
switch-case对理解也有帮助
![[case46.png]]
![[case46_ass.png]]

## apps/smime.c#smime_main#611#p7
FP: 这里需要理解operation的所有可能取值以及在各个分支上P7是否被初始化，实际上，在走到该路径时p7一定被初始化了
![[case48.png]]

## apps/speed.c#speed_main#4655#loopargs
FP: 简单的路径不敏感，循环条件是数组长度，若执行循环体则一定不为空
![[case49.png]]