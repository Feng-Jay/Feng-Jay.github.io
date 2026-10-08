把课题的流程更具体化了一些：
	给定Vul相关信息，找到vul specific的程序流，挖掘显式约束（if/while/for/assert conditions） 与隐式约束（例如数组长度len和数组alloc长度相等），将从entry->sink的程序约减为一些约束，然后使用KLEE执行进行验证。

首先需要根据Vul拿到entry -> sink的程序流信息

使用CodeQL，无法解析macros信息：
在openssl上发现很多函数的声明是利用宏展开的，并以函数指针的形式存入了struct：
![[Reduction-SE开发流程exp1.png]]

而CodeQL无法理解该内容，导致生成的call graph 往往缺少内容。

使用SVF: 
SVF在llvm-ir上进行分析，因此宏的问题可以解决:
![[Reduction-SE开发流程exp3.png]]
![[Reduction-SE开发流程exp4.png]]
![[Reduction-SE开发流程exp2.png|697]]
但即使使用了SVF的指针分析功能，仍无法解决函数指针的问题，且耗时很长，生成的call graph中并没有对应的调用链。

目前的想法是使用Static Analysis+ LLM的方式来进行该过程：SVF-generated-CallGraph -> LLM -> trace

实现的demo:

目前实现了一个Agent + tools(rg, tree, func_name_to_source) -> candidate traces:

![[Reduction-SE开发流程exp5-1.png]]

## WEEK#2
针对这样一个CodeQL报警，尝试了一下icfg的提取流程
![[Reduction-SE开发流程w2e2.png]]

DS4-Flash:
Example trace#1
```text
Found: true
Trace#1: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ec_point_ladder_step, crypto/ec/ec_local.h:776) -> (ossl_ec_GFp_simple_ladder_step, crypto/ec/ecp_smpl.c:1560) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#2: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ec_point_ladder_step, crypto/ec/ec_local.h:776) -> (ossl_ec_GFp_simple_ladder_step, crypto/ec/ecp_smpl.c:1560) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#3: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ec_point_ladder_pre, crypto/ec/ec_local.h:762) -> (ossl_ec_GFp_simple_ladder_pre, crypto/ec/ecp_smpl.c:1490) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#4: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ec_point_ladder_post, crypto/ec/ec_local.h:790) -> (ossl_ec_GFp_simple_ladder_post, crypto/ec/ecp_smpl.c:1648) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#5: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ossl_ec_GFp_simple_make_affine, crypto/ec/ecp_smpl.c) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#6: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#7: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
```
Example trace#2:
```text
Trace#1: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_add, crypto/ec/ec_lib.c:938) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#2: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_dbl, crypto/ec/ec_lib.c:953) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#3: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_GFp_simple_points_make_affine, crypto/ec/ecp_smpl.c:1205) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#4: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ossl_ec_GFp_simple_ladder_step, crypto/ec/ecp_smpl.c:1560) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

```
Example trace#3:
```text
Trace#1: (ECDSA_verify, crypto/ec/ecdsa_vrf.c:41) -> (ossl_ecdsa_verify, crypto/ec/ecdsa_ossl.c:419) -> (ECDSA_do_verify, crypto/ec/ecdsa_vrf.c:26) -> (ossl_ecdsa_verify_sig, crypto/ec/ecdsa_ossl.c:63) -> (ossl_ecdsa_simple_verify_sig, crypto/ec/ecdsa_ossl.c:444) -> (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_add, crypto/ec/ec_lib.c:938) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#2: (ECDSA_verify, crypto/ec/ecdsa_vrf.c:41) -> (ossl_ecdsa_verify, crypto/ec/ecdsa_ossl.c:419) -> (ECDSA_do_verify, crypto/ec/ecdsa_vrf.c:26) -> (ossl_ecdsa_verify_sig, crypto/ec/ecdsa_ossl.c:63) -> (ossl_ecdsa_simple_verify_sig, crypto/ec/ecdsa_ossl.c:444) -> (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_dbl, crypto/ec/ec_lib.c:953) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
```

