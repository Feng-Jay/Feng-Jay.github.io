---
title: Leetcode Hot-100-TwoPointer
draft: false
tags:
  - leetcode
  - hot100
  - TwoPointer
description: test
date: 2025-03-23
---

## [283. 移动零](https://leetcode.cn/problems/move-zeroes/description/?envType=study-plan-v2&envId=top-100-liked)

这道题是很典型的双指针问题，由于0元素都排在队尾就可以了，我们不用区分他们之间的原来的位置，因此维护的两个指针的含义是:
1. begin 指针指向目前非零元素应该放置的下标
2. search指针去寻找0元素，并将其移动到begin指针指向的位置, begin++

```java
class Solution {
    public void moveZeroes(int[] nums) {
        int len = nums.length;
        int begin = 0;
        int search = 0;
        for(; search < len; ++search){
            if(nums[search] != 0 ){
                nums[begin] = nums[search];
                begin++;
            }
        }
        for(;begin < len; ++begin){
            nums[begin] = 0;
        }
    }
}
```
记得在最后将begin之后的元素都设置为0

## [11. 盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/description/?envType=study-plan-v2&envId=top-100-liked)

这道题给我的真正启示是对双指针问题的形式化验证，当给定容器的两边(i, hi)和(j, hj)时，此时移动短边才有可能得到更大的面积，因为移动长边只会让面积变小, 这样可以把问题规模一步步约减，直到找到最优解:

```java
class Solution {
    public int maxArea(int[] height) {
        int l = 0;
        int r = height.length - 1;
        int ret = 0;
        while(l < r){
            int current = (r - l) * Math.min(height[l], height[r]);
            ret = Math.max(ret, current);
            if (height[l] <= height[r]) l++;
            else r--;
        }
        return ret;
    }
}
```

## [15. 三数之和](https://leetcode.cn/problems/3sum/description/?envType=study-plan-v2&envId=top-100-liked)

这道题是在双指针外面加了一层循环，思路比较简单，最主要的就是去重:

```java
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        int len = nums.length;
        Arrays.sort(nums);
        List<List<Integer>> ret = new ArrayList<>();
        for(int i = 0; i < len - 2; ++i){
            int currentI = nums[i];
            if (i > 0 && nums[i] == nums[i - 1]){
                continue;
            }
            if (currentI > 0) break;
            int begin = i + 1;
            int end = len - 1;
            while(begin < end){
                if (nums[begin] + nums[end] + currentI == 0){
                    ret.add(List.of(currentI, nums[begin], nums[end]));
                    begin++;
                    end--;
                    while(begin < end && nums[begin] == nums[begin - 1]) begin++;
                    while(begin < end && nums[end] == nums[end + 1]) end--;

                }
                else if (nums[begin] + nums[end] < 0 - currentI){
                    begin++;
                }
                else{
                    end--;
                }
            }
        }
        return ret;
    }
}
```