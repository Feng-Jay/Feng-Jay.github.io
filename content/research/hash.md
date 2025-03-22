---
title: Leetcode Hot-100-Hash
draft: false
tags:
  - leetcode
  - hot100
  - hash
description: test
date: 2025-03-22
---

## [1.两数之和](https://leetcode.cn/problems/two-sum/description/?envType=study-plan-v2&envId=top-100-liked)

第一眼看见这道题思路就是双层循环来遍历，对每个元素nums[i], 去遍历找数组中是否存在元素 == target - nums[i]:

```java
class Solution {
  public int[] twoSum(int[] nums, int target) {
      int[] ret = new int [2];
      for(int i = 0; i < nums.length; ++i){
          for (int j = i + 1; j < nums.length; ++j){
              if (nums[i] + nums[j] == target){
                  ret[0] = i;
                  ret[1] = j;
              }
          }
      }
    return ret;
  }
}
```

但这样的操作时间复杂度很大, 达到了O(n^2), 显然不符合题意。可以通过增加空间复杂度的方式来降低时间复杂度，通过一个哈希表的方式:

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for(int i = 0; i < nums.length; ++i){
            if(map.containsKey(target - nums[i])){
                return new int[] {i, map.get(target - nums[i])};
            }
            map.put(nums[i], i);
        }
        return new int[] {-1, -1};
    }
}
```
哈希表中每个key是数组元素本身，value是数组元素的下标。在遍历每个元素时，首先去check一下哈希表中是否存在target - nums[i], 如果存在，则直接返回结果。如果不存在，就把当前元素放入到哈希表当中去。


## [49.字母异位词分组](https://leetcode.cn/problems/group-anagrams/description/?envType=study-plan-v2&envId=top-100-liked)

这道题其实很奇怪，本质就是将一个字符串无损压缩起来，最简单的方式就是排序，或者用官方题解那种对26个字母出现次数计数的形式。个人认为不应该算medium难度的题目:

```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<Integer>> map = new HashMap<>();
        for(int i =0; i < strs.length; ++i){
            char[] chars = strs[i].toCharArray();
            Arrays.sort(chars);
            String sorted = new String(chars);
            if (map.containsKey(sorted)){
                map.get(sorted).add(i);
            }else{
                map.put(sorted, new ArrayList<>(Arrays.asList(i)));
            }
        }
        List<List<String>> ret = new ArrayList<>();
        for(String key: map.keySet()){
            List<String> tmp = new ArrayList<>();
            for (Integer idx: map.get(key)){
                tmp.add(strs[idx]);
            }
            ret.add(tmp);
        }
        return ret;
    }
}
```

## [128.最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/description/?envType=study-plan-v2&envId=top-100-liked)

这道题的描述有点隐晦，相同的数字只能用其中一个, 比如[0, 0, 1, 2, 3]最后的连续序列就是[0, 1, 2, 3], 而不是[0, 0, 1, 2, 3]. 然后解题思路还是如何构建序列长度的映射，我当时的想法是，序列长度只与该序列第一个数字有关，即第一个数字开始的长度为k。而这道题又要找最长的序列，因此起始元素应该是最小，因此对于每个数组元素nums[i], 如果nums[i] - 1在数组中，那么nums[i]就不可能是最长序列的起始元素，反之则有可能。

另外就是记得刚开始做一次去重，不然会超时...

```java
class Solution {
    public int longestConsecutive(int[] nums) {
        int len = nums.length;
        int ret = 0;
        Set<Integer> numsSet = new HashSet<>();
        for(int i = 0; i < len; ++i){
            numsSet.add(nums[i]);
        }  
        for(int num: numsSet){
            int current = num;
            if (numsSet.contains(current - 1)) continue;
            int currentLen = 1;
            while(numsSet.contains(current + 1)){
                current ++;
                currentLen += 1;
            }
            ret = Math.max(ret, currentLen);
        }
        return ret;
    }
}
```