Example trace#4:
```text
Trace#1: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ec_point_ladder_step, crypto/ec/ec_local.h:776) -> (ossl_ec_GFp_simple_ladder_step, crypto/ec/ecp_smpl.c:1560) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#2: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ec_point_ladder_pre, crypto/ec/ec_local.h:762) -> (ossl_ec_GFp_simple_ladder_pre, crypto/ec/ecp_smpl.c:1490) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#3: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_dbl, crypto/ec/ec_lib.c:953) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#4: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_add, crypto/ec/ec_lib.c:938) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#5: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_GFp_simple_points_make_affine, crypto/ec/ecp_smpl.c:1205) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#6: (EC_POINT_oct2point, crypto/ec/ec_oct.c:109) -> (ossl_ec_GFp_simple_oct2point, crypto/ec/ecp_oct.c:273) -> (EC_POINT_set_compressed_coordinates, crypto/ec/ec_oct.c:24) -> (ossl_ec_GFp_simple_set_compressed_coordinates, crypto/ec/ecp_oct.c:22) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#7: (EC_POINT_get_affine_coordinates, crypto/ec/ec_lib.c:901) -> (ossl_ec_GFp_simple_point_get_affine_coordinates, crypto/ec/ecp_smpl.c:500) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#8: (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
```


DS4-pro:

Example trace#1:
```text
Trace#1: (EC_POINT_oct2point, crypto/ec/ec_oct.c:109) -> (ossl_ec_GFp_simple_oct2point, crypto/ec/ecp_oct.c:273) -> (EC_POINT_set_compressed_coordinates, crypto/ec/ec_oct.c:24) -> (ossl_ec_GFp_simple_set_compressed_coordinates, crypto/ec/ecp_oct.c:22) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#2: (EC_POINT_oct2point, crypto/ec/ec_oct.c:109) -> (ossl_ec_GFp_simple_oct2point, crypto/ec/ecp_oct.c:273) -> (EC_POINT_set_compressed_coordinates, crypto/ec/ec_oct.c:24) -> (ossl_ec_GFp_simple_set_compressed_coordinates, crypto/ec/ecp_oct.c:22) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#3: (EC_POINT_oct2point, crypto/ec/ec_oct.c:109) -> (ossl_ec_GFp_simple_oct2point, crypto/ec/ecp_oct.c:273) -> (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
Trace#4: (EC_POINT_oct2point, crypto/ec/ec_oct.c:109) -> (ossl_ec_GFp_simple_oct2point, crypto/ec/ecp_oct.c:273) -> (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
```

Example trace#2:
```text
Trace#1: (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#2: (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
```

Example trace#3:
```text
Trace#1: (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#2: (EC_GROUP_new_by_curve_name_ex, crypto/ec/ec_curve.c:3188) -> (ec_group_new_from_data, crypto/ec/ec_curve.c:3026) -> (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#3: (EC_POINT_add, crypto/ec/ec_lib.c:938) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#4: (EC_POINT_dbl, crypto/ec/ec_lib.c:953) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#5: (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#6: (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#7: (EC_POINT_cmp, crypto/ec/ec_lib.c:1014) -> (ossl_ec_GFp_simple_cmp, crypto/ec/ecp_smpl.c:1058) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#8: (EC_POINT_set_compressed_coordinates, crypto/ec/ec_oct.c:24) -> (ossl_ec_GFp_simple_set_compressed_coordinates, crypto/ec/ecp_oct.c:22) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#9: (EC_POINT_oct2point, crypto/ec/ec_oct.c:109) -> (ossl_ec_GFp_simple_oct2point, crypto/ec/ecp_oct.c:273) -> (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#10: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (ossl_ec_scalar_mul_ladder, crypto/ec/ec_mult.c:140) -> (ossl_ec_GFp_simple_ladder_step, crypto/ec/ecp_smpl.c:1560) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#11: (EC_POINT_get_affine_coordinates, crypto/ec/ec_lib.c:901) -> (ossl_ec_GFp_simple_point_get_affine_coordinates, crypto/ec/ecp_smpl.c:500) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

```

