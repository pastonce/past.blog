> * 本系列主要基于侯捷老师的教学视频进行学习，部分细节会参考[菜鸟教程](https://www.runoob.com/cplusplus/cpp-stl-tutorial.html)
>
> [![](/blogs/Standard-Template-Library/2ff487c0323940c1.png)](https://www.bilibili.com/video/BV1Ui3ue8Edn)

## 什么是C++ STL？

STL全称`Standard Template Library`，即标准模板库，是一套功能强大的 C++ 模板类和函数的集合，它提供了一系列通用的、可复用的算法和数据结构。STL是**基于泛型编程设计**的，这意味着使用模板可以编写出独立于任何特定数据类型的代码（详见[[C++自学 18] | C++模板template](https://past-blog.vercel.app/blog/template-cplusplus)）。

C++标准库往往以头文件的形式呈现，大致可分为三类：

* C++ STL头文件：不带`.h`后缀，如 `#include <vector>`
* 旧式C头文件：带有`.h`后缀，如 `#include <stdio.h>`
* 新式C头文件：去掉头文件后缀`.h`，并加入前缀`c`，如 `#include <cstdio>`

其中，**只有旧式C头文件不封装于`std`命名空间**（详见[[C++自学 22] | C++命名空间与类型转换](https://past-blog.vercel.app/blog/namespace-and-cast)）。

## STL六大部件

STL主要由六大部件组成，分别为容器**Container**、分配器**Allocator**、算法**Algorithm**、迭代器**Iterator**、适配器**Adapter**与仿函数**Functor**.

* 容器是 STL 中最基本的组件之一，提供了各种数据结构，包括`vector`、`list`、`queue`、`stack`、`set`、`map`等
* 分配器提供了一组方法来管理内存，包括分配、构造、销毁和释放，它的主要作用是**将内存分配和对象构造分离**，从而提供更灵活的内存管理方式
* 算法用于对容器中的元素进行各种操作，包括排序、搜索、复制、移动、变换等。这些**算法在使用时不需要关心容器的具体类型**，只需要指定要操作的范围即可
* 迭代器用于遍历容器中的元素，允许以统一的方式访问容器中的元素，而**不用关心容器的内部实现细节**，包括随机访问迭代器、双向迭代器、前向迭代器和输入输出迭代器等
* 适配器用于**将一种容器或迭代器适配成另一种容器或迭代器**，以满足特定的需求，包括栈适配器（stack adapter）、队列适配器（queue adapter）和优先队列适配器（priority queue adapter）等
* 仿函数是可以像函数一样调用的对象，可以用于算法中的各种操作，包括一元函数对象、二元函数对象、谓词等

它们之间的关系见下图：

![](/blogs/Standard-Template-Library/964940b346c338e4.png)

概括来讲，Container 通过 Allocator 取得数据储存空间，Algorithm 通过 Iterator 存取 Container 内容，Functor 可以协助 Algorithm 完成不同的策略变化， Adapter 可以修饰或套接 Functor、Iterator 以及 Container. 以下是一个简单的示例代码，用来统计给定数组中大于等于 40 的元素个数：

```c++
#include <vector>
#include <algorithm>
#include <functional>
#include <iostream>

int main() {
    int ia[6] = {27, 210, 12, 47, 109, 83};
    std::vector<int, std::allocator<int>> vi(ia, ia + 6);

    std::cout << std::count_if(vi.begin(), vi.end(),
                    std::not1(std::bind2nd(std::less<int>(), 40)));
    // 4
}
```

* 其中，`vector` 是一个 Container，`count_if` 是一个 Algorithm，`vi.begin()`和`vi.end()`是 Iterator，`less`是一个 Functor，而`bind2nd`和`not1`都是修饰`less`的 Adapter. 
* 同时在使用这些部件时，均标注了`std`命名空间

## 前闭后开区间

C++标准库中用于容器的 Iterator 都遵循前闭后开原则，**即`.begin()`指向容器第一个元素的开始，而`.end()`则指向容器最后元素的下一个位置的开始**。那么可以用[`.begin()`, `.end()`)来包括容器的所有元素，注意**容器内元素排列不一定是连续空间**。使用 Iterator 的一个遍历写法如下：

```c++
Container<T> c;
...
for (Container<T>::iterator it = c.begin(); it != c.end(); it++)
    ...
```

