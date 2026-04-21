> * 数组是按特定顺序排列的相同类型的数据的集合

## 原始数组的定义与遍历

C++中的原始数组有两种定义方法，如下所示：

```c++
#include <iostream>

int main() {
    int example[5];
    int* ptr = example; // 数组名实际上是一个指针
     
    for (int i = 0; i < 5; i++) {
        example[i] = 2;
        // *(ptr + i) = 2;
        // *(int*)((char*)ptr + 8) = 2; // 指针根据类型计算实际偏移和数值所占空间大小
    }
    
    int* another = new int[5];
    for (int i = 0; i < 5; i++)
        another[i] = 2;
    delete[] another; // 销毁堆上的数组
}
```

* 在栈上定义：**成员类型 数组名[成员数量];** 此方法定义的数组的生存期跟随函数的结束而结束
* 在堆上定义：**指针类型 指针名 = new 成员类型[成员数量];** 此方法定义的数组的生存期将延长到整个程序结束，可以通过`return`传回，因此为避免内存泄漏需要手动销毁（`delete`）；另外，若在被定义在栈上的类中定义一个堆上的数组，会存在间接寻址的问题

由于数组名在C++中实际上是一个相应类型的指针，所以可以像使用指针一样使用数组名。

## std::array

C++中的原始数组并不提供越界检查，且当在堆上定义时难以计算得知数组的大小

```c++
#include <iostream>
#include <array>

class Entity {
public:
    int example1[5];
    int* example2 = new int[5]; // 栈上此处实际存放着指向堆内存的地址
    std::array<int, 5> another;
    
    Entity() {
        for (int i = 0; i < sizeof(example1) / sizeof(int); i++)
            example1[i] = 2;
        for (int i = 0; i < another.size(); i++)
            another[i] = 2;
    }
    ~Entity() {
        delete[] example2;
    }
};

int main() {
    Entity e;
    std::cout << sizeof(e.example2) / sizeof(int) << std::endl; // 2，因为int*大小为8字节
}
```

* **在栈上定义**的数组可以通过`sizeof(数组名)/sizeof(成员类型)`的方式计算大小
* C++标准库中的`array`类型，支持越界检查等安全保护，同时可以通过`array.size()`获取数组大小
* `std::array`的性能最快可与原始数组相同，且并不占用额外大小（`.size()`仅仅只是返回模板参数）
* 通过设置`_ITERATOR_DEBUG_LEVEL = 2`可以开启越界检查

**C++动态数组详见[[C++自学 16] | C++Vector动态数组](https://past-blog.vercel.app/blog/vector-dynamic-array)*