Example trace#4:
```text
Trace#1: (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#2: (EC_POINT_add, crypto/ec/ec_lib.c:938) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#3: (EC_POINT_add, crypto/ec/ec_lib.c:938) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#4: (EC_POINT_dbl, crypto/ec/ec_lib.c:953) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#5: (EC_POINT_dbl, crypto/ec/ec_lib.c:953) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#6: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_dbl, crypto/ec/ec_lib.c:953) -> (ossl_ec_GFp_simple_dbl, crypto/ec/ecp_smpl.c:797) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#7: (EC_POINT_mul, crypto/ec/ec_lib.c:1115) -> (ossl_ec_wNAF_mul, crypto/ec/ec_mult.c:403) -> (EC_POINT_add, crypto/ec/ec_lib.c:938) -> (ossl_ec_GFp_simple_add, crypto/ec/ecp_smpl.c:612) -> (ossl_ec_GFp_nist_field_mul, crypto/ec/ecp_nist.c:128) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#8: (EC_POINT_oct2point, crypto/ec/ec_oct.c:109) -> (ossl_ec_GFp_simple_oct2point, crypto/ec/ecp_oct.c:273) -> (EC_POINT_set_compressed_coordinates, crypto/ec/ec_oct.c:24) -> (ossl_ec_GFp_simple_set_compressed_coordinates, crypto/ec/ecp_oct.c:22) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#9: (EC_POINT_set_affine_coordinates, crypto/ec/ec_lib.c:861) -> (ossl_ec_GFp_simple_point_set_affine_coordinates, crypto/ec/ecp_smpl.c:483) -> (ossl_ec_GFp_simple_set_Jprojective_coordinates_GFp, crypto/ec/ecp_smpl.c:375) -> (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)

Trace#10: (EC_POINT_is_on_curve, crypto/ec/ec_lib.c:1000) -> (ossl_ec_GFp_simple_is_on_curve, crypto/ec/ecp_smpl.c:955) -> (ossl_ec_GFp_nist_field_sqr, crypto/ec/ecp_nist.c:153) -> (BN_nist_mod_224, crypto/bn/bn_nist.c:485)
```

发现单纯靠LLM来说，虽然大部分能够找到，但仍然不稳定。
单纯使用SVF+指针分析，仍无法解决一些函数指针：
generated from `-print-fp: Print targets of indirect call site` option:
![[Reduction-SE开发流程w2e1.png]]
目前想法是，把这些指针分析未解决的信息和source code一起给LLM，让SAST起一个guidance的作用，作为一个可选的数据源。

后续的工作流期望是bottom-up的：

从触发点开始，抽取单个函数的CFG，然后自底向上推导vul触发条件（这个条件可以是逻辑表示(e.g. len > 1) 也可以是LLM给出的自然语言描述），主要为了约束CFG的规模。

给定约束完的几条CFG路径后，可以开始进行程序约减（是否可以一次遍历？）

上周跑了一个初步的给Agent漏洞报告和源代码访问，让它判断vul line是否真实存在，以及触发条件的实验：
跑了136条CodeQL warning:
Agent-Think-FP: 101;  大多由于C中union/struct等结构体分配内存连续，开发者故意设置访存越界导致。
Agent-Think-TP: 35; 仅考虑当前行是否可以触发vul，并不考虑真实上下文。


## WEEK#3

目前生成KLEE代码之前的流程都已经完成：
![[Reduction-SE开发流程overview.png]]

主体逻辑是：
1. 给定一个vulnerability report
2. 首先给Agent，让他判断漏洞是否可能发生，如果并非真实漏洞则skip
3. 如果为真实漏洞，那么从report line所在函数构造函数内CFG，从函数entry-> vul点，找到与漏洞相关的代码逻辑
4. cfg遍历结束后，summary这些代码逻辑反应到函数参数上的有哪些
5. 根据已有分析+SVF的callgraph与指针分析结果，查找caller

一些details:
* 单函数的函数内CFG是拿bear capture了项目编译时每个文件加的编译/链接选项后使用clang单独编译文件拿到的，然后拿tree-sitter写了一个CFG-builder, 这样可以处理宏展开的问题，也可以同时把代码格式保留在源码层面:
	![[cfg_output 1.dot]]
* SVF的callgraph和指针分析结果目前使用一种外挂的形式给Agent，作为一种参考：
	在实现部分包装成了一些map，可以根据func signature/file name拿结果

人工注入了一个漏洞，整个流程跑的还算快
![[Reduction-SE开发流程w31.png]]

Time: 3 minutes; Cost: $0.008

目前可能存在的一些问题：
1. 复杂trace上的scability问题，目前是这样考虑的，通过

## WEEK#4

人工植入了一个来自C static 函数的vul：malloc需要判断是否为空，然后再memcpy
![[Reduction-SE开发流程w41-1.png]]

**Step#1: Vulnerability Trigger Condition**
```text
Real vulnerability: true
Trigger: lntmp == NULL && (p - ln) > 0
Related elements: lntmp, ln, p, p - ln, memcpy
```

**Step#2: Step by Step analysis**
1. Func:  [do_create, traces=8](vscode://file//Users/ffengjay/Postgraduate/Prepare4Phd/poc/Reduction-SE/resources/projects/openssl_67b5686b_vul/crypto/asn1/asn_moid.c:76:9) 
Summary: 
```text
Required state: value contains a comma at index i with 0 < i < strlen(value)-1 && value[0..i-1] contains at least one non-whitespace character && OPENSSL_malloc returns NULL (so lntmp == NULL at line 91)
```
2. Func: [oid_module_init, traces=1](vscode://file//Users/ffengjay/Postgraduate/Prepare4Phd/poc/Reduction-SE/resources/projects/openssl_67b5686b_vul/crypto/asn1/asn_moid.c:23:4)
Summary:
```text
Required state: 
CONF_imodule_get_value(md) != NULL 
&& NCONF_get_section(cnf, CONF_imodule_get_value(md)) != NULL 
&& sk_CONF_VALUE_num(NCONF_get_section(cnf, CONF_imodule_get_value(md))) > 0 
&& exists index i in [0, sk_CONF_VALUE_num(...)-1] such that sk_CONF_VALUE_value(NCONF_get_section(cnf, CONF_imodule_get_value(md)), i)->value != NULL 
&& strrchr(value, ',') != NULL && strrchr(value, ',') != value && *(strrchr(value, ',') + 1) != '\0' && the substring before the last comma contains at least one non-whitespace character && OPENSSL_malloc fails inside do_create (returning NULL)
```
但该函数通过callback的方式被调用，SVF给出的潜在caller有28个，无法直接找到对应的caller：
![[Reduction-SE开发流程w43.png]]
Agent通过阅读源码的方式找到对应的结构体和调用位置，确定caller为
3. Func: [module_init, traces=1](vscode://file//Users/ffengjay/Postgraduate/Prepare4Phd/poc/Reduction-SE/resources/projects/openssl_67b5686b_vul/crypto/conf/conf_mod.c:427:23)
Agent在这个过程中约简了一些条件：
例如 `oid_module_init`要求参数CONF_imodule_get_value(md) != NULL 
但其实在module_init中，已经有路径约束要求：
```c
if (!imod->name || !imod->value)
        goto memerr;
```
Summary:
```text
Required state: 
pmod != NULL 
&& pmod->init == oid_module_init 
&& name != NULL 
&& value != NULL 
&& NCONF_get_section(cnf, value) != NULL 
&& sk_CONF_VALUE_num(NCONF_get_section(cnf, value)) > 0 
&& exists index i in [0, sk_CONF_VALUE_num(NCONF_get_section(cnf, value))-1] such that sk_CONF_VALUE_value(NCONF_get_section(cnf, value), i)->value != NULL 
&& strrchr(sk_CONF_VALUE_value(NCONF_get_section(cnf, value), i)->value, ',') != NULL 
&& strrchr(..., ',') != sk_CONF_VALUE_value(...)->value 
&& *(strrchr(..., ',') + 1) != '\0' 
&& the substring of that value before the last comma contains at least one non-whitespace character && OPENSSL_malloc fails inside do_create (returning NULL so lntmp == NULL at line 90)
```
4. Func: [module_run, traces=3](vscode://file//Users/ffengjay/Postgraduate/Prepare4Phd/poc/Reduction-SE/resources/projects/openssl_67b5686b_vul/crypto/conf/conf_mod.c:259:21)
可以看到从268 -> 282行其实有3条trace:
* !md == false 
* !md == true && !(flags & CONF_MFLAGS_NO_DSO) == false
* !md == true && !(flags & CONF_MFLAGS_NO_DSO) == true
![[Reduction-SE开发流程W44.png]]
其实可以看到后两条trace一定会导致进入下面的if后return，这也是控制流图缺少对数据值的建模导致的，但Agent注意到了该问题：
```text
 [Func:module_run Trace 1/3] Stopped at B7: trigger contradiction
  The edge kind is false for !(flags & CONF_MFLAGS_NO_DSO), so flags & CONF_MFLAGS_NO_DSO is non-zero. Combined with the earlier constraint that md == NULL after module_find(name), the condition at line 271 is false, so the assignment md = module_load_dso(cnf, name, value) at line 272 is not executed. 
> md therefore remains NULL, and there is no other assignment to md before the target at line 282. With md == NULL, the if (!md) at line 274 is true and the function returns -1 at line 279, never reaching the target. The required condition at line 282 requires md != NULL and md->init == oid_module_init, which cannot be established because md stays NULL and no later code before the target can change it. Hence the accumulated trace contradicts the trigger condition.
  Continuing other traces.
```
这后两条路径就被剪枝掉了。
feasible路径的summary：
```text
Required state: 
module_find(name) != NULL 
&& module_find(name)->init == oid_module_init 
&& name != NULL 
&& value != NULL 
&& NCONF_get_section(cnf, value) != NULL 
&& sk_CONF_VALUE_num(NCONF_get_section(cnf, value)) > 0 
&& exists index i in [0, sk_CONF_VALUE_num(NCONF_get_section(cnf, value))-1] such that sk_CONF_VALUE_value(NCONF_get_section(cnf, value), i)->value != NULL 
&& strrchr(sk_CONF_VALUE_value(NCONF_get_section(cnf, value), i)->value, ',') != NULL 
&& strrchr(..., ',') != sk_CONF_VALUE_value(...)->value 
&& *(strrchr(..., ',') + 1) != '\0' 
&& the substring before the last comma contains at least one non-whitespace character && OPENSSL_malloc fails inside do_create (returning NULL so lntmp == NULL at line 90)
```
5. Func: [CONF_modules_load, traces=16](vscode://file//Users/ffengjay/Postgraduate/Prepare4Phd/poc/Reduction-SE/resources/projects/openssl_67b5686b_vul/crypto/conf/conf_mod.c:176:25)
同样对于early-exit/return pattern以及其他与控制流无关的条件有重合的条件下，也有trace约减的空间：
![[Reduction-SE开发流程w45-1.png]]
在当前函数中，16个trace，前4个trace都可以通过类似的矛盾约减掉。
第5个trace原本可以生成，但因为prompt指令遵循问题失败（retry=3）
在第6个trace成功总结出一条从public API -> Sink的路径:
```text
Required state: 
cnf != NULL 
&& appname != NULL 
&& NCONF_get_string(cnf, NULL, appname) != NULL 
&& NCONF_get_section(cnf, NCONF_get_string(cnf, NULL, appname)) != NULL && sk_CONF_VALUE_num(NCONF_get_section(cnf, NCONF_get_string(cnf, NULL, appname))) > 0 
&& exists index i in [0, sk_CONF_VALUE_num(...)-1] such that vl = sk_CONF_VALUE_value(NCONF_get_section(cnf, NCONF_get_string(cnf, NULL, appname)), i) satisfies vl != NULL 
&& vl->name != NULL && vl->value != NULL 
&& module_find(vl->name) != NULL 
&& module_find(vl->name)->init == oid_module_init 
&& NCONF_get_section(cnf, vl->value) != NULL 
&& sk_CONF_VALUE_num(NCONF_get_section(cnf, vl->value)) > 0
&& exists index j in [0, sk_CONF_VALUE_num(NCONF_get_section(cnf, vl->value))-1] such that sk_CONF_VALUE_value(NCONF_get_section(cnf, vl->value), j)->value != NULL 
&& strrchr(sk_CONF_VALUE_value(NCONF_get_section(cnf, vl->value), j)->value, ',') != NULL && strrchr(..., ',') != sk_CONF_VALUE_value(...)->value 
&& *(strrchr(..., ',') + 1) != '\0' 
&& the substring before the last comma contains at least one non-whitespace character && OPENSSL_malloc fails inside do_create (returning NULL so lntmp == NULL at line 90)
```

总traces = 8 x 1 x 1 x 3 x 16 = 384条，算上已有约减的，共探索了 1 x 3 x 6 = 18 条，花费30分钟。 要想探索完所有的combination = 600分钟

KLEE生成时会把这条trace上的函数调用链提供给Agent，再给出每个函数寻找caller时的分析（为了让Agent复用一些关于函数指针、callback的分析）。让Agent首先生成KLEE Driver，然后生成对应的stubs

发现也是成功触发了这个植入的漏洞：
![[Reduction-SE开发流程W46.png]]

但这次成功也和这个例子过于简单有关系：漏洞的触发主要是malloc要出错，所以agent直接mock了一个malloc函数，根据外部变量判断是否要返回NULL

```c
void *CRYPTO_malloc(size_t num, const char *file, int line)
{
    (void)file;
    (void)line;

    if (fail_alloc_size != 0 && num == fail_alloc_size)
        return NULL;
    return malloc(num);
}
```

本次生成过程中最有挑战的可能是生成能使路径可达的config或其他类似的字符串信息：
```java
/*
 * The value has a non-leading last comma and a 32-character prefix before it,
 * so do_create() reaches OPENSSL_malloc((p - ln) + 1) with (p - ln) == 32.
 * The requested size is therefore 33.
 */
#define TRIGGER_OID_VALUE "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef,1.2.3.4"
#define TRIGGER_MALLOC_SIZE ((size_t)33)

```

后续可以优化的事情：
1. traces的指数爆炸问题
2. KLEE生成执行过程中的反馈

## WEEK#5
找了一些数据集，目前用的是VulnLoc，主要是一些Fuzzer找出的漏洞，每个都配有PoC
https://github.com/VulnLoc/VulnLoc/tree/main/data/binutils/cve_2017_14745
从中先找了10个case，在本地复现了对应漏洞，并把当时的漏洞report整理了一下

之前和SAILOR对比，发现SAILOR本身其实会有一些问题[[SAILOR-Cases]]
但一直没和一些SOTA的Agent做对比，于是跑了Pi-Agent + DeepSeek-V4-pro:

![[Reduction-SE开发流程W52.png]]

跑了两套Setups:
Setup#1: 把vul type + vul line location + stack trace 都提供给Agent
发现agent可以10/10都成功生成
且有一个特征，基本上不需要符号执行的参与
符号探索空间基本就是10个以内的值或者直接是确定值，感觉是基本上知道PoC是什么了，KLEE的参与只是为了指令遵循
![[Reduction-SE开发流程W51.png]]

Setup#2: 仅提供vul type + vul line location, 去掉stack trace
Agent仅成功生成 5/10
2个CVE因为超出30min的限时没有成功生成
3个CVE生成的proof没有根据prompt规定，从static程序入口进行symbolic探索

同样发现基本上没有很多符号探索的空间，基本上Agent已经知道PoC的细节了
![[Reduction-SE开发流程W53.png]]

感觉其实目前的工作流在一些模糊的检测结果（例如静态工具的报警）上应该还是会有效果的
但如果给出完整的trace，基本上应该没有什么提升空